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
import type { DistanceKind, VectorType } from "../qdrant/QdrantRestTypes.js";
import { uidFor } from "../utils/tenant.js";
import {
    createCollectionOneTable,
    deleteAllPointsForCollectionOneTable,
    deleteCollectionOneTable,
} from "./collectionsRepo.one-table.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";
import { GLOBAL_POINTS_TABLE } from "../ydb/schema.js";

/**
 * Collection metadata from qdr__collections table.
 *
 * @property lastAccessedAt - Timestamp of last access; undefined for collections
 * created before this feature, null if explicitly unset.
 */
export interface CollectionMeta {
    table: string;
    dimension: number;
    distance: DistanceKind;
    vectorType: VectorType;
    lastAccessedAt?: Date | null;
}

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
    vectorType: VectorType,
    userUid?: string
): Promise<void> {
    await createCollectionOneTable(
        metaKey,
        dim,
        distance,
        vectorType,
        userUid
    );
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
        (row.items?.[2]?.textValue as DistanceKind) ??
        ("Cosine" as DistanceKind);
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
        const [userUid, collection] = metaKey.split("/", 2);
        if (!userUid || !collection) {
            throw new Error(
                `deleteCollection: cannot derive uid from malformed metaKey=${metaKey}`
            );
        }
        effectiveUid = uidFor(userUid, collection);
    }
    await deleteCollectionOneTable(metaKey, effectiveUid);
}

export async function deleteAllPointsForCollection(
    collection: string
): Promise<void> {
    await deleteAllPointsForCollectionOneTable(collection);
}

export async function hasPointsForCollection(
    uid: string
): Promise<boolean> {
    const qry = `
    DECLARE $collection AS Utf8;
    SELECT point_id
    FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection
    LIMIT 1;
  `;
    const res = await withSession(async (s) => {
        const settings = createExecuteQuerySettings();
        return await s.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(uid),
            },
            undefined,
            settings
        );
    });
    const rowset = res.resultSets?.[0];
    return (rowset?.rows?.length ?? 0) > 0;
}

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function bigintToSafeNumberOrNull(value: bigint): number | null {
    if (value > MAX_SAFE_BIGINT || value < -MAX_SAFE_BIGINT) {
        return null;
    }
    return Number(value);
}

function longLikeToBigInt(value: {
    low: number;
    high: number;
    unsigned?: boolean;
}): bigint {
    const low = BigInt(value.low >>> 0);
    const high = BigInt(value.high >>> 0);
    let n = low + (high << 32n);

    const isUnsigned = value.unsigned === true;
    const signBitSet = (value.high & 0x8000_0000) !== 0;
    if (!isUnsigned && signBitSet) {
        n -= 1n << 64n;
    }

    return n;
}

function parsePointCountValue(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    if (typeof value === "bigint") {
        const parsed = bigintToSafeNumberOrNull(value);
        if (parsed !== null) {
            return parsed;
        }
    }
    if (value && typeof value === "object") {
        const v = value as {
            low?: unknown;
            high?: unknown;
            unsigned?: unknown;
        };
        if (typeof v.low === "number" && typeof v.high === "number") {
            const parsed = bigintToSafeNumberOrNull(
                longLikeToBigInt({
                    low: v.low,
                    high: v.high,
                    unsigned: v.unsigned === true,
                })
            );
            if (parsed !== null) {
                return parsed;
            }
        }
    }
    throw new Error("Unable to parse points_count from YDB result.");
}

export async function countPointsForCollection(
    uid: string
): Promise<number> {
    const qry = `
    DECLARE $collection AS Utf8;
    SELECT CAST(COUNT(*) AS Uint64) AS points_count
    FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection;
  `;
    const res = await withSession(async (s) => {
        const settings = createExecuteQuerySettings();
        return await s.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(uid),
            },
            undefined,
            settings
        );
    });
    const rowset = res.resultSets?.[0];
    const row = rowset?.rows?.[0] as
        | {
              items?: Array<
                  | {
                        uint64Value?: unknown;
                        int64Value?: unknown;
                        uint32Value?: unknown;
                        int32Value?: unknown;
                        textValue?: string;
                    }
                  | undefined
              >;
          }
        | undefined;
    const cell = row?.items?.[0];
    if (!cell) {
        return 0;
    }
    return parsePointCountValue(
        cell.uint64Value ??
            cell.int64Value ??
            cell.uint32Value ??
            cell.int32Value ??
            cell.textValue
    );
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
