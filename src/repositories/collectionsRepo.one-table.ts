import { withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { GLOBAL_POINTS_TABLE, ensureGlobalPointsTable } from "../ydb/schema.js";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../config/env.js";
import { Timestamp, Uint32, Utf8 } from "@ydbjs/value/primitive";

async function upsertCollectionMeta(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string
): Promise<void> {
  const now = new Date();
  await withSession(async (sql, signal) => {
    await sql`
      UPSERT INTO qdr__collections (
        collection,
        table_name,
        vector_dimension,
        distance,
        vector_type,
        created_at,
        last_accessed_at
      )
      VALUES ($collection, $table, $dim, $distance, $vtype, $created, $last_accessed);
    `
      .idempotent(true)
      .timeout(UPSERT_OPERATION_TIMEOUT_MS)
      .signal(signal)
      .parameter("collection", new Utf8(metaKey))
      .parameter("table", new Utf8(tableName))
      .parameter("dim", new Uint32(dim))
      .parameter("distance", new Utf8(distance))
      .parameter("vtype", new Utf8(vectorType))
      .parameter("created", new Timestamp(now))
      .parameter("last_accessed", new Timestamp(now));
  });
}

export async function createCollectionOneTable(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType
): Promise<void> {
  await upsertCollectionMeta(
    metaKey,
    dim,
    distance,
    vectorType,
    GLOBAL_POINTS_TABLE
  );
}

export async function deleteCollectionOneTable(
  metaKey: string,
  uid: string
): Promise<void> {
  await ensureGlobalPointsTable();
  await withSession(async (sql, signal) => {
    await sql`
      BATCH DELETE FROM ${sql.identifier(GLOBAL_POINTS_TABLE)}
      WHERE uid = $uid;
    `
      .idempotent(true)
      .timeout(UPSERT_OPERATION_TIMEOUT_MS)
      .signal(signal)
      .parameter("uid", new Utf8(uid));
  });

  await withSession(async (sql, signal) => {
    await sql`
      DELETE FROM qdr__collections
      WHERE collection = $collection;
    `
      .idempotent(true)
      .timeout(UPSERT_OPERATION_TIMEOUT_MS)
      .signal(signal)
      .parameter("collection", new Utf8(metaKey));
  });
}
