import {
    TypedValues,
    Types,
    withSession,
    Ydb as YdbRuntime,
    createBulkUpsertSettingsWithTimeout,
    createExecuteQuerySettingsWithTimeout,
} from "../../ydb/client.js";
import { buildVectorBinaryParams } from "../../ydb/helpers.js";
import {
    withRetry,
    isTransientYdbErrorInAcquiredSession,
} from "../../utils/retry.js";
import {
    POINTS_BY_FILE_LOOKUP_TABLE,
    UPSERT_BATCH_SIZE,
    ensurePointsByFileTable,
} from "../../ydb/schema.js";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../../config/env.js";
import { logger } from "../../logging/logger.js";
import {
    elapsedMsSince,
    getMonotonicTimeNs,
} from "../../logging/requestContext.js";
import type { UpsertPoint } from "../../qdrant/Requests.js";
import type { Session as YdbSession, Ydb as YdbTypes } from "ydb-sdk";
import { computePayloadSign } from "../../utils/PayloadSign.js";
import { extractPathPrefix } from "../../utils/pathPrefix.js";
import { expandPathPrefixes } from "../../utils/prefixExpansion.js";
import {
    isComputePoolEnabled,
    isComputePoolQueueAtLimitError,
    runPrepareUpsertBatch,
} from "../../compute/ComputePool.js";

function assertPointVectorsDimension(args: {
    tableName: string;
    collection: string;
    points: UpsertPoint[];
    dimension: number;
}): void {
    for (const p of args.points) {
        const id = String(p.id);
        if (p.vector.length !== args.dimension) {
            const previewLength = Math.min(16, p.vector.length);
            const vectorPreview =
                previewLength > 0 ? p.vector.slice(0, previewLength) : [];
            logger.warn(
                {
                    tableName: args.tableName,
                    collection: args.collection,
                    pointId: id,
                    vectorLen: p.vector.length,
                    expectedDimension: args.dimension,
                    vectorPreview,
                },
                "upsertPointsOneTable: vector dimension mismatch"
            );
            throw new Error(
                `Vector dimension mismatch for id=${id}: got ${p.vector.length}, expected ${args.dimension}`
            );
        }
    }
}

function createBulkUpsertRowType() {
    return Types.struct({
        collection: Types.UTF8,
        point_id: Types.UTF8,
        embedding: Types.BYTES,
        payload: Types.JSON_DOCUMENT,
        payload_sign: Types.UTF8,
        path_prefix: Types.optional(Types.UTF8),
    });
}

function asBytesBuffer(value: Uint8Array): Buffer {
    // In worker_threads structured clone, Buffer arrives as Uint8Array.
    // Wrap it into Buffer without copying again.
    return Buffer.isBuffer(value)
        ? value
        : Buffer.from(value.buffer, value.byteOffset, value.byteLength);
}

function createPointsByFileLookupRowType() {
    return Types.struct({
        collection: Types.UTF8,
        file_path: Types.UTF8,
        point_id: Types.UTF8,
    });
}

type PointsByFileLookupRow = {
    collection: string;
    file_path: string;
    point_id: string;
};

function buildPointsByFileLookupRows(args: {
    collection: string;
    batch: Array<Pick<UpsertPoint, "id" | "payload">>;
}): PointsByFileLookupRow[] {
    return args.batch.flatMap((point) => {
        const payloadObj = point.payload ?? {};
        const filePath = extractPathPrefix(payloadObj);
        if (!filePath) {
            return [];
        }
        return expandPathPrefixes(filePath).map((prefix) => ({
            collection: args.collection,
            file_path: prefix,
            point_id: String(point.id),
        }));
    });
}

