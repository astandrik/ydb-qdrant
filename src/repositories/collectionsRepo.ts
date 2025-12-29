import { withSession, withStartupProbeSession } from "../ydb/client.js";
import {
  STARTUP_PROBE_SESSION_TIMEOUT_MS,
  UPSERT_OPERATION_TIMEOUT_MS,
  LAST_ACCESS_MIN_WRITE_INTERVAL_MS,
} from "../config/env.js";
import { logger } from "../logging/logger.js";
import type { DistanceKind, VectorType, CollectionMeta } from "../types";
import { uidFor } from "../utils/tenant.js";
import { attachQueryDiagnostics } from "../ydb/QueryDiagnostics.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";
import {
  createCollectionOneTable,
  deleteCollectionOneTable,
} from "./collectionsRepo.one-table.js";
import { Timestamp, Utf8 } from "@ydbjs/value/primitive";

const lastAccessWriteCache = new Map<string, number>();
const LAST_ACCESS_CACHE_MAX_SIZE = 10000;

type CollectionMetaCacheEntry = {
  meta: CollectionMeta;
  expiresAtMs: number;
};

const collectionMetaCache = new Map<string, CollectionMetaCacheEntry>();
const COLLECTION_META_CACHE_MAX_SIZE = 10000;
// Meta lookups are on the hot path for *every* request (upsert/search/delete).
// Under sustained ingestion, YDB can get busy and even a single-row SELECT can stall.
// Keep meta cached long enough to avoid turning that into a constant DB read load.
const COLLECTION_META_CACHE_TTL_MS = 5 * 60_000;

function evictOldestCollectionMetaEntry(): void {
  if (collectionMetaCache.size < COLLECTION_META_CACHE_MAX_SIZE) {
    return;
  }
  const oldestKey = collectionMetaCache.keys().next().value;
  if (oldestKey !== undefined) {
    collectionMetaCache.delete(oldestKey);
  }
}

function getCachedCollectionMeta(metaKey: string): CollectionMeta | null {
  const entry = collectionMetaCache.get(metaKey);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAtMs) {
    collectionMetaCache.delete(metaKey);
    return null;
  }
  return entry.meta;
}

function setCachedCollectionMeta(metaKey: string, meta: CollectionMeta): void {
  evictOldestCollectionMetaEntry();
  collectionMetaCache.set(metaKey, {
    meta,
    expiresAtMs: Date.now() + COLLECTION_META_CACHE_TTL_MS,
  });
}

// Test-only: keep repository unit tests isolated since this module maintains in-memory caches.
export function __resetCachesForTests(): void {
  collectionMetaCache.clear();
}

function evictOldestLastAccessEntry(): void {
  if (lastAccessWriteCache.size < LAST_ACCESS_CACHE_MAX_SIZE) {
    return;
  }
  const oldestKey = lastAccessWriteCache.keys().next().value;
  if (oldestKey !== undefined) {
    lastAccessWriteCache.delete(oldestKey);
  }
}

function shouldWriteLastAccess(nowMs: number, key: string): boolean {
  const last = lastAccessWriteCache.get(key);
  if (last === undefined) {
    return true;
  }
  return nowMs - last >= LAST_ACCESS_MIN_WRITE_INTERVAL_MS;
}

export async function createCollection(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType
): Promise<void> {
  await createCollectionOneTable(metaKey, dim, distance, vectorType);
  collectionMetaCache.delete(metaKey);
}

