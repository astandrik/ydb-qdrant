import { TypedValues, withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { GLOBAL_POINTS_TABLE } from "../ydb/schema.js";

async function upsertCollectionMeta(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string
): Promise<void> {
  const upsertMeta = `
    DECLARE $collection AS Utf8;
    DECLARE $table AS Utf8;
    DECLARE $dim AS Uint32;
    DECLARE $distance AS Utf8;
    DECLARE $vtype AS Utf8;
    DECLARE $created AS Timestamp;
    UPSERT INTO qdr__collections (collection, table_name, vector_dimension, distance, vector_type, created_at)
    VALUES ($collection, $table, $dim, $distance, $vtype, $created);
  `;
  await withSession(async (s) => {
    await s.executeQuery(upsertMeta, {
      $collection: TypedValues.utf8(metaKey),
      $table: TypedValues.utf8(tableName),
      $dim: TypedValues.uint32(dim),
      $distance: TypedValues.utf8(distance),
      $vtype: TypedValues.utf8(vectorType),
      $created: TypedValues.timestamp(new Date()),
    });
  });
}

export async function createCollectionOneTable(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string
): Promise<void> {
  await upsertCollectionMeta(metaKey, dim, distance, vectorType, tableName);
}

export async function deleteCollectionOneTable(
  metaKey: string,
  uid: string
): Promise<void> {
  const deletePointsYql = `
      DECLARE $uid AS Utf8;
      DELETE FROM ${GLOBAL_POINTS_TABLE} WHERE uid = $uid;
    `;
  await withSession(async (s) => {
    await s.executeQuery(deletePointsYql, {
      $uid: TypedValues.utf8(uid),
    });
  });

  const delMeta = `
    DECLARE $collection AS Utf8;
    DELETE FROM qdr__collections WHERE collection = $collection;
  `;
  await withSession(async (s) => {
    await s.executeQuery(delMeta, { $collection: TypedValues.utf8(metaKey) });
  });
}
