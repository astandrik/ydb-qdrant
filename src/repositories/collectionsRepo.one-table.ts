import { withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { GLOBAL_POINTS_TABLE, ensureGlobalPointsTable } from "../ydb/schema.js";
import {
  UPSERT_OPERATION_TIMEOUT_MS,
  USE_BATCH_DELETE_FOR_COLLECTIONS,
} from "../config/env.js";
import type { QueryClient, Query } from "@ydbjs/query";
import { List } from "@ydbjs/value/list";
import { Timestamp, Uint32, Utf8 } from "@ydbjs/value/primitive";

const DELETE_COLLECTION_BATCH_SIZE = 10000;

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

function isOutOfBufferMemoryYdbError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (/Out of buffer memory/i.test(msg)) {
    return true;
  }

  if (typeof error === "object" && error !== null) {
    const issues = (error as { issues?: unknown }).issues;
    if (issues !== undefined) {
      const issuesText =
        typeof issues === "string" ? issues : JSON.stringify(issues);
      return /Out of buffer memory/i.test(issuesText);
    }
  }

  return false;
}

async function deletePointsForUidInChunks(
  sql: QueryClient,
  signal: AbortSignal,
  uid: string
): Promise<void> {
  // Best‑effort loop: stop when there are no more rows for this uid.
  // Each iteration only touches a limited number of rows to avoid
  // hitting YDB's per‑operation buffer limits.
  let iterations = 0;
  const MAX_ITERATIONS = 1000;

  while (iterations++ < MAX_ITERATIONS) {
    type SelectRow = { point_id: string };
    type ResultSets = [SelectRow];
    const q: Query<ResultSets> = sql<ResultSets>`
      SELECT point_id
      FROM ${sql.identifier(GLOBAL_POINTS_TABLE)}
      WHERE uid = $uid
      LIMIT $limit;
    `
      .idempotent(true)
      .timeout(UPSERT_OPERATION_TIMEOUT_MS)
      .signal(signal)
      .parameter("uid", new Utf8(uid))
      .parameter("limit", new Uint32(DELETE_COLLECTION_BATCH_SIZE));

    const [rows] = await q;
    const ids = rows
      .map((row) => row.point_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (ids.length === 0) {
      break;
    }

    const idsValue = new List(...ids.map((id) => new Utf8(id)));

    await sql`
      DELETE FROM ${sql.identifier(GLOBAL_POINTS_TABLE)}
      WHERE uid = $uid AND point_id IN $ids;
    `
      .idempotent(true)
      .timeout(UPSERT_OPERATION_TIMEOUT_MS)
      .signal(signal)
      .parameter("uid", new Utf8(uid))
      .parameter("ids", idsValue);
  }
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
  if (USE_BATCH_DELETE_FOR_COLLECTIONS) {
    await withSession(async (sql, signal) => {
      try {
        await sql`
          BATCH DELETE FROM ${sql.identifier(GLOBAL_POINTS_TABLE)}
          WHERE uid = $uid;
        `
          .idempotent(true)
          .timeout(UPSERT_OPERATION_TIMEOUT_MS)
          .signal(signal)
          .parameter("uid", new Utf8(uid));
      } catch (err: unknown) {
        if (!isOutOfBufferMemoryYdbError(err)) {
          throw err;
        }

        // BATCH DELETE already deletes in chunks per partition, but if YDB
        // still reports an out-of-buffer-memory condition, fall back to
        // the same per-uid chunked deletion strategy as the legacy path.
        await deletePointsForUidInChunks(sql, signal, uid);
      }
    });
  } else {
    await withSession(async (sql, signal) => {
      try {
        await sql`
          DELETE FROM ${sql.identifier(GLOBAL_POINTS_TABLE)}
          WHERE uid = $uid;
        `
          .idempotent(true)
          .timeout(UPSERT_OPERATION_TIMEOUT_MS)
          .signal(signal)
          .parameter("uid", new Utf8(uid));
      } catch (err: unknown) {
        if (!isOutOfBufferMemoryYdbError(err)) {
          throw err;
        }

        await deletePointsForUidInChunks(sql, signal, uid);
      }
    });
  }

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
