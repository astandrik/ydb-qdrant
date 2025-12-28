import { withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { Timestamp, Uint32, Utf8 } from "@ydbjs/value/primitive";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../config/env.js";

export async function upsertCollectionMeta(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string
): Promise<void> {
  const now = new Date();
  const upsertMeta = `
    UPSERT INTO qdr__collections (collection, table_name, vector_dimension, distance, vector_type, created_at, last_accessed_at)
    VALUES ($collection, $table, $dim, $distance, $vtype, $created, $last_accessed);
  `;
  await withSession(async (sql, signal) => {
    await sql`${sql.unsafe(upsertMeta)}`
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
