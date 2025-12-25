import {
  TypedValues,
  withSession,
  createExecuteQuerySettings,
  withStartupProbeSessionRetry,
  createExecuteQuerySettingsWithTimeout,
} from "../ydb/client.js";
import {
  STARTUP_PROBE_SESSION_TIMEOUT_MS,
  LAST_ACCESS_MIN_WRITE_INTERVAL_MS,
} from "../config/env.js";
import { logger } from "../logging/logger.js";
import type { DistanceKind, VectorType, CollectionMeta } from "../types";
import { uidFor } from "../utils/tenant.js";
import {
  createCollectionOneTable,
  deleteCollectionOneTable,
} from "./collectionsRepo.one-table.js";

const lastAccessWriteCache = new Map<string, number>();
const LAST_ACCESS_CACHE_MAX_SIZE = 10000;

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
}

export async function getCollectionMeta(
  metaKey: string
): Promise<CollectionMeta | null> {
  const qry = `
    DECLARE $collection AS Utf8;
    SELECT
      table_name,
      vector_dimension,
      distance,
      vector_type,
      CAST(last_accessed_at AS Utf8) AS last_accessed_at
    FROM qdr__collections
    WHERE collection = $collection;
  `;
  const res = await withSession(async (s) => {
    const settings = createExecuteQuerySettings();
    return await s.executeQuery(
      qry,
      {
        $collection: TypedValues.utf8(metaKey),
      },
      undefined,
      settings
    );
  });
  const rowset = res.resultSets?.[0];
  if (!rowset || rowset.rows?.length !== 1) return null;
  const row = rowset.rows[0] as {
    items?: Array<
      | {
          textValue?: string;
          uint32Value?: number;
        }
      | undefined
    >;
  };
  const table = row.items?.[0]?.textValue as string;
  const dimension = Number(
    row.items?.[1]?.uint32Value ?? row.items?.[1]?.textValue
  );
  const distance =
    (row.items?.[2]?.textValue as DistanceKind) ?? ("Cosine" as DistanceKind);
  const vectorType = (row.items?.[3]?.textValue as VectorType) ?? "float";
  const lastAccessRaw = row.items?.[4]?.textValue;
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

  return result;
}

export async function verifyCollectionsQueryCompilationForStartup(): Promise<void> {
  const probeKey = "__startup_probe__/__startup_probe__";
  const qry = `
    DECLARE $collection AS Utf8;
    SELECT
      table_name,
      vector_dimension,
      distance,
      vector_type,
      CAST(last_accessed_at AS Utf8) AS last_accessed_at
    FROM qdr__collections
    WHERE collection = $collection;
  `;
  await withStartupProbeSessionRetry(
    async (s) => {
      const settings = createExecuteQuerySettingsWithTimeout({
        keepInCache: true,
        idempotent: true,
        timeoutMs: STARTUP_PROBE_SESSION_TIMEOUT_MS,
      });
      await s.executeQuery(
        qry,
        {
          $collection: TypedValues.utf8(probeKey),
        },
        undefined,
        settings
      );
    },
    { maxRetries: 2 }
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

  const qry = `
    DECLARE $collection AS Utf8;
    DECLARE $last_accessed AS Timestamp;
    UPDATE qdr__collections
    SET last_accessed_at = $last_accessed
    WHERE collection = $collection;
  `;

  try {
    await withSession(async (s) => {
      const settings = createExecuteQuerySettings();
      await s.executeQuery(
        qry,
        {
          $collection: TypedValues.utf8(metaKey),
          $last_accessed: TypedValues.timestamp(now),
        },
        undefined,
        settings
      );
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
