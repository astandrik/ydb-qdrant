import {
    TypedValues,
    Types,
    withSession,
    createExecuteQuerySettings,
} from "../../ydb/client.js";
import {
    withRetry,
    isTransientYdbError,
    isTransientYdbErrorInAcquiredSession,
} from "../../utils/retry.js";
import { DELETE_FILTER_SELECT_BATCH_SIZE } from "../../config/env.js";
import type { Ydb } from "ydb-sdk";
import { buildExactPathSegmentsFilter } from "./PathSegmentsFilter.js";
import { pathSegmentsToPrefix } from "../../utils/pathPrefix.js";
import {
    POINTS_BY_FILE_LOOKUP_TABLE,
    ensurePointsByFileTable,
} from "../../ydb/schema.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };

const DELETE_FILTER_PATHS_CHUNK_SIZE = 250;
const DELETE_FILTER_PATHS_CHUNK_CONCURRENCY = 3;

// Delete is idempotent in our usage (DELETE by PK / DELETE by selected keys),
// so it is safe to use stronger retries for transient YDB states like Aborted/Undetermined.
// Keep backoff capped to avoid multi-minute request tails during outages.
const DELETE_BY_ID_RETRY_MAX_RETRIES = 10;
const DELETE_BY_ID_RETRY_BASE_DELAY_MS = 250;
const DELETE_BY_ID_RETRY_MAX_BACKOFF_MS = 1500;

const DELETE_BY_FILTER_RETRY_MAX_RETRIES = 12;
const DELETE_BY_FILTER_RETRY_BASE_DELAY_MS = 300;
const DELETE_BY_FILTER_RETRY_MAX_BACKOFF_MS = 2000;
export async function deletePointsOneTable(
    tableName: string,
    ids: Array<string | number>,
    collection: string
): Promise<number> {
    if (ids.length === 0) {
        return 0;
    }

    const yql = `
        DECLARE $collection AS Utf8;
        DECLARE $ids AS List<Utf8>;

        DELETE FROM ${tableName}
        WHERE collection = $collection AND point_id IN $ids;

        $lookup_rows = (
          SELECT collection, file_path, point_id
          FROM ${POINTS_BY_FILE_LOOKUP_TABLE}
          WHERE collection = $collection AND point_id IN $ids
        );

        DELETE FROM ${POINTS_BY_FILE_LOOKUP_TABLE} ON
        SELECT collection, file_path, point_id FROM $lookup_rows;
    `;

    const stringIds = ids.map((id) => String(id));
    await ensurePointsByFileTable();

    await withSession(async (s) => {
        const settings = createExecuteQuerySettings();
        await withRetry(
            () =>
                s.executeQuery(
                    yql,
                    {
                        $collection: TypedValues.utf8(collection),
                        $ids: TypedValues.list(Types.UTF8, stringIds),
                    },
                    undefined,
                    settings
                ),
            {
                isTransient: isTransientYdbErrorInAcquiredSession,
                maxRetries: DELETE_BY_ID_RETRY_MAX_RETRIES,
                baseDelayMs: DELETE_BY_ID_RETRY_BASE_DELAY_MS,
                maxBackoffMs: DELETE_BY_ID_RETRY_MAX_BACKOFF_MS,
                context: { tableName, collection, idCount: ids.length },
            }
        );
    });
    return ids.length;
}

type Cell = {
    uint64Value?: unknown;
    int64Value?: unknown;
    uint32Value?: unknown;
    int32Value?: unknown;
    textValue?: string;
};

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

    // If this is a signed Long-like and the sign bit is set, interpret as a negative 64-bit integer.
    const isUnsigned = value.unsigned === true;
    const signBitSet = (value.high & 0x8000_0000) !== 0;
    if (!isUnsigned && signBitSet) {
        n -= 1n << 64n;
    }

    return n;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "bigint") {
        return bigintToSafeNumberOrNull(value);
    }
    if (typeof value === "string") {
        // Prefer exact parsing for integer strings to avoid silent precision loss.
        if (/^-?\d+$/.test(value.trim())) {
            try {
                const b = BigInt(value.trim());
                return bigintToSafeNumberOrNull(b);
            } catch {
                return null;
            }
        }
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    if (value && typeof value === "object") {
        // ydb-sdk may return Uint64/Int64 as protobufjs Long-like objects:
        // { low: number, high: number, unsigned?: boolean }
        const v = value as {
            low?: unknown;
            high?: unknown;
            unsigned?: unknown;
        };
        if (typeof v.low === "number" && typeof v.high === "number") {
            const b = longLikeToBigInt({
                low: v.low,
                high: v.high,
                unsigned: v.unsigned === true,
            });
            return bigintToSafeNumberOrNull(b);
        }
    }
    return null;
}

