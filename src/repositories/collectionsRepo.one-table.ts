import {
    TypedValues,
    Types,
    withSession,
    withQuerySession,
    createExecuteQuerySettings,
} from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../qdrant/QdrantRestTypes.js";
import {
    GLOBAL_POINTS_TABLE,
    POINTS_BY_FILE_LOOKUP_TABLE,
    ensureGlobalPointsTable,
    ensurePointsByFileTable,
} from "../ydb/schema.js";
import { upsertCollectionMeta } from "./collectionsRepo.shared.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";
import { isOutOfBufferMemoryYdbError } from "../utils/ydbErrors.js";
import { logger } from "../logging/logger.js";

const DELETE_COLLECTION_BATCH_SIZE = 10000;

async function deletePointsForCollectionInChunks(
    s: {
        // Deliberately loose typing to accept YDB TableSession.executeQuery
        // without pulling in full SDK types here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executeQuery: (...args: any[]) => Promise<unknown>;
    },
    collection: string
): Promise<void> {
    const selectYql = `
    DECLARE $collection AS Utf8;
    DECLARE $limit AS Uint32;
    SELECT point_id
    FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection
    LIMIT $limit;
  `;

    const deleteBatchYql = `
    DECLARE $collection AS Utf8;
    DECLARE $ids AS List<Utf8>;
    DELETE FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection AND point_id IN $ids;
  `;

    // Best‑effort loop: stop when there are no more rows for this uid.
    // Each iteration only touches a limited number of rows to avoid
    // hitting YDB's per‑operation buffer limits.
    let iterations = 0;
    const MAX_ITERATIONS = 10000;

    const settings = createExecuteQuerySettings();

    while (iterations++ < MAX_ITERATIONS) {
        const rs = (await s.executeQuery(
            selectYql,
            {
                $collection: TypedValues.utf8(collection),
                $limit: TypedValues.uint32(DELETE_COLLECTION_BATCH_SIZE),
            },
            undefined,
            settings
        )) as {
            resultSets?: Array<{
                rows?: unknown[];
            }>;
        };

        const rowset = rs.resultSets?.[0];
        const rows =
            (rowset?.rows as
                | Array<{
                      items?: Array<{ textValue?: string } | undefined>;
                  }>
                | undefined) ?? [];

        const ids = rows
            .map((row) => row.items?.[0]?.textValue)
            .filter((id): id is string => typeof id === "string");

        if (ids.length === 0) {
            break;
        }

        const idsValue = TypedValues.list(Types.UTF8, ids);

        await s.executeQuery(
            deleteBatchYql,
            {
                $collection: TypedValues.utf8(collection),
                $ids: idsValue,
            },
            undefined,
            settings
        );
    }
}

async function deleteLookupRowsForCollectionInChunks(
    s: {
        // Deliberately loose typing to accept YDB TableSession.executeQuery
        // without pulling in full SDK types here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executeQuery: (...args: any[]) => Promise<unknown>;
    },
    collection: string
): Promise<void> {
    const selectYql = `
    DECLARE $collection AS Utf8;
    DECLARE $limit AS Uint32;
    SELECT file_path, point_id
    FROM ${POINTS_BY_FILE_LOOKUP_TABLE}
    WHERE collection = $collection
    LIMIT $limit;
  `;

    const deleteBatchYql = `
    DECLARE $rows AS List<Struct<
        collection: Utf8,
        file_path: Utf8,
        point_id: Utf8
    >>;

    DELETE FROM ${POINTS_BY_FILE_LOOKUP_TABLE} ON
    SELECT collection, file_path, point_id FROM AS_TABLE($rows);
  `;

    let iterations = 0;
    const MAX_ITERATIONS = 10000;
    const settings = createExecuteQuerySettings();
    const rowType = Types.struct({
        collection: Types.UTF8,
        file_path: Types.UTF8,
        point_id: Types.UTF8,
    });

    while (iterations++ < MAX_ITERATIONS) {
        const rs = (await s.executeQuery(
            selectYql,
            {
                $collection: TypedValues.utf8(collection),
                $limit: TypedValues.uint32(DELETE_COLLECTION_BATCH_SIZE),
            },
            undefined,
            settings
        )) as {
            resultSets?: Array<{
                rows?: unknown[];
            }>;
        };

        const rowset = rs.resultSets?.[0];
        const rows =
            (rowset?.rows as
                | Array<{
                      items?: Array<{ textValue?: string } | undefined>;
                  }>
                | undefined) ?? [];

        const lookupRows = rows
            .map((row) => ({
                collection,
                file_path: row.items?.[0]?.textValue,
                point_id: row.items?.[1]?.textValue,
            }))
            .filter(
                (
                    row
                ): row is {
                    collection: string;
                    file_path: string;
                    point_id: string;
                } =>
                    typeof row.file_path === "string" &&
                    typeof row.point_id === "string"
            );

        if (lookupRows.length === 0) {
            break;
        }

        await s.executeQuery(
            deleteBatchYql,
            {
                $rows: TypedValues.list(rowType, lookupRows),
            },
            undefined,
            settings
        );
    }
}

