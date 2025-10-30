import { TypedValues, withSession } from "../ydb/client.js";
import { buildJsonOrEmpty, buildVectorParam } from "../ydb/helpers.js";
import type { VectorType, DistanceKind } from "../types";
import { logger } from "../logging/logger";
import { APPROX_PRESELECT } from "../config/env.js";
import { notifyUpsert } from "../indexing/IndexScheduler.js";

export async function upsertPoints(
  tableName: string,
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>,
  vectorType: VectorType,
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
        DECLARE $vec AS List<${vectorType === "uint8" ? "Uint8" : "Float"}>;
        DECLARE $payload AS JsonDocument;
        UPSERT INTO ${tableName} (point_id, embedding, payload)
        VALUES (
          $id,
          Untag(Knn::ToBinaryString${
            vectorType === "uint8" ? "Uint8" : "Float"
          }($vec), "${vectorType === "uint8" ? "Uint8Vector" : "FloatVector"}"),
          $payload
        );
      `;
      const params = {
        $id: TypedValues.utf8(id),
        $vec: buildVectorParam(p.vector, vectorType),
        $payload: buildJsonOrEmpty(p.payload),
      } as const;

      // Retry on transient schema/metadata mismatches during index rebuild
      const maxRetries = 6; // ~ up to ~ (0.25 + jitter) * 2^5 ≈ few seconds
      let attempt = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          await s.executeQuery(ddl, params as any);
          break;
        } catch (e: any) {
          const msg = String(e?.message ?? e);
          const isTransient =
            /Aborted|schema version mismatch|Table metadata loading|Failed to load metadata/i.test(
              msg
            );
          if (!isTransient || attempt >= maxRetries) {
            throw e;
          }
          const backoffMs = Math.floor(
            250 * Math.pow(2, attempt) + Math.random() * 100
          );
          logger.warn(
            { tableName, id, attempt, backoffMs },
            "upsert aborted due to schema/metadata change; retrying"
          );
          await new Promise((r) => setTimeout(r, backoffMs));
          attempt += 1;
        }
      }
      upserted += 1;
    }
  });
  // notify scheduler for potential end-of-batch index build
  notifyUpsert(tableName, upserted);
  // No index rebuild; approximate search does not require it
  return upserted;
}

// Removed legacy index backfill helper

export async function searchPoints(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  vectorType: VectorType,
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
  const preselect = Math.min(APPROX_PRESELECT, Math.max(top * 10, top));

  const qf = buildVectorParam(queryVector, vectorType);
  const params = {
    $qf: qf,
    $k2: TypedValues.uint32(top),
  } as any;

  const buildQuery = (useIndex: boolean) => `
    DECLARE $qf AS List<${vectorType === "uint8" ? "Uint8" : "Float"}>;
    DECLARE $k2 AS Uint32;
    $qbinf = Knn::ToBinaryString${
      vectorType === "uint8" ? "Uint8" : "Float"
    }($qf);
    SELECT point_id, ${
      withPayload ? "payload, " : ""
    }${fn}(embedding, $qbinf) AS score
    FROM ${tableName}${useIndex ? " VIEW emb_idx" : ""}
    ORDER BY score ${order}
    LIMIT $k2;
  `;

  let rs;
  try {
    // Try with vector index first
    rs = await withSession(async (s) => {
      return await s.executeQuery(buildQuery(true), params);
    });
    logger.info({ tableName }, "vector index found; using index for search");
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    // Fallback to table scan if index not found or not ready
    if (
      /not found|does not exist|no such index|no global index|is not ready to use/i.test(msg)
    ) {
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
  const rowset = rs.resultSets?.[0];
  const rows = (rowset?.rows ?? []) as any[];
  return rows.map((row) => {
    const id = row.items?.[0]?.textValue as string;
    let payload: Record<string, unknown> | undefined;
    let scoreIdx = 1;
    if (withPayload) {
      const payloadText = row.items?.[1]?.textValue as string | undefined;
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
      await s.executeQuery(yql, { $id: TypedValues.utf8(String(id)) } as any);
      deleted += 1;
    }
  });
  return deleted;
}

function mapDistanceToKnnFn(distance: DistanceKind): {
  fn: string;
  order: "ASC" | "DESC";
} {
  switch (distance) {
    case "Cosine":
      return { fn: "Knn::CosineSimilarity", order: "DESC" };
    case "Dot":
      return { fn: "Knn::InnerProductSimilarity", order: "DESC" };
    case "Euclid":
      return { fn: "Knn::EuclideanDistance", order: "ASC" };
    case "Manhattan":
      return { fn: "Knn::ManhattanDistance", order: "ASC" };
    default:
      return { fn: "Knn::CosineSimilarity", order: "DESC" };
  }
}
