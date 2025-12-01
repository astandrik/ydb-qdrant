import { TypedValues, Types, withSession } from "../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { buildVectorParam } from "../ydb/helpers.js";
import type { DistanceKind } from "../types";
import { notifyUpsert } from "../indexing/IndexScheduler.js";
import {
  mapDistanceToKnnFn,
  mapDistanceToBitKnnFn,
} from "../utils/distance.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";
import { UPSERT_BATCH_SIZE } from "../ydb/schema.js";

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
      throw new Error(
        `Vector dimension mismatch for id=${id}: got ${p.vector.length}, expected ${dimension}`
      );
    }
  }

  let upserted = 0;

  await withSession(async (s) => {
    for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
      const batch = points.slice(i, i + UPSERT_BATCH_SIZE);

      const ddl = `
        DECLARE $rows AS List<Struct<
          uid: Utf8,
          point_id: Utf8,
          vec: List<Float>,
          payload: JsonDocument
        >>;

        UPSERT INTO ${tableName} (uid, point_id, embedding, embedding_bit, payload)
        SELECT
          uid,
          point_id,
          Untag(Knn::ToBinaryStringFloat(vec), "FloatVector") AS embedding,
          Untag(Knn::ToBinaryStringBit(vec), "BitVector") AS embedding_bit,
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

      const params: QueryParams = {
        $rows: rowsValue,
      };

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

export async function searchPointsOneTable(
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
  const { fn: bitFn, order: bitOrder } = mapDistanceToBitKnnFn(distance);
  const qf = buildVectorParam(queryVector);

  const candidateLimit = top * 10;

  const results = await withSession(async (s) => {
    // Phase 1: approximate candidate selection using embedding_bit
    const phase1Query = `
      DECLARE $qf AS List<Float>;
      DECLARE $k AS Uint32;
      DECLARE $uid AS Utf8;
      $qbin_bit = Knn::ToBinaryStringBit($qf);
      SELECT point_id
      FROM ${tableName}
      WHERE uid = $uid AND embedding_bit IS NOT NULL
      ORDER BY ${bitFn}(embedding_bit, $qbin_bit) ${bitOrder}
      LIMIT $k;
    `;

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

    const idsParam = TypedValues.list(Types.UTF8, candidateIds);

    const phase2Params: QueryParams = {
      $qf: qf,
      $k: TypedValues.uint32(top),
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
