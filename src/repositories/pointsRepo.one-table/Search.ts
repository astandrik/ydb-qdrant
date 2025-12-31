import {
  Types,
  TypedValues,
  withSession,
  createExecuteQuerySettingsWithTimeout,
} from "../../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { buildVectorBinaryParams } from "../../ydb/helpers.js";
import type { DistanceKind } from "../../types.js";
import {
  mapDistanceToKnnFn,
  mapDistanceToBitKnnFn,
} from "../../utils/distance.js";
import { logger } from "../../logging/logger.js";
import { SearchMode, SEARCH_OPERATION_TIMEOUT_MS } from "../../config/env.js";
import { buildPathSegmentsFilter } from "./PathSegmentsFilter.js";
import type { Payload } from "../../types.js";
import type { YdbQdrantScoredPoint } from "../../qdrant/QdrantRestTypes.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };

function assertVectorDimension(
  vector: number[],
  dimension: number,
  messagePrefix = "Vector dimension mismatch"
): void {
  if (vector.length !== dimension) {
    throw new Error(
      `${messagePrefix}: got ${vector.length}, expected ${dimension}`
    );
  }
}

function typedBytesOrFallback(value: Buffer): Ydb.ITypedValue {
  const typedValuesCompat = TypedValues as unknown as {
    bytes?: (v: Buffer) => Ydb.ITypedValue;
    fromNative?: (type: unknown, v: unknown) => Ydb.ITypedValue;
  };

  if (typeof typedValuesCompat.bytes === "function") {
    return typedValuesCompat.bytes(value);
  }

  if (typeof typedValuesCompat.fromNative === "function") {
    return typedValuesCompat.fromNative(Types.BYTES, value);
  }

  throw new Error(
    "ydb-sdk does not support constructing BYTES typed parameters (TypedValues.bytes/fromNative missing); cannot execute vector search"
  );
}

function parseSearchRows(
  rows: Array<{
    items?: Array<
      | {
          textValue?: string;
          floatValue?: number;
        }
      | undefined
    >;
  }>,
  withPayload: boolean | undefined
): YdbQdrantScoredPoint[] {
  return rows.map((row) => {
    const id = row.items?.[0]?.textValue;
    if (typeof id !== "string") {
      throw new Error("point_id is missing in YDB search result");
    }
    let payload: Payload | undefined;
    let scoreIdx = 1;
    if (withPayload) {
      const payloadText = row.items?.[1]?.textValue;
      if (payloadText) {
        try {
          payload = JSON.parse(payloadText) as Payload;
        } catch {
          payload = undefined;
        }
      }
      scoreIdx = 2;
    }
    const score = Number(
      row.items?.[scoreIdx]?.floatValue ?? row.items?.[scoreIdx]?.textValue
    );
    return { id, score, ...(payload ? { payload } : {}) };
  });
}

function buildExactSearchQueryAndParams(args: {
  tableName: string;
  queryVector: number[];
  top: number;
  withPayload: boolean | undefined;
  distance: DistanceKind;
  uid: string;
  filterPaths?: Array<Array<string>>;
}): { yql: string; params: QueryParams; modeLog: string } {
  const { fn, order } = mapDistanceToKnnFn(args.distance);
  const filter = buildPathSegmentsFilter(args.filterPaths);
  const filterWhere = filter ? ` AND ${filter.whereSql}` : "";

  const binaries = buildVectorBinaryParams(args.queryVector);
  const yql = `
        DECLARE $qbinf AS String;
        DECLARE $k AS Uint32;
        DECLARE $uid AS Utf8;
        ${filter?.whereParamDeclarations ?? ""}
        SELECT point_id, ${
          args.withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${args.tableName}
        WHERE uid = $uid${filterWhere}
        ORDER BY score ${order}
        LIMIT $k;
      `;

  const params: QueryParams = {
    ...(filter?.whereParams ?? {}),
    $qbinf: typedBytesOrFallback(binaries.float),
    $k: TypedValues.uint32(args.top),
    $uid: TypedValues.utf8(args.uid),
  };

  return { yql, params, modeLog: "one_table_exact_client_side_serialization" };
}