export async function getCollectionMeta(
  metaKey: string
): Promise<CollectionMeta | null> {
  const cached = getCachedCollectionMeta(metaKey);
  if (cached) {
    return cached;
  }

  type Row = {
    table_name: string;
    vector_dimension: number;
    distance: string;
    vector_type: string;
    last_accessed_at?: string;
  };

  const [rows] = await withSession(async (sql, signal) => {
    const q = attachQueryDiagnostics(
      sql<[Row]>`
      SELECT
        table_name,
        vector_dimension,
        distance,
        vector_type,
        CAST(last_accessed_at AS Utf8) AS last_accessed_at
      FROM qdr__collections
      WHERE collection = $collection;
    `,
      { operation: "getCollectionMeta", metaKey }
    )
      .idempotent(true)
      // Collection metadata is required for upserts as well; use the more forgiving timeout.
      .timeout(UPSERT_OPERATION_TIMEOUT_MS)
      .signal(signal)
      .parameter("collection", new Utf8(metaKey));
    return await q;
  });

  if (rows.length !== 1) return null;
  const row = rows[0];
  const table = row.table_name;
  const dimension = Number(row.vector_dimension);
  const distance = (row.distance as DistanceKind) ?? ("Cosine" as DistanceKind);
  const vectorType = (row.vector_type as VectorType) ?? "float";
  const lastAccessRaw = row.last_accessed_at;
  const lastAccessedAt =
    typeof lastAccessRaw === "string" && lastAccessRaw.length > 0
      ? new Date(lastAccessRaw)
      : undefined;

  const result: CollectionMeta = {
    table,
    dimension,
    distance,
    vectorType,
  };

  if (lastAccessedAt) {
    result.lastAccessedAt = lastAccessedAt;
  }

  setCachedCollectionMeta(metaKey, result);
  return result;
}

export async function verifyCollectionsQueryCompilationForStartup(): Promise<void> {
  const probeKey = "__startup_probe__/__startup_probe__";
  await withRetry(
    async () => {
      await withStartupProbeSession(async (sql, signal) => {
        await sql`
          SELECT
            table_name,
            vector_dimension,
            distance,
            vector_type,
            CAST(last_accessed_at AS Utf8) AS last_accessed_at
          FROM qdr__collections
          WHERE collection = $collection;
        `
          .idempotent(true)
          .timeout(STARTUP_PROBE_SESSION_TIMEOUT_MS)
          .signal(signal)
          .parameter("collection", new Utf8(probeKey));
      });
    },
    {
      maxRetries: 2,
      baseDelayMs: 200,
      isTransient: isTransientYdbError,
      context: {
        operation: "verifyCollectionsQueryCompilationForStartup",
      },
    }
  );
}

export async function deleteCollection(
  metaKey: string,
  uid?: string
): Promise<void> {
  const meta = await getCollectionMeta(metaKey);
  if (!meta) return;

  let effectiveUid = uid;
  if (!effectiveUid) {
    const [tenant, collection] = metaKey.split("/", 2);
    if (!tenant || !collection) {
      throw new Error(
        `deleteCollection: cannot derive uid from malformed metaKey=${metaKey}`
      );
    }
    effectiveUid = uidFor(tenant, collection);
  }
  await deleteCollectionOneTable(metaKey, effectiveUid);
  collectionMetaCache.delete(metaKey);
}

/**
 * Best-effort metadata update for a collection's last_accessed_at timestamp.
 *
 * - Uses an in-memory throttle (per metaKey) to avoid writing more often than
 *   LAST_ACCESS_MIN_WRITE_INTERVAL_MS.
 * - Accepts an optional now parameter (default: current time) to aid testing.
 * - Logs and ignores YDB errors so callers' primary operations are not affected.
 */
export async function touchCollectionLastAccess(
  metaKey: string,
  now: Date = new Date()
): Promise<void> {
  const nowMs = now.getTime();
  if (!shouldWriteLastAccess(nowMs, metaKey)) {
    return;
  }

  try {
    await withSession(async (sql, signal) => {
      await sql`
        UPDATE qdr__collections
        SET last_accessed_at = $last_accessed
        WHERE collection = $collection;
      `
        .idempotent(true)
        .timeout(UPSERT_OPERATION_TIMEOUT_MS)
        .signal(signal)
        .parameter("collection", new Utf8(metaKey))
        .parameter("last_accessed", new Timestamp(now));
    });

    evictOldestLastAccessEntry();
    lastAccessWriteCache.set(metaKey, nowMs);
  } catch (err) {
    logger.warn(
      { err, collection: metaKey },
      "touchCollectionLastAccess: failed to update last_accessed_at (ignored)"
    );
  }
}