function readDeletedCountFromResult(
    rs: Pick<Ydb.Table.ExecuteQueryResult, "resultSets">
): number {
    const sets = rs.resultSets ?? [];
    for (let i = sets.length - 1; i >= 0; i -= 1) {
        const rowset = sets[i];
        const rows =
            (rowset?.rows as
                | Array<{
                      items?: Array<Cell | undefined>;
                  }>
                | null
                | undefined) ?? [];
        const cell = rows[0]?.items?.[0];
        if (!cell) continue;

        const candidates: unknown[] = [
            cell.uint64Value,
            cell.int64Value,
            cell.uint32Value,
            cell.int32Value,
            cell.textValue,
        ];
        for (const c of candidates) {
            const n = toNumber(c);
            if (n !== null) return n;
        }

        // We got a result cell but couldn't parse any of its known numeric representations.
        // Returning 0 here would silently stop the delete loop, so fail loud.
        throw new Error("Unable to parse deleted count from YDB result.");
    }

    return 0;
}

async function deletePointsByPathSegmentsChunked(
    tableName: string,
    collection: string,
    whereSql: string,
    whereParamDeclarations: string,
    whereParams: QueryParams,
    batchLimit: number
): Promise<number> {
    const deleteBatchYql = `
    DECLARE $collection AS Utf8;
    DECLARE $limit AS Uint32;
    ${whereParamDeclarations}

    $to_delete = (
      SELECT collection, file_path, point_id
      FROM ${POINTS_BY_FILE_LOOKUP_TABLE}
      WHERE collection = $collection AND ${whereSql}
      LIMIT $limit
    );

    DELETE FROM ${tableName} ON
    SELECT collection, point_id FROM $to_delete;

    DELETE FROM ${POINTS_BY_FILE_LOOKUP_TABLE} ON
    SELECT collection, file_path, point_id FROM $to_delete;

    SELECT CAST(COUNT(*) AS Uint32) AS deleted FROM $to_delete;
  `;

    const settings = createExecuteQuerySettings();
    let deleted = 0;

    while (true) {
        const rs = await withSession(async (s) => {
            return await withRetry(
                () =>
                    s.executeQuery(
                        deleteBatchYql,
                        {
                            ...whereParams,
                            $collection: TypedValues.utf8(collection),
                            $limit: TypedValues.uint32(batchLimit),
                        },
                        undefined,
                        settings
                    ),
                {
                    isTransient: isTransientYdbErrorInAcquiredSession,
                    maxRetries: DELETE_BY_FILTER_RETRY_MAX_RETRIES,
                    baseDelayMs: DELETE_BY_FILTER_RETRY_BASE_DELAY_MS,
                    maxBackoffMs: DELETE_BY_FILTER_RETRY_MAX_BACKOFF_MS,
                    context: {
                        tableName,
                        collection,
                        filterParamsCount: Object.keys(whereParams).length,
                        batchLimit,
                    },
                }
            );
        });

        const batchDeleted = readDeletedCountFromResult(rs);
        if (
            !Number.isSafeInteger(batchDeleted) ||
            batchDeleted < 0 ||
            batchDeleted > batchLimit
        ) {
            throw new Error(
                `Unexpected deleted count from YDB: ${String(
                    batchDeleted
                )}. Expected an integer in [0, ${batchLimit}].`
            );
        }
        if (batchDeleted <= 0) {
            break;
        }
        deleted += batchDeleted;
    }

    return deleted;
}

