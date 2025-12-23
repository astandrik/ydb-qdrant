import {
  TypedValues,
  Types,
  withSession,
  createExecuteQuerySettings,
  createExecuteQuerySettingsWithTimeout,
} from "../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { buildVectorParam, buildVectorBinaryParams } from "../ydb/helpers.js";
import type { DistanceKind } from "../types";
import {
  mapDistanceToKnnFn,
  mapDistanceToBitKnnFn,
} from "../utils/distance.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";
import { UPSERT_BATCH_SIZE } from "../ydb/schema.js";
import {
  CLIENT_SIDE_SERIALIZATION_ENABLED,
  SearchMode,
  UPSERT_OPERATION_TIMEOUT_MS,
  SEARCH_OPERATION_TIMEOUT_MS,
} from "../config/env.js";
import { logger } from "../logging/logger.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };

const DELETE_FILTER_SELECT_BATCH_SIZE = 1000;

function buildPathSegmentsWhereClause(paths: Array<Array<string>>): {
  whereSql: string;
  params: QueryParams;
} {
  const params: QueryParams = {};
  const orGroups: string[] = [];

  for (let pIdx = 0; pIdx < paths.length; pIdx += 1) {
    const segs = paths[pIdx];
    if (segs.length === 0) {
      throw new Error("delete-by-filter: empty path segments");
    }
    const andParts: string[] = [];
    for (let sIdx = 0; sIdx < segs.length; sIdx += 1) {
      const paramName = `$p${pIdx}_${sIdx}`;
      // payload is JsonDocument; JSON_VALUE supports JsonPath access.
      andParts.push(
        `JSON_VALUE(payload, '$.pathSegments."${sIdx}"') = ${paramName}`
      );
      params[paramName] = TypedValues.utf8(segs[sIdx]);
    }
    orGroups.push(`(${andParts.join(" AND ")})`);
  }

  return {
    whereSql:
      orGroups.length === 1 ? orGroups[0] : `(${orGroups.join(" OR ")})`,
    params,
  };
}

function buildPathSegmentsFilter(paths: Array<Array<string>> | undefined):
  | {
      whereSql: string;
      whereParamDeclarations: string;
      whereParams: QueryParams;
    }
  | undefined {
  if (!paths || paths.length === 0) return undefined;

  const { whereSql, params: whereParams } = buildPathSegmentsWhereClause(paths);
  const whereParamDeclarations = Object.keys(whereParams)
    .sort()
    .map((key) => `DECLARE ${key} AS Utf8;`)
    .join("\n        ");

  return { whereSql, whereParamDeclarations, whereParams };
}

