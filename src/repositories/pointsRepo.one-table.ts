import { TypedValues, withSession } from "../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { buildJsonOrEmpty, buildVectorParam } from "../ydb/helpers.js";
import type { DistanceKind } from "../types";
import { notifyUpsert } from "../indexing/IndexScheduler.js";
import { mapDistanceToKnnFn } from "../utils/distance.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";

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
  let upserted = 0;
  await withSession(async (s) => {
    for (const p of points) {
      const id = String(p.id);
      if (p.vector.length !== dimension) {
        throw new Error(
          `Vector dimension mismatch for id=${id}: got ${p.vector.length}, expected ${dimension}`
        );
      }
      const ddl = `
        DECLARE $uid AS Utf8;
        DECLARE $id AS Utf8;
        DECLARE $vec AS List<Float>;
        DECLARE $payload AS JsonDocument;
        UPSERT INTO ${tableName} (uid, point_id, embedding, payload)
        VALUES (
          $uid,
          $id,
          Untag(Knn::ToBinaryStringFloat($vec), "FloatVector"),
          $payload
        );
      `;
      const params: QueryParams = {
        $uid: TypedValues.utf8(uid),
        $id: TypedValues.utf8(id),
        $vec: buildVectorParam(p.vector),
        $payload: buildJsonOrEmpty(p.payload),
      };

      await withRetry(() => s.executeQuery(ddl, params), {
        isTransient: isTransientYdbError,
        context: { tableName, id },
      });
      upserted += 1;
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
  const qf = buildVectorParam(queryVector);

  const params: QueryParams = {
    $qf: qf,
    $k2: TypedValues.uint32(top),
    $uid: TypedValues.utf8(uid),
  };

  const query = `
    DECLARE $qf AS List<Float>;
    DECLARE $k2 AS Uint32;
    DECLARE $uid AS Utf8;
    $qbinf = Knn::ToBinaryStringFloat($qf);
    SELECT point_id, ${
      withPayload ? "payload, " : ""
    }${fn}(embedding, $qbinf) AS score
    FROM ${tableName}
    WHERE uid = $uid
    ORDER BY score ${order}
    LIMIT $k2;
  `;

  const rs = await withSession(async (s) => {
    return await s.executeQuery(query, params);
  });

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


