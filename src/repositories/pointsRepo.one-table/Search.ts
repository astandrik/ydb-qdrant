import { withSession } from "../../ydb/client.js";
import { buildVectorBinaryParams } from "../../ydb/helpers.js";
import type { Query } from "@ydbjs/query";
import type { Value } from "@ydbjs/value";
import { Bytes, Uint32, Utf8 } from "@ydbjs/value/primitive";
import type { DistanceKind } from "../../types";
import {
  mapDistanceToKnnFn,
  mapDistanceToBitKnnFn,
} from "../../utils/distance.js";
import { logger } from "../../logging/logger.js";
import { SearchMode, SEARCH_OPERATION_TIMEOUT_MS } from "../../config/env.js";
import { buildPathSegmentsFilter } from "./PathSegmentsFilter.js";

type QueryParams = Record<string, Value>;

type SearchRow = { point_id: string; score: number; payload?: string };

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

function parsePayloadJson(
  payloadText: unknown
): Record<string, unknown> | undefined {
  if (typeof payloadText !== "string" || payloadText.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(payloadText) as Record<string, unknown>;
  } catch {
    return undefined;
  }
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
    $qbinf: new Bytes(binaries.float),
    $k: new Uint32(args.top),
    $uid: new Utf8(args.uid),
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
    $qbin_bit: new Bytes(binaries.bit),
    $qbinf: new Bytes(binaries.float),
    $candidateLimit: new Uint32(candidateLimit),
    $safeTop: new Uint32(safeTop),
    $uid: new Utf8(args.uid),
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
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  assertVectorDimension(queryVector, dimension);

  const results = await withSession(async (sql, signal) => {
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

    type ResultSets = [SearchRow];
    let q: Query<ResultSets> = sql<ResultSets>`${sql.unsafe(yql)}`
      .idempotent(true)
      .timeout(SEARCH_OPERATION_TIMEOUT_MS)
      .signal(signal);
    for (const [key, value] of Object.entries(params)) {
      q = q.parameter(key, value);
    }

    const [rows] = await q;

    return rows.map((r) => {
      if (!r.point_id) {
        throw new Error("point_id is missing in YDB search result");
      }
      const payload = withPayload ? parsePayloadJson(r.payload) : undefined;
      return {
        id: r.point_id,
        score: Number(r.score),
        ...(payload ? { payload } : {}),
      };
    });
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
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  assertVectorDimension(queryVector, dimension);

  const results = await withSession(async (sql, signal) => {
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

    type ResultSets = [SearchRow];
    let q: Query<ResultSets> = sql<ResultSets>`${sql.unsafe(yql)}`
      .idempotent(true)
      .timeout(SEARCH_OPERATION_TIMEOUT_MS)
      .signal(signal);
    for (const [key, value] of Object.entries(params)) {
      q = q.parameter(key, value);
    }

    const [rows] = await q;
    return rows.map((r) => {
      if (!r.point_id) {
        throw new Error("point_id is missing in YDB search result");
      }
      const payload = withPayload ? parsePayloadJson(r.payload) : undefined;
      return {
        id: r.point_id,
        score: Number(r.score),
        ...(payload ? { payload } : {}),
      };
    });
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
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
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