async function syncPointsByFileLookupRows(args: {
    session: Pick<YdbSession, "executeQuery">;
    collection: string;
    batch: Array<Pick<UpsertPoint, "id" | "payload">>;
}): Promise<void> {
    const rows = buildPointsByFileLookupRows(args);
    if (rows.length === 0) {
        return;
    }
    const rowsValue = TypedValues.list(createPointsByFileLookupRowType(), rows);
    const upsertLookupYql = `
        DECLARE $rows AS List<Struct<
            collection: Utf8,
            file_path: Utf8,
            point_id: Utf8
        >>;

        UPSERT INTO ${POINTS_BY_FILE_LOOKUP_TABLE}
        SELECT collection, file_path, point_id FROM AS_TABLE($rows);
    `;

    await withRetry(
        async () => {
            const settings = createExecuteQuerySettingsWithTimeout({
                timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
            });
            await args.session.executeQuery(
                upsertLookupYql,
                {
                    $rows: rowsValue,
                },
                undefined,
                settings
            );
        },
        {
            isTransient: isTransientYdbErrorInAcquiredSession,
            context: {
                operation: "syncPointsByFileLookupRows",
                collection: args.collection,
                batchSize: args.batch.length,
                lookupRowsCount: rows.length,
            },
        }
    );
}

function buildBulkUpsertRowsValue(args: {
    collection: string;
    batch: Array<Pick<UpsertPoint, "id" | "vector" | "payload">>;
    apiKey: string;
}): YdbTypes.ITypedValue {
    const apiKey = args.apiKey.trim();

    return TypedValues.list(
        createBulkUpsertRowType(),
        args.batch.map((p) => {
            const binaries = buildVectorBinaryParams(p.vector);
            const payloadObj = p.payload ?? {};
            const row: Record<string, unknown> = {
                collection: args.collection,
                point_id: String(p.id),
                embedding: binaries.float,
                payload: JSON.stringify(payloadObj),
                payload_sign: computePayloadSign({ apiKey, payload: payloadObj }),
                path_prefix: extractPathPrefix(payloadObj),
            };
            return row;
        })
    );
}

async function buildBulkUpsertRowsValueWithWorkers(args: {
    collection: string;
    batch: Array<Pick<UpsertPoint, "id" | "vector" | "payload">>;
    apiKey: string;
}): Promise<YdbTypes.ITypedValue> {
    const prepared = await runPrepareUpsertBatch({
        collection: args.collection,
        apiKey: args.apiKey,
        batch: args.batch,
    });

    return TypedValues.list(
        createBulkUpsertRowType(),
        prepared.map((row) => {
            const mapped: Record<string, unknown> = {
                collection: row.collection,
                point_id: row.point_id,
                embedding: asBytesBuffer(row.embedding),
                payload: row.payload,
                payload_sign: row.payload_sign,
                path_prefix: row.path_prefix,
            };
            return mapped;
        })
    );
}

