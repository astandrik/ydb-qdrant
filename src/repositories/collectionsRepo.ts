import {
  TypedValues,
  withSession,
  createExecuteQuerySettings,
  withStartupProbeSession,
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
import { withRetry, isTransientYdbError } from "../utils/retry.js";

const lastAccessWriteCache = new Map<string, number>();

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
  await withRetry(
    async () => {
      await withStartupProbeSession(async (s) => {
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
      });
    },
    {
      isTransient: isTransientYdbError,
      maxRetries: 2,
      baseDelayMs: 200,
      context: { probe: "collections_startup_compilation" },
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
}

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

    lastAccessWriteCache.set(metaKey, nowMs);
  } catch (err) {
    logger.warn(
      { err, collection: metaKey },
      "touchCollectionLastAccess: failed to update last_accessed_at (ignored)"
    );
  }
}
