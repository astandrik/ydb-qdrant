import { TypedValues, withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";

export async function upsertCollectionMeta(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string
): Promise<void> {
  const now = new Date();
  const upsertMeta = `
    DECLARE $collection AS Utf8;
    DECLARE $table AS Utf8;
    DECLARE $dim AS Uint32;
    DECLARE $distance AS Utf8;
    DECLARE $vtype AS Utf8;
    DECLARE $created AS Timestamp;
    DECLARE $last_accessed AS Timestamp;
    UPSERT INTO qdr__collections (collection, table_name, vector_dimension, distance, vector_type, created_at, last_accessed_at)
    VALUES ($collection, $table, $dim, $distance, $vtype, $created, $last_accessed);
  `;
  await withSession(async (s) => {
    await s.executeQuery(upsertMeta, {
      $collection: TypedValues.utf8(metaKey),
      $table: TypedValues.utf8(tableName),
      $dim: TypedValues.uint32(dim),
      $distance: TypedValues.utf8(distance),
      $vtype: TypedValues.utf8(vectorType),
      $created: TypedValues.timestamp(now),
      $last_accessed: TypedValues.timestamp(now),
    });
  });
}