export async function upsertPointsOneTable(
  tableName: string,
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>,
  dimension: number,
  uid: string
): Promise<number> {
  for (const p of points) {
    const id = String(p.id);
    if (p.vector.length !== dimension) {
      const previewLength = Math.min(16, p.vector.length);
      const vectorPreview =
        previewLength > 0 ? p.vector.slice(0, previewLength) : [];
      logger.warn(
        {
          tableName,
          uid,
          pointId: id,
          vectorLen: p.vector.length,
          expectedDimension: dimension,
          vectorPreview,
        },
        "upsertPointsOneTable: vector dimension mismatch"
      );
      throw new Error(
        `Vector dimension mismatch for id=${id}: got ${p.vector.length}, expected ${dimension}`
      );
    }
  }

  let upserted = 0;

  await withSession(async (s) => {
    const settings = createExecuteQuerySettingsWithTimeout({
      keepInCache: true,
      idempotent: true,
      timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
    });
    for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
      const batch = points.slice(i, i + UPSERT_BATCH_SIZE);

      let ddl: string;
      let params: QueryParams;

      if (CLIENT_SIDE_SERIALIZATION_ENABLED) {
        ddl = `
          DECLARE $rows AS List<Struct<
            uid: Utf8,
            point_id: Utf8,
            embedding: String,
            embedding_quantized: String,
            payload: JsonDocument
          >>;

          UPSERT INTO ${tableName} (uid, point_id, embedding, embedding_quantized, payload)
          SELECT
            uid,
            point_id,
            embedding,
            embedding_quantized,
            payload
          FROM AS_TABLE($rows);
        `;

        const rowType = Types.struct({
          uid: Types.UTF8,
          point_id: Types.UTF8,
          embedding: Types.BYTES,
          embedding_quantized: Types.BYTES,
          payload: Types.JSON_DOCUMENT,
        });

        const rowsValue = TypedValues.list(
          rowType,
          batch.map((p) => {
            const binaries = buildVectorBinaryParams(p.vector);
            return {
              uid,
              point_id: String(p.id),
              embedding: binaries.float,
              embedding_quantized: binaries.bit,
              payload: JSON.stringify(p.payload ?? {}),
            };
          })
        );

        params = {
          $rows: rowsValue,
        };
      } else {
        ddl = `
          DECLARE $rows AS List<Struct<
            uid: Utf8,
            point_id: Utf8,
            vec: List<Float>,
            payload: JsonDocument
          >>;

          UPSERT INTO ${tableName} (uid, point_id, embedding, embedding_quantized, payload)
          SELECT
            uid,
            point_id,
            Untag(Knn::ToBinaryStringFloat(vec), "FloatVector") AS embedding,
            Untag(Knn::ToBinaryStringBit(vec), "BitVector") AS embedding_quantized,
            payload
          FROM AS_TABLE($rows);
        `;

        const rowType = Types.struct({
          uid: Types.UTF8,
          point_id: Types.UTF8,
          vec: Types.list(Types.FLOAT),
          payload: Types.JSON_DOCUMENT,
        });

        const rowsValue = TypedValues.list(
          rowType,
          batch.map((p) => ({
            uid,
            point_id: String(p.id),
            vec: p.vector,
            payload: JSON.stringify(p.payload ?? {}),
          }))
        );

        params = {
          $rows: rowsValue,
        };
      }

      logger.debug(
        {
          tableName,
          mode: CLIENT_SIDE_SERIALIZATION_ENABLED
            ? "one_table_upsert_client_side_serialization"
            : "one_table_upsert_server_side_knn",
          batchSize: batch.length,
          yql: ddl,
          params: {
            rows: batch.map((p) => ({
              uid,
              point_id: String(p.id),
              vectorLength: p.vector.length,
              vectorPreview: p.vector.slice(0, 3),
              payload: p.payload ?? {},
            })),
          },
        },
        "one_table upsert: executing YQL"
      );

      await withRetry(() => s.executeQuery(ddl, params, undefined, settings), {
        isTransient: isTransientYdbError,
        context: { tableName, batchSize: batch.length },
      });
      upserted += batch.length;
    }
  });
  return upserted;
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
  if (queryVector.length !== dimension) {
    throw new Error(
      `Vector dimension mismatch: got ${queryVector.length}, expected ${dimension}`
    );
  }
  const { fn, order } = mapDistanceToKnnFn(distance);
  const filter = buildPathSegmentsFilter(filterPaths);
  const filterWhere = filter ? ` AND ${filter.whereSql}` : "";

  const results = await withSession(async (s) => {
    let yql: string;
    let params: QueryParams;

    if (CLIENT_SIDE_SERIALIZATION_ENABLED) {
      const binaries = buildVectorBinaryParams(queryVector);

      yql = `
        DECLARE $qbinf AS String;
        DECLARE $k AS Uint32;
        DECLARE $uid AS Utf8;
        ${filter?.whereParamDeclarations ?? ""}
        SELECT point_id, ${
          withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${tableName}
        WHERE uid = $uid${filterWhere}
        ORDER BY score ${order}
        LIMIT $k;
      `;

      params = {
        ...(filter?.whereParams ?? {}),
        $qbinf:
          typeof TypedValues.bytes === "function"
            ? TypedValues.bytes(binaries.float)
            : (binaries.float as unknown as Ydb.ITypedValue),
        $k: TypedValues.uint32(top),
        $uid: TypedValues.utf8(uid),
      };
    } else {
      const qf = buildVectorParam(queryVector);

      yql = `
        DECLARE $qf AS List<Float>;
        DECLARE $k AS Uint32;
        DECLARE $uid AS Utf8;
        ${filter?.whereParamDeclarations ?? ""}
        $qbinf = Knn::ToBinaryStringFloat($qf);
        SELECT point_id, ${
          withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${tableName}
        WHERE uid = $uid${filterWhere}
        ORDER BY score ${order}
        LIMIT $k;
      `;

      params = {
        ...(filter?.whereParams ?? {}),
        $qf: qf,
        $k: TypedValues.uint32(top),
        $uid: TypedValues.utf8(uid),
      };
    }

    logger.debug(
      {
        tableName,
        distance,
        top,
        withPayload,
        mode: CLIENT_SIDE_SERIALIZATION_ENABLED
          ? "one_table_exact_client_side_serialization"
          : "one_table_exact",
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

    return rows.map((row) => {
      const id = row.items?.[0]?.textValue;
      if (typeof id !== "string") {
        throw new Error("point_id is missing in YDB search result");
      }
      let payload: Record<string, unknown> | undefined;
      let scoreIdx = 1;
      if (withPayload) {
        const payloadText = row.items?.[1]?.textValue;
        if (payloadText) {
          try {
            payload = JSON.parse(payloadText) as Record<string, unknown>;
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
  if (queryVector.length !== dimension) {
    throw new Error(
      `Vector dimension mismatch: got ${queryVector.length}, expected ${dimension}`
    );
  }
  const { fn, order } = mapDistanceToKnnFn(distance);
  const { fn: bitFn, order: bitOrder } = mapDistanceToBitKnnFn(distance);

  const safeTop = top > 0 ? top : 1;
  const rawCandidateLimit = safeTop * overfetchMultiplier;
  const candidateLimit = Math.max(safeTop, rawCandidateLimit);
  const filter = buildPathSegmentsFilter(filterPaths);
  const filterWhere = filter ? ` AND ${filter.whereSql}` : "";

  const results = await withSession(async (s) => {
    let yql: string;
    let params: QueryParams;

    if (CLIENT_SIDE_SERIALIZATION_ENABLED) {
      const binaries = buildVectorBinaryParams(queryVector);

      yql = `
        DECLARE $qbin_bit AS String;
        DECLARE $qbinf AS String;
        DECLARE $candidateLimit AS Uint32;
        DECLARE $safeTop AS Uint32;
        DECLARE $uid AS Utf8;
        ${filter?.whereParamDeclarations ?? ""}

        $candidates = (
          SELECT point_id
          FROM ${tableName}
          WHERE uid = $uid AND embedding_quantized IS NOT NULL
            ${filterWhere}
          ORDER BY ${bitFn}(embedding_quantized, $qbin_bit) ${bitOrder}
          LIMIT $candidateLimit
        );

        SELECT point_id, ${
          withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${tableName}
        WHERE uid = $uid
          AND point_id IN $candidates
          ${filterWhere}
        ORDER BY score ${order}
        LIMIT $safeTop;
      `;

      params = {
        ...(filter?.whereParams ?? {}),
        $qbin_bit:
          typeof TypedValues.bytes === "function"
            ? TypedValues.bytes(binaries.bit)
            : (binaries.bit as unknown as Ydb.ITypedValue),
        $qbinf:
          typeof TypedValues.bytes === "function"
            ? TypedValues.bytes(binaries.float)
            : (binaries.float as unknown as Ydb.ITypedValue),
        $candidateLimit: TypedValues.uint32(candidateLimit),
        $safeTop: TypedValues.uint32(safeTop),
        $uid: TypedValues.utf8(uid),
      };

      logger.debug(
        {
          tableName,
          distance,
          top,
          safeTop,
          candidateLimit,
          mode: "one_table_approximate_client_side_serialization",
          yql,
          params: {
            uid,
            safeTop,
            candidateLimit,
            vectorLength: queryVector.length,
            vectorPreview: queryVector.slice(0, 3),
          },
        },
        "one_table search (approximate): executing YQL with client-side serialization"
      );
    } else {
      const qf = buildVectorParam(queryVector);

      yql = `
        DECLARE $qf AS List<Float>;
        DECLARE $candidateLimit AS Uint32;
        DECLARE $safeTop AS Uint32;
        DECLARE $uid AS Utf8;
        ${filter?.whereParamDeclarations ?? ""}

        $qbin_bit = Knn::ToBinaryStringBit($qf);
        $qbinf = Knn::ToBinaryStringFloat($qf);

        $candidates = (
          SELECT point_id
          FROM ${tableName}
          WHERE uid = $uid AND embedding_quantized IS NOT NULL
            ${filterWhere}
          ORDER BY ${bitFn}(embedding_quantized, $qbin_bit) ${bitOrder}
          LIMIT $candidateLimit
        );

        SELECT point_id, ${
          withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${tableName}
        WHERE uid = $uid
          AND point_id IN $candidates
          ${filterWhere}
        ORDER BY score ${order}
        LIMIT $safeTop;
      `;

      params = {
        ...(filter?.whereParams ?? {}),
        $qf: qf,
        $candidateLimit: TypedValues.uint32(candidateLimit),
        $safeTop: TypedValues.uint32(safeTop),
        $uid: TypedValues.utf8(uid),
      };

      logger.debug(
        {
          tableName,
          distance,
          top,
          safeTop,
          candidateLimit,
          mode: "one_table_approximate",
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

    return rows.map((row) => {
      const id = row.items?.[0]?.textValue;
      if (typeof id !== "string") {
        throw new Error("point_id is missing in YDB search result");
      }
      let payload: Record<string, unknown> | undefined;
      let scoreIdx = 1;
      if (withPayload) {
        const payloadText = row.items?.[1]?.textValue;
        if (payloadText) {
          try {
            payload = JSON.parse(payloadText) as Record<string, unknown>;
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

export async function deletePointsOneTable(
  tableName: string,
  ids: Array<string | number>,
  uid: string
): Promise<number> {
  let deleted = 0;
  await withSession(async (s) => {
    const settings = createExecuteQuerySettings();
    for (const id of ids) {
      const yql = `
        DECLARE $uid AS Utf8;
        DECLARE $id AS Utf8;
        DELETE FROM ${tableName} WHERE uid = $uid AND point_id = $id;
      `;
      const params: QueryParams = {
        $uid: TypedValues.utf8(uid),
        $id: TypedValues.utf8(String(id)),
      };

      await s.executeQuery(yql, params, undefined, settings);
      deleted += 1;
    }
  });
  return deleted;
}

export async function deletePointsByPathSegmentsOneTable(
  tableName: string,
  uid: string,
  paths: Array<Array<string>>
): Promise<number> {
  if (paths.length === 0) {
    return 0;
  }

  const { whereSql, params: whereParams } = buildPathSegmentsWhereClause(paths);

  const whereParamDeclarations = Object.keys(whereParams)
    .sort()
    .map((key) => `DECLARE ${key} AS Utf8;`)
    .join("\n    ");

  const deleteBatchYql = `
    DECLARE $uid AS Utf8;
    DECLARE $limit AS Uint32;
    ${whereParamDeclarations}

    $to_delete = (
      SELECT uid, point_id
      FROM ${tableName}
      WHERE uid = $uid AND ${whereSql}
      LIMIT $limit
    );

    DELETE FROM ${tableName} ON
    SELECT uid, point_id FROM $to_delete;

    SELECT COUNT(*) AS deleted FROM $to_delete;
  `;

  function readDeletedCountFromResult(rs: {
    resultSets?: Array<{
      rows?: unknown[];
    }>;
  }): number {
    type Cell = {
      uint64Value?: number;
      int64Value?: number;
      uint32Value?: number;
      int32Value?: number;
      textValue?: string;
    };
    const rowset = rs.resultSets?.[0];
    const rows =
      (rowset?.rows as
        | Array<{
            items?: Array<Cell | undefined>;
          }>
        | undefined) ?? [];

    const first = rows[0];
    const cell = first?.items?.[0];
    if (!cell) return 0;

    const numeric =
      cell.uint64Value ??
      cell.int64Value ??
      cell.uint32Value ??
      cell.int32Value;
    if (typeof numeric === "number" && Number.isFinite(numeric)) {
      return numeric;
    }

    if (typeof cell.textValue === "string") {
      const parsed = Number(cell.textValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return 0;
  }

  let deleted = 0;
  await withSession(async (s) => {
    const settings = createExecuteQuerySettings();
    // Best-effort loop: stop when there are no more matching rows.
    // Use limited batches to avoid per-operation buffer limits.
    while (true) {
      const rs = (await s.executeQuery(
        deleteBatchYql,
        {
          ...whereParams,
          $uid: TypedValues.utf8(uid),
          $limit: TypedValues.uint32(DELETE_FILTER_SELECT_BATCH_SIZE),
        },
        undefined,
        settings
      )) as {
        resultSets?: Array<{
          rows?: unknown[];
        }>;
      };

      const batchDeleted = readDeletedCountFromResult(rs);
      if (batchDeleted <= 0) {
        break;
      }
      deleted += batchDeleted;
    }
  });

  return deleted;
}
