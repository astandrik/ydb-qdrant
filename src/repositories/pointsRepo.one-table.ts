import { TypedValues, Types, withSession } from "../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { buildVectorParam, buildVectorBinaryParams } from "../ydb/helpers.js";
import type { DistanceKind } from "../types";
import { notifyUpsert } from "../indexing/IndexScheduler.js";
import {
  mapDistanceToKnnFn,
  mapDistanceToBitKnnFn,
} from "../utils/distance.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";
import { UPSERT_BATCH_SIZE } from "../ydb/schema.js";
import {
  CLIENT_SIDE_SERIALIZATION_ENABLED,
  SearchMode,
} from "../config/env.js";
import { logger } from "../logging/logger.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };

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

      await withRetry(() => s.executeQuery(ddl, params), {
        isTransient: isTransientYdbError,
        context: { tableName, batchSize: batch.length },
      });
      upserted += batch.length;
    }
  });
  notifyUpsert(tableName, upserted);
  return upserted;
}

async function searchPointsOneTableExact(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number,
  uid: string
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  if (queryVector.length !== dimension) {
    throw new Error(
      `Vector dimension mismatch: got ${queryVector.length}, expected ${dimension}`
    );
  }
  const { fn, order } = mapDistanceToKnnFn(distance);

  const results = await withSession(async (s) => {
    let yql: string;
    let params: QueryParams;

    if (CLIENT_SIDE_SERIALIZATION_ENABLED) {
      const binaries = buildVectorBinaryParams(queryVector);

      yql = `
        DECLARE $qbinf AS String;
        DECLARE $k AS Uint32;
        DECLARE $uid AS Utf8;
        SELECT point_id, ${
          withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${tableName}
        WHERE uid = $uid
        ORDER BY score ${order}
        LIMIT $k;
      `;

      params = {
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
        $qbinf = Knn::ToBinaryStringFloat($qf);
        SELECT point_id, ${
          withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${tableName}
        WHERE uid = $uid
        ORDER BY score ${order}
        LIMIT $k;
      `;

      params = {
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

    const rs = await s.executeQuery(yql, params);
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
  overfetchMultiplier: number
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

  const results = await withSession(async (s) => {
    if (CLIENT_SIDE_SERIALIZATION_ENABLED) {
      const binaries = buildVectorBinaryParams(queryVector);

      // Phase 1: approximate candidate selection using embedding_quantized
      const phase1Query = `
        DECLARE $qbin_bit AS String;
        DECLARE $k AS Uint32;
        DECLARE $uid AS Utf8;
        SELECT point_id
        FROM ${tableName}
        WHERE uid = $uid AND embedding_quantized IS NOT NULL
        ORDER BY ${bitFn}(embedding_quantized, $qbin_bit) ${bitOrder}
        LIMIT $k;
      `;

      logger.debug(
        {
          tableName,
          distance,
          top,
          safeTop,
          candidateLimit,
          mode: "one_table_approximate_phase1_client_side_serialization",
          yql: phase1Query,
          params: {
            uid,
            top: candidateLimit,
            vectorLength: queryVector.length,
            vectorPreview: queryVector.slice(0, 3),
          },
        },
        "one_table search (approximate, phase 1): executing YQL"
      );

      const phase1Params: QueryParams = {
        $qbin_bit:
          typeof TypedValues.bytes === "function"
            ? TypedValues.bytes(binaries.bit)
            : (binaries.bit as unknown as Ydb.ITypedValue),
        $k: TypedValues.uint32(candidateLimit),
        $uid: TypedValues.utf8(uid),
      };

      const rs1 = await s.executeQuery(phase1Query, phase1Params);
      const rowset1 = rs1.resultSets?.[0];
      const rows1 = (rowset1?.rows ?? []) as Array<{
        items?: Array<
          | {
              textValue?: string;
            }
          | undefined
        >;
      }>;

      const candidateIds = rows1
        .map((row) => row.items?.[0]?.textValue)
        .filter((id): id is string => typeof id === "string");

      if (candidateIds.length === 0) {
        return [] as Array<{
          id: string;
          score: number;
          payload?: Record<string, unknown>;
        }>;
      }

      // Phase 2: exact re-ranking on full-precision embedding for candidates only
      const phase2Query = `
        DECLARE $qbinf AS String;
        DECLARE $k AS Uint32;
        DECLARE $uid AS Utf8;
        DECLARE $ids AS List<Utf8>;
        SELECT point_id, ${
          withPayload ? "payload, " : ""
        }${fn}(embedding, $qbinf) AS score
        FROM ${tableName}
        WHERE uid = $uid AND point_id IN $ids
        ORDER BY score ${order}
        LIMIT $k;
      `;

      logger.debug(
        {
          tableName,
          distance,
          top,
          safeTop,
          candidateCount: candidateIds.length,
          mode: "one_table_approximate_phase2_client_side_serialization",
          yql: phase2Query,
          params: {
            uid,
            top: safeTop,
            vectorLength: queryVector.length,
            vectorPreview: queryVector.slice(0, 3),
            ids: candidateIds,
          },
        },
        "one_table search (approximate, phase 2): executing YQL"
      );

      const idsParam = TypedValues.list(Types.UTF8, candidateIds);

      const phase2Params: QueryParams = {
        $qbinf:
          typeof TypedValues.bytes === "function"
            ? TypedValues.bytes(binaries.float)
            : (binaries.float as unknown as Ydb.ITypedValue),
        $k: TypedValues.uint32(safeTop),
        $uid: TypedValues.utf8(uid),
        $ids: idsParam,
      };

      const rs2 = await s.executeQuery(phase2Query, phase2Params);
      const rowset2 = rs2.resultSets?.[0];
      const rows2 = (rowset2?.rows ?? []) as Array<{
        items?: Array<
          | {
              textValue?: string;
              floatValue?: number;
            }
          | undefined
        >;
      }>;

      return rows2.map((row) => {
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
    }

    const qf = buildVectorParam(queryVector);

    // Phase 1: approximate candidate selection using embedding_quantized
    const phase1Query = `
      DECLARE $qf AS List<Float>;
      DECLARE $k AS Uint32;
      DECLARE $uid AS Utf8;
      $qbin_bit = Knn::ToBinaryStringBit($qf);
      SELECT point_id
      FROM ${tableName}
      WHERE uid = $uid AND embedding_quantized IS NOT NULL
      ORDER BY ${bitFn}(embedding_quantized, $qbin_bit) ${bitOrder}
      LIMIT $k;
    `;

    logger.debug(
      {
        tableName,
        distance,
        top,
        safeTop,
        candidateLimit,
        mode: "one_table_approximate_phase1",
        yql: phase1Query,
        params: {
          uid,
          top: candidateLimit,
          vectorLength: queryVector.length,
          vectorPreview: queryVector.slice(0, 3),
        },
      },
      "one_table search (approximate, phase 1): executing YQL"
    );

    const phase1Params: QueryParams = {
      $qf: qf,
      $k: TypedValues.uint32(candidateLimit),
      $uid: TypedValues.utf8(uid),
    };

    const rs1 = await s.executeQuery(phase1Query, phase1Params);
    const rowset1 = rs1.resultSets?.[0];
    const rows1 = (rowset1?.rows ?? []) as Array<{
      items?: Array<
        | {
            textValue?: string;
          }
        | undefined
      >;
    }>;

    const candidateIds = rows1
      .map((row) => row.items?.[0]?.textValue)
      .filter((id): id is string => typeof id === "string");

    if (candidateIds.length === 0) {
      return [] as Array<{
        id: string;
        score: number;
        payload?: Record<string, unknown>;
      }>;
    }

    // Phase 2: exact re-ranking on full-precision embedding for candidates only
    const phase2Query = `
      DECLARE $qf AS List<Float>;
      DECLARE $k AS Uint32;
      DECLARE $uid AS Utf8;
      DECLARE $ids AS List<Utf8>;
      $qbinf = Knn::ToBinaryStringFloat($qf);
      SELECT point_id, ${
        withPayload ? "payload, " : ""
      }${fn}(embedding, $qbinf) AS score
      FROM ${tableName}
      WHERE uid = $uid AND point_id IN $ids
      ORDER BY score ${order}
      LIMIT $k;
    `;

    logger.debug(
      {
        tableName,
        distance,
        top,
        safeTop,
        candidateCount: candidateIds.length,
        mode: "one_table_approximate_phase2",
        yql: phase2Query,
        params: {
          uid,
          top: safeTop,
          vectorLength: queryVector.length,
          vectorPreview: queryVector.slice(0, 3),
          ids: candidateIds,
        },
      },
      "one_table search (approximate, phase 2): executing YQL"
    );

    const idsParam = TypedValues.list(Types.UTF8, candidateIds);

    const phase2Params: QueryParams = {
      $qf: qf,
      $k: TypedValues.uint32(safeTop),
      $uid: TypedValues.utf8(uid),
      $ids: idsParam,
    };

    const rs2 = await s.executeQuery(phase2Query, phase2Params);
    const rowset2 = rs2.resultSets?.[0];
    const rows2 = (rowset2?.rows ?? []) as Array<{
      items?: Array<
        | {
            textValue?: string;
            floatValue?: number;
          }
        | undefined
      >;
    }>;

    return rows2.map((row) => {
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
  overfetchMultiplier: number
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
      uid
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
    overfetchMultiplier
  );
}

export async function deletePointsOneTable(
  tableName: string,
  ids: Array<string | number>,
  uid: string
): Promise<number> {
  let deleted = 0;
  await withSession(async (s) => {
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

      await s.executeQuery(yql, params);
      deleted += 1;
    }
  });
  return deleted;
}