export async function createCollectionOneTable(
    metaKey: string,
    dim: number,
    distance: DistanceKind,
    vectorType: VectorType,
    userUid?: string
): Promise<void> {
    await upsertCollectionMeta(
        metaKey,
        dim,
        distance,
        vectorType,
        GLOBAL_POINTS_TABLE,
        userUid
    );
}

export async function deleteAllPointsForCollectionOneTable(
    collection: string
): Promise<void> {
    await ensureGlobalPointsTable();
    await ensurePointsByFileTable();
    const batchDeletePointsYql = `
    DECLARE $collection AS Utf8;
    BATCH DELETE FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection;
  `;
    const batchDeleteLookupYql = `
    DECLARE $collection AS Utf8;
    BATCH DELETE FROM ${POINTS_BY_FILE_LOOKUP_TABLE}
    WHERE collection = $collection;
  `;

    await withRetry(
        async () => {
            try {
                await withQuerySession(async (qs) => {
                    await qs.execute({
                        text: batchDeletePointsYql,
                        parameters: {
                            $collection: TypedValues.utf8(collection),
                        },
                    });
                });
            } catch (err: unknown) {
                if (!isOutOfBufferMemoryYdbError(err)) {
                    throw err;
                }

                logger.warn(
                    { tableName: GLOBAL_POINTS_TABLE, collection },
                    "BATCH DELETE hit out-of-buffer-memory, falling back to chunked deletion"
                );
                await withSession(async (s) => {
                    await deletePointsForCollectionInChunks(s, collection);
                });
            }

            try {
                await withQuerySession(async (qs) => {
                    await qs.execute({
                        text: batchDeleteLookupYql,
                        parameters: {
                            $collection: TypedValues.utf8(collection),
                        },
                    });
                });
            } catch (err: unknown) {
                if (!isOutOfBufferMemoryYdbError(err)) {
                    throw err;
                }

                logger.warn(
                    { tableName: POINTS_BY_FILE_LOOKUP_TABLE, collection },
                    "BATCH DELETE hit out-of-buffer-memory, falling back to chunked deletion"
                );
                await withSession(async (s) => {
                    await deleteLookupRowsForCollectionInChunks(s, collection);
                });
            }
        },
        {
            isTransient: isTransientYdbError,
            context: {
                operation: "deleteAllPointsForCollectionOneTable",
                tableName: GLOBAL_POINTS_TABLE,
                collection,
                mode: "batch_delete_with_lookup_cleanup",
            },
        }
    );
}

export async function deleteCollectionOneTable(
    metaKey: string,
    collection: string
): Promise<void> {
    await deleteAllPointsForCollectionOneTable(collection);

    const delMeta = `
    DECLARE $collection AS Utf8;
    DELETE FROM qdr__collections WHERE collection = $collection;
  `;
    await withSession(async (s) => {
        const settings = createExecuteQuerySettings();
        await s.executeQuery(
            delMeta,
            {
                $collection: TypedValues.utf8(metaKey),
            },
            undefined,
            settings
        );
    });
}