export async function upsertPointsOneTable(
    tableName: string,
    points: UpsertPoint[],
    dimension: number,
    collection: string,
    apiKey: string
): Promise<number> {
    if (!tableName) {
        throw new Error("bulkUpsert: tableName is empty");
    }
    assertPointVectorsDimension({ tableName, collection, points, dimension });
    await ensurePointsByFileTable();

    const repoStartNs = getMonotonicTimeNs();
    let batchCount = 0;
    let currentBatchIndex = 0;
    let prepareRowsMsTotal = 0;
    let lookupSyncMsTotal = 0;
    let bulkUpsertMsTotal = 0;
    let usedWorkersAny = false;

    try {
        await withSession(async (s) => {
            const bulkSettings = createBulkUpsertSettingsWithTimeout({
                timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
            });

            for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
                const batch = points.slice(i, i + UPSERT_BATCH_SIZE);
                currentBatchIndex = Math.floor(i / UPSERT_BATCH_SIZE) + 1;
                const batchStartNs = getMonotonicTimeNs();

                const workersEnabled = isComputePoolEnabled();
                let usedWorkers = false;
                let rowsValue: YdbTypes.ITypedValue;

                const prepareRowsStartNs = getMonotonicTimeNs();
                if (workersEnabled) {
                    try {
                        usedWorkers = true;
                        rowsValue = await buildBulkUpsertRowsValueWithWorkers({
                            collection,
                            batch,
                            apiKey,
                        });
                    } catch (err: unknown) {
                        if (!isComputePoolQueueAtLimitError(err)) {
                            throw err;
                        }
                        // Backpressure: fall back to inline compute to avoid failing the request.
                        usedWorkers = false;
                        rowsValue = buildBulkUpsertRowsValue({
                            collection,
                            batch,
                            apiKey,
                        });
                    }
                } else {
                    rowsValue = buildBulkUpsertRowsValue({
                        collection,
                        batch,
                        apiKey,
                    });
                }
                const prepareRowsMs = elapsedMsSince(prepareRowsStartNs);
                prepareRowsMsTotal += prepareRowsMs;
                usedWorkersAny = usedWorkersAny || usedWorkers;

                if (logger.isLevelEnabled("debug")) {
                    logger.debug(
                        {
                            tableName,
                            mode: usedWorkers
                                ? "one_table_bulk_upsert_worker_serialization"
                                : "one_table_bulk_upsert_client_side_serialization",
                            batchSize: batch.length,
                            params: {
                                rows: batch.map((p) => ({
                                    collection,
                                    point_id: String(p.id),
                                    vectorLength: p.vector.length,
                                    vectorPreview: p.vector.slice(0, 3),
                                    payload: p.payload ?? {},
                                })),
                            },
                        },
                        "one_table upsert: executing BulkUpsert"
                    );
                }

                const lookupSyncStartNs = getMonotonicTimeNs();
                await syncPointsByFileLookupRows({
                    session: s,
                    collection,
                    batch,
                });
                const lookupSyncMs = elapsedMsSince(lookupSyncStartNs);
                lookupSyncMsTotal += lookupSyncMs;

                const typedRows = YdbRuntime.TypedValue.create(rowsValue);
                const bulkUpsertStartNs = getMonotonicTimeNs();
                await withRetry(
                    () => s.bulkUpsert(tableName, typedRows, bulkSettings),
                    {
                        isTransient: isTransientYdbErrorInAcquiredSession,
                        context: {
                            tableName,
                            batchSize: batch.length,
                            mode: "bulkUpsert",
                        },
                    }
                );
                const bulkUpsertMs = elapsedMsSince(bulkUpsertStartNs);
                bulkUpsertMsTotal += bulkUpsertMs;
                batchCount = currentBatchIndex;

                if (logger.isLevelEnabled("debug")) {
                    logger.debug(
                        {
                            phase: "upsertRepoBatch",
                            tableName,
                            collection,
                            batchIndex: currentBatchIndex,
                            batchSize: batch.length,
                            prepareRowsMs,
                            lookupSyncMs,
                            bulkUpsertMs,
                            batchTotalMs: elapsedMsSince(batchStartNs),
                            usedWorkers,
                        },
                        "upsert: repo batch"
                    );
                }
            }
        });
    } catch (err: unknown) {
        logger.error(
            {
                err:
                    err instanceof Error ? err : new Error(String(err)),
                phase: "upsertRepo",
                tableName,
                collection,
                repoTotalMs: elapsedMsSince(repoStartNs),
                batchCount,
                failedBatchIndex: currentBatchIndex > batchCount ? currentBatchIndex : undefined,
                pointCount: points.length,
                prepareRowsMsTotal,
                lookupSyncMsTotal,
                bulkUpsertMsTotal,
                usedWorkersAny,
            },
            "upsert: failed"
        );
        throw err;
    }
    logger.info(
        {
            phase: "upsertRepo",
            tableName,
            collection,
            repoTotalMs: elapsedMsSince(repoStartNs),
            batchCount,
            pointCount: points.length,
            prepareRowsMsTotal,
            lookupSyncMsTotal,
            bulkUpsertMsTotal,
            usedWorkersAny,
        },
        "upsert: repo summary"
    );
    // BulkUpsert is idempotent for the same (collection, point_id) keys; we report the
    // number of points accepted by the API rather than rows actually changed.
    return points.length;
}