type PathSegmentsChunk = {
    chunkIndex: number;
    chunkPaths: Array<Array<string>>;
};

function dedupePathSegmentsPaths(
    paths: Array<Array<string>>
): Array<Array<string>> {
    const seenPrefixes = new Set<string>();
    const uniquePaths: Array<Array<string>> = [];

    for (const pathSegments of paths) {
        const prefix = pathSegmentsToPrefix(pathSegments);
        if (seenPrefixes.has(prefix)) {
            continue;
        }
        seenPrefixes.add(prefix);
        uniquePaths.push(pathSegments);
    }

    return uniquePaths;
}

async function deletePointsByPathSegmentsChunkWithRetry(
    tableName: string,
    collection: string,
    chunk: PathSegmentsChunk,
    totalInputPathsCount: number,
    chunkCount: number
): Promise<number> {
    const filter = buildExactPathSegmentsFilter(chunk.chunkPaths, "file_path");
    if (!filter) {
        return 0;
    }
    const { whereSql, whereParamDeclarations, whereParams } = filter;

    return await withRetry(
        async () => {
            return await deletePointsByPathSegmentsChunked(
                tableName,
                collection,
                whereSql,
                whereParamDeclarations,
                whereParams,
                DELETE_FILTER_SELECT_BATCH_SIZE
            );
        },
        {
            isTransient: isTransientYdbError,
            maxRetries: DELETE_BY_FILTER_RETRY_MAX_RETRIES,
            baseDelayMs: DELETE_BY_FILTER_RETRY_BASE_DELAY_MS,
            maxBackoffMs: DELETE_BY_FILTER_RETRY_MAX_BACKOFF_MS,
            context: {
                operation: "deletePointsByPathSegmentsOneTable",
                tableName,
                collection,
                filterPathsCount: totalInputPathsCount,
                chunkPathsCount: chunk.chunkPaths.length,
                chunkIndex: chunk.chunkIndex,
                chunkCount,
                concurrency: DELETE_FILTER_PATHS_CHUNK_CONCURRENCY,
                mode: "points_by_file_lookup_delete",
            },
        }
    );
}

export async function deletePointsByPathSegmentsOneTable(
    tableName: string,
    collection: string,
    paths: Array<Array<string>>
): Promise<number> {
    if (paths.length === 0) {
        return 0;
    }
    await ensurePointsByFileTable();
    const uniquePaths = dedupePathSegmentsPaths(paths);
    const chunks: PathSegmentsChunk[] = [];
    for (
        let chunkStart = 0;
        chunkStart < uniquePaths.length;
        chunkStart += DELETE_FILTER_PATHS_CHUNK_SIZE
    ) {
        chunks.push({
            chunkIndex:
                Math.floor(chunkStart / DELETE_FILTER_PATHS_CHUNK_SIZE) + 1,
            chunkPaths: uniquePaths.slice(
                chunkStart,
                chunkStart + DELETE_FILTER_PATHS_CHUNK_SIZE
            ),
        });
    }
    const chunkCount = chunks.length;
    let deleted = 0;

    for (
        let batchStart = 0;
        batchStart < chunkCount;
        batchStart += DELETE_FILTER_PATHS_CHUNK_CONCURRENCY
    ) {
        const chunkBatch = chunks.slice(
            batchStart,
            batchStart + DELETE_FILTER_PATHS_CHUNK_CONCURRENCY
        );
        const batchResults = await Promise.allSettled(
            chunkBatch.map((chunk) =>
                deletePointsByPathSegmentsChunkWithRetry(
                    tableName,
                    collection,
                    chunk,
                    uniquePaths.length,
                    chunkCount
                )
            )
        );

        let firstError: Error | undefined;
        for (const result of batchResults) {
            if (result.status === "fulfilled") {
                deleted += result.value;
                continue;
            }

            firstError ??=
                result.reason instanceof Error
                    ? result.reason
                    : new Error(String(result.reason));
        }

        if (firstError !== undefined) {
            throw firstError;
        }
    }

    return deleted;
}
