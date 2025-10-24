import { Types, TypedValues, withSession } from "../ydb/client.js";
import { buildJsonOrEmpty, buildVectorParam } from "../ydb/helpers.js";
import type { VectorType, DistanceKind } from "../types";
import { logger } from "../logging/logger";
import { APPROX_PRESELECT } from "../config/env.js";

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
      // Ensure embedding_u8 column exists (best-effort; ignore failures on existing tables)
      try {
        await s.executeQuery(
          `ALTER TABLE ${tableName} ADD COLUMN embedding_u8 String;` as any
        );
      } catch {}
      const ddl = `
        DECLARE $id AS Utf8;
        DECLARE $vec AS List<${vectorType === "uint8" ? "Uint8" : "Float"}>;
        DECLARE $vec_u8 AS List<Uint8>;
        DECLARE $payload AS JsonDocument;
        UPSERT INTO ${tableName} (point_id, embedding, embedding_u8, payload)
        VALUES (
          $id,
          Untag(Knn::ToBinaryString${
            vectorType === "uint8" ? "Uint8" : "Float"
          }($vec), "${vectorType === "uint8" ? "Uint8Vector" : "FloatVector"}"),
          Untag(Knn::ToBinaryStringUint8($vec_u8), "Uint8Vector"),
          $payload
        );
      `;
      const params = {
        $id: TypedValues.utf8(id),
        $vec: buildVectorParam(p.vector, vectorType),
        $vec_u8: buildVectorParam(p.vector, "uint8"),
        $payload: buildJsonOrEmpty(p.payload),
      } as const;
      await s.executeQuery(ddl, params as any);
      upserted += 1;
    }
  });
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
  // Coarse-to-fine approximate search without index (quantized uint8 first, then refine on float)
  const preselect = Math.min(APPROX_PRESELECT, Math.max(top * 10, top));
  const yql = `
    DECLARE $qf AS List<${vectorType === "uint8" ? "Uint8" : "Float"}>;
    DECLARE $qu8 AS List<Uint8>;
    DECLARE $k1 AS Uint32;
    DECLARE $k2 AS Uint32;
    $qbinf = Knn::ToBinaryString${
      vectorType === "uint8" ? "Uint8" : "Float"
    }($qf);
    $qbinu8 = Knn::ToBinaryStringUint8($qu8);
    $candidates = (
      SELECT point_id, ${fn}(embedding_u8, $qbinu8) AS coarse
      FROM ${tableName}
      ORDER BY coarse ${order}
      LIMIT $k1
    );
    SELECT t.point_id, ${
      withPayload ? "t.payload," : ""
    } ${fn}(t.embedding, $qbinf) AS score
    FROM ${tableName} AS t
    INNER JOIN $candidates AS c ON c.point_id = t.point_id
    ORDER BY score ${order}
    LIMIT $k2;
  `;
  const qf = buildVectorParam(queryVector, vectorType);
  // For uint8 collections, reuse the same; for float, quantize to uint8
  const qu8 = buildVectorParam(queryVector, "uint8");
  const rs = await withSession(async (s) => {
    return await s.executeQuery(yql, {
      $qf: qf,
      $qu8: qu8,
      $k1: TypedValues.uint32(preselect),
      $k2: TypedValues.uint32(top),
    } as any);
  });
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
