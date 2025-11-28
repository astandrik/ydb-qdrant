import {
  Types,
  TypedValues,
  withSession,
  TableDescription,
  Column,
} from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";

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

export async function createCollectionMultiTable(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string
): Promise<void> {
  await withSession(async (s) => {
    const desc = new TableDescription()
      .withColumns(
        new Column("point_id", Types.UTF8),
        new Column("embedding", Types.BYTES),
        new Column("payload", Types.JSON_DOCUMENT)
      )
      .withPrimaryKey("point_id");
    await s.createTable(tableName, desc);
  });
  await upsertCollectionMeta(metaKey, dim, distance, vectorType, tableName);
}

export async function deleteCollectionMultiTable(
  metaKey: string,
  tableName: string
): Promise<void> {
  await withSession(async (s) => {
    await s.dropTable(tableName);
  });

  const delMeta = `
    DECLARE $collection AS Utf8;
    DELETE FROM qdr__collections WHERE collection = $collection;
  `;
  await withSession(async (s) => {
    await s.executeQuery(delMeta, { $collection: TypedValues.utf8(metaKey) });
  });
}
