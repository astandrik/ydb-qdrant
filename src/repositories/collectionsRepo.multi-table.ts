import {
  Types,
  TypedValues,
  withSession,
  TableDescription,
  Column,
} from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { upsertCollectionMeta } from "./collectionsRepo.shared.js";

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
