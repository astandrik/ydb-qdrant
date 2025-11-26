import { TypedValues, withSession } from "../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { buildJsonOrEmpty, buildVectorParam } from "../ydb/helpers.js";
import type { DistanceKind } from "../types";
import { logger } from "../logging/logger.js";
import { notifyUpsert } from "../indexing/IndexScheduler.js";
import { VECTOR_INDEX_BUILD_ENABLED } from "../config/env.js";
import { mapDistanceToKnnFn } from "../utils/distance.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };

export async function upsertPoints(
  tableName: string,
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>,
  dimension: number
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
        DECLARE $id AS Utf8;
        DECLARE $vec AS List<Float>;
        DECLARE $payload AS JsonDocument;
        UPSERT INTO ${tableName} (point_id, embedding, payload)
        VALUES (
          $id,
          Untag(Knn::ToBinaryStringFloat($vec), "FloatVector"),
          $payload
        );
      `;
      const params: QueryParams = {
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

// Removed legacy index backfill helper

export async function searchPoints(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  if (queryVector.length !== dimension) {
    throw new Error(
      `Vector dimension mismatch: got ${queryVector.length}, expected ${dimension}`
    );
  }
  const { fn, order } = mapDistanceToKnnFn(distance);
  // Single-phase search over embedding using vector index if present
  const qf = buildVectorParam(queryVector);
  const params: QueryParams = {
    $qf: qf,
    $k2: TypedValues.uint32(top),
  };

  const buildQuery = (useIndex: boolean) => `
    DECLARE $qf AS List<Float>;
    DECLARE $k2 AS Uint32;
    $qbinf = Knn::ToBinaryStringFloat($qf);
    SELECT point_id, ${
      withPayload ? "payload, " : ""
    }${fn}(embedding, $qbinf) AS score
    FROM ${tableName}${useIndex ? " VIEW emb_idx" : ""}
    ORDER BY score ${order}
    LIMIT $k2;
  `;

  let rs;
  if (VECTOR_INDEX_BUILD_ENABLED) {
    try {
      // Try with vector index first
      rs = await withSession(async (s) => {
        return await s.executeQuery(buildQuery(true), params);
      });
      logger.info({ tableName }, "vector index found; using index for search");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const indexUnavailable =
        /not found|does not exist|no such index|no global index|is not ready to use/i.test(
          msg
        );
      if (indexUnavailable) {
        logger.info(
          { tableName },
          "vector index not available (missing or building); falling back to table scan"
        );
        rs = await withSession(async (s) => {
          return await s.executeQuery(buildQuery(false), params);
        });
      } else {
        throw e;
      }
    }
  } else {
    // Vector index usage disabled: always use table scan
    rs = await withSession(async (s) => {
      return await s.executeQuery(buildQuery(false), params);
    });
  }
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

export async function deletePoints(
  tableName: string,
  ids: Array<string | number>
): Promise<number> {
  let deleted = 0;
  await withSession(async (s) => {
    for (const id of ids) {
      const yql = `
        DECLARE $id AS Utf8;
        DELETE FROM ${tableName} WHERE point_id = $id;
      `;
      const params: QueryParams = {
        $id: TypedValues.utf8(String(id)),
      };
      await s.executeQuery(yql, params);
      deleted += 1;
    }
  });
  return deleted;
}