function buildApproxSearchQueryAndParams(args: {
  tableName: string;
  queryVector: number[];
  top: number;
  withPayload: boolean | undefined;
  distance: DistanceKind;
  uid: string;
  overfetchMultiplier: number;
  filterPaths?: Array<Array<string>>;
}): {
  yql: string;
  params: QueryParams;
  safeTop: number;
  candidateLimit: number;
  modeLog: string;
} {
  const { fn, order } = mapDistanceToKnnFn(args.distance);
  const { fn: bitFn, order: bitOrder } = mapDistanceToBitKnnFn(args.distance);

  const safeTop = args.top > 0 ? args.top : 1;
  const rawCandidateLimit = safeTop * args.overfetchMultiplier;
  const candidateLimit = Math.max(safeTop, rawCandidateLimit);

  const filter = buildPathSegmentsFilter(args.filterPaths);
  const filterWhere = filter ? ` AND ${filter.whereSql}` : "";

  const binaries = buildVectorBinaryParams(args.queryVector);
  const yql = `
        DECLARE $qbin_bit AS String;
        DECLARE $qbinf AS String;
        DECLARE $candidateLimit AS Uint32;
        DECLARE $safeTop AS Uint32;
        DECLARE $uid AS Utf8;
        ${filter?.whereParamDeclarations ?? ""}

        $candidates = (
          SELECT point_id
          FROM ${args.tableName}
          WHERE uid = $uid AND embedding_quantized IS NOT NULL
            ${filterWhere}
          ORDER BY ${bitFn}(embedding_quantized, $qbin_bit) ${bitOrder}
          LIMIT $candidateLimit
        );

        SELECT point_id, ${
          args.withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${args.tableName}
        WHERE uid = $uid
          AND point_id IN $candidates
          ${filterWhere}
        ORDER BY score ${order}
        LIMIT $safeTop;
      `;

  const params: QueryParams = {
    ...(filter?.whereParams ?? {}),
    $qbin_bit: typedBytesOrFallback(binaries.bit),
    $qbinf: typedBytesOrFallback(binaries.float),
    $candidateLimit: TypedValues.uint32(candidateLimit),
    $safeTop: TypedValues.uint32(safeTop),
    $uid: TypedValues.utf8(args.uid),
  };

  return {
    yql,
    params,
    safeTop,
    candidateLimit,
    modeLog: "one_table_approximate_client_side_serialization",
  };
}

async function searchPointsOneTableExact(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number,
  uid: string,
  filterPaths?: Array<Array<string>>
): Promise<YdbQdrantScoredPoint[]> {
  assertVectorDimension(queryVector, dimension);

  const results = await withSession(async (s) => {
    const { yql, params, modeLog } = buildExactSearchQueryAndParams({
      tableName,
      queryVector,
      top,
      withPayload,
      distance,
      uid,
      filterPaths,
    });

    if (logger.isLevelEnabled("debug")) {
      logger.debug(
        {
          tableName,
          distance,
          top,
          withPayload,
          mode: modeLog,
          yql,
          params: {
            uid,
            top,
            vectorLength: queryVector.length,
            vectorPreview: queryVector.slice(0, 3),
          },
        },
        "one_table search (exact): executing YQL"
      );
    }

    const settings = createExecuteQuerySettingsWithTimeout({
      keepInCache: true,
      idempotent: true,
      timeoutMs: SEARCH_OPERATION_TIMEOUT_MS,
    });
    const rs = await s.executeQuery(yql, params, undefined, settings);
    const rowset = rs.resultSets?.[0];
    const rows = (rowset?.rows ?? []) as Array<{
      items?: Array<
        | {
            textValue?: string;
            floatValue?: number;
          }
        | undefined
      >;
    }>;

    return parseSearchRows(rows, withPayload);
  });

  return results;
}

async function searchPointsOneTableApproximate(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number,
  uid: string,
  overfetchMultiplier: number,
  filterPaths?: Array<Array<string>>
): Promise<YdbQdrantScoredPoint[]> {
  assertVectorDimension(queryVector, dimension);

  const results = await withSession(async (s) => {
    const { yql, params, safeTop, candidateLimit, modeLog } =
      buildApproxSearchQueryAndParams({
        tableName,
        queryVector,
        top,
        withPayload,
        distance,
        uid,
        overfetchMultiplier,
        filterPaths,
      });

    if (logger.isLevelEnabled("debug")) {
      logger.debug(
        {
          tableName,
          distance,
          top,
          safeTop,
          candidateLimit,
          mode: modeLog,
          yql,
          params: {
            uid,
            safeTop,
            candidateLimit,
            vectorLength: queryVector.length,
            vectorPreview: queryVector.slice(0, 3),
          },
        },
        "one_table search (approximate): executing YQL"
      );
    }

    const settings = createExecuteQuerySettingsWithTimeout({
      keepInCache: true,
      idempotent: true,
      timeoutMs: SEARCH_OPERATION_TIMEOUT_MS,
    });
    const rs = await s.executeQuery(yql, params, undefined, settings);
    const rowset = rs.resultSets?.[0];
    const rows = (rowset?.rows ?? []) as Array<{
      items?: Array<
        | {
            textValue?: string;
            floatValue?: number;
          }
        | undefined
      >;
    }>;

    return parseSearchRows(rows, withPayload);
  });

  return results;
}

export async function searchPointsOneTable(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number,
  uid: string,
  mode: SearchMode | undefined,
  overfetchMultiplier: number,
  filterPaths?: Array<Array<string>>
): Promise<YdbQdrantScoredPoint[]> {
  if (mode === SearchMode.Exact) {
    return await searchPointsOneTableExact(
      tableName,
      queryVector,
      top,
      withPayload,
      distance,
      dimension,
      uid,
      filterPaths
    );
  }

  return await searchPointsOneTableApproximate(
    tableName,
    queryVector,
    top,
    withPayload,
    distance,
    dimension,
    uid,
    overfetchMultiplier,
    filterPaths
  );
}
