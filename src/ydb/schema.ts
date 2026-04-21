import {
    withSession,
    TableDescription,
    Column,
    Types,
    Ydb,
} from "./client.js";
import { logger } from "../logging/logger.js";

export const GLOBAL_POINTS_TABLE = "qdrant_all_points";
export const POINTS_BY_FILE_LOOKUP_TABLE = "qdrant_points_by_file";
// Shared YDB-related constants for repositories.
export { UPSERT_BATCH_SIZE } from "../config/env.js";

let metaTableReady = false;
let metaTableReadyInFlight: Promise<void> | null = null;

let globalPointsTableReady = false;
let globalPointsTableReadyInFlight: Promise<void> | null = null;

let pointsByFileTableReady = false;
let pointsByFileTableReadyInFlight: Promise<void> | null = null;

function throwMigrationRequired(message: string): never {
    logger.error(message);
    throw new Error(message);
}

function isTableNotFoundError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    const ctorName =
        err instanceof Error
            ? (err.constructor as { name?: unknown } | undefined)?.name
            : undefined;
    const statusCodeMatch = /code\s+(\d{6})/i.exec(msg);
    const statusCode =
        statusCodeMatch && statusCodeMatch[1]
            ? Number(statusCodeMatch[1])
            : undefined;

    // ydb-sdk exposes dedicated error classes with server status codes.
    // In practice, table-not-found can surface as:
    // - NotFound (code 400140)
    // - SchemeError (code 400070) with empty issues (observed in CI logs for describeTable)
    if (ctorName === "NotFound" || statusCode === 400140) {
        return true;
    }
    if (
        (ctorName === "SchemeError" || statusCode === 400070) &&
        /:\s*\[\s*\]\s*$/i.test(msg)
    ) {
        return true;
    }
    return (
        /table.*not found/i.test(msg) ||
        /path.*not found/i.test(msg) ||
        /does not exist/i.test(msg)
    );
}

function isAlreadyExistsError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return /already exists/i.test(msg) || /path.*exists/i.test(msg);
}

async function ensureMetaTableOnce(): Promise<void> {
    await withSession(async (s) => {
        let tableDescription: Awaited<
            ReturnType<typeof s.describeTable>
        > | null = null;

        try {
            tableDescription = await s.describeTable("qdr__collections");
        } catch (err: unknown) {
            if (isTableNotFoundError(err)) {
                throwMigrationRequired(
                    "Metadata table qdr__collections does not exist; please create it before starting the service"
                );
            }
            throw err;
        }

        // Table exists: validate required columns.
        const columns = tableDescription.columns ?? [];
        const hasLastAccessedAt = columns.some(
            (col) => col.name === "last_accessed_at"
        );

        if (!hasLastAccessedAt) {
            throwMigrationRequired(
                "Metadata table qdr__collections is missing required column last_accessed_at; please recreate the table or apply a manual schema migration before starting the service"
            );
        }

        const hasUserUid = columns.some((col) => col.name === "user_uid");
        if (!hasUserUid) {
            throwMigrationRequired(
                "Metadata table qdr__collections is missing required column user_uid; please recreate the table or apply a manual schema migration before starting the service"
            );
        }
    });

    metaTableReady = true;
}

export async function ensureMetaTable(): Promise<void> {
    if (metaTableReady) {
        return;
    }
    if (metaTableReadyInFlight) {
        await metaTableReadyInFlight;
        return;
    }

    metaTableReadyInFlight = ensureMetaTableOnce();
    try {
        await metaTableReadyInFlight;
    } finally {
        metaTableReadyInFlight = null;
    }
}

async function ensureGlobalPointsTableOnce(): Promise<void> {
    await withSession(async (s) => {
        let tableDescription: Awaited<
            ReturnType<typeof s.describeTable>
        > | null = null;
        try {
            tableDescription = await s.describeTable(GLOBAL_POINTS_TABLE);
        } catch (err: unknown) {
            if (!isTableNotFoundError(err)) {
                throw err;
            }

            // Table doesn't exist, create it with all columns using the new schema and
            // auto-partitioning enabled.
            const desc = new TableDescription()
                .withColumns(
                    new Column("collection", Types.UTF8),
                    new Column("point_id", Types.UTF8),
                    new Column("embedding", Types.BYTES),
                    new Column("payload", Types.JSON_DOCUMENT),
                    new Column("payload_sign", Types.UTF8),
                    new Column("path_prefix", Types.optional(Types.UTF8))
                )
                .withPrimaryKeys("collection", "point_id");

            desc.withPartitioningSettings({
                partitioningByLoad: Ydb.FeatureFlag.Status.ENABLED,
                partitioningBySize: Ydb.FeatureFlag.Status.ENABLED,
                partitionSizeMb: 100,
            });

            try {
                await s.createTable(GLOBAL_POINTS_TABLE, desc);
                logger.info(
                    `created global points table ${GLOBAL_POINTS_TABLE}`
                );
                return;
            } catch (createErr: unknown) {
                // Race-safe: another concurrent caller might have created the table.
                if (!isAlreadyExistsError(createErr)) {
                    throw createErr;
                }
            }

            // If the table already exists (race), fall through to a fresh describe +
            // schema validation.
            tableDescription = await s.describeTable(GLOBAL_POINTS_TABLE);
        }

        // Table exists: validate required columns for the current schema.
        const columns = tableDescription.columns ?? [];
        const hasCollection = columns.some((col) => col.name === "collection");
        const hasPayloadSign = columns.some((col) => col.name === "payload_sign");

        if (!hasCollection) {
            throwMigrationRequired(
                `Global points table ${GLOBAL_POINTS_TABLE} is missing required column collection; please recreate the table before starting the service`
            );
        }
        if (!hasPayloadSign) {
            throwMigrationRequired(
                `Global points table ${GLOBAL_POINTS_TABLE} is missing required column payload_sign; please apply a manual schema migration before starting the service (example: ALTER TABLE ${GLOBAL_POINTS_TABLE} ADD COLUMN payload_sign Utf8)`
            );
        }
        const hasPathPrefix = columns.some((col) => col.name === "path_prefix");
        if (!hasPathPrefix) {
            throwMigrationRequired(
                `Global points table ${GLOBAL_POINTS_TABLE} is missing required column path_prefix; please apply a manual schema migration before starting the service (example: ALTER TABLE ${GLOBAL_POINTS_TABLE} ADD COLUMN path_prefix Optional<Utf8>)`
            );
        }
    });
}

export async function ensureGlobalPointsTable(): Promise<void> {
    if (globalPointsTableReady) {
        return;
    }
    if (globalPointsTableReadyInFlight) {
        await globalPointsTableReadyInFlight;
        return;
    }

    globalPointsTableReadyInFlight = ensureGlobalPointsTableOnce();
    try {
        await globalPointsTableReadyInFlight;
        globalPointsTableReady = true;
    } finally {
        globalPointsTableReadyInFlight = null;
    }
}

async function ensurePointsByFileTableOnce(): Promise<void> {
    await withSession(async (s) => {
        let tableDescription: Awaited<
            ReturnType<typeof s.describeTable>
        > | null = null;

        try {
            tableDescription = await s.describeTable(POINTS_BY_FILE_LOOKUP_TABLE);
        } catch (err: unknown) {
            if (!isTableNotFoundError(err)) {
                throw err;
            }

            const desc = new TableDescription()
                .withColumns(
                    new Column("collection", Types.UTF8),
                    new Column("file_path", Types.UTF8),
                    new Column("point_id", Types.UTF8)
                )
                .withPrimaryKeys("collection", "file_path", "point_id");

            desc.withPartitioningSettings({
                partitioningByLoad: Ydb.FeatureFlag.Status.ENABLED,
                partitioningBySize: Ydb.FeatureFlag.Status.ENABLED,
                partitionSizeMb: 100,
            });

            try {
                await s.createTable(POINTS_BY_FILE_LOOKUP_TABLE, desc);
                logger.info(
                    `created points-by-file lookup table ${POINTS_BY_FILE_LOOKUP_TABLE}`
                );
                return;
            } catch (createErr: unknown) {
                if (!isAlreadyExistsError(createErr)) {
                    throw createErr;
                }
            }

            tableDescription = await s.describeTable(POINTS_BY_FILE_LOOKUP_TABLE);
        }

        const columns = tableDescription.columns ?? [];
        const hasCollection = columns.some((col) => col.name === "collection");
        const hasFilePath = columns.some((col) => col.name === "file_path");
        const hasPointId = columns.some((col) => col.name === "point_id");

        if (!hasCollection) {
            throwMigrationRequired(
                `Points-by-file lookup table ${POINTS_BY_FILE_LOOKUP_TABLE} is missing required column collection; please recreate the table before starting the service`
            );
        }
        if (!hasFilePath) {
            throwMigrationRequired(
                `Points-by-file lookup table ${POINTS_BY_FILE_LOOKUP_TABLE} is missing required column file_path; please recreate the table before starting the service`
            );
        }
        if (!hasPointId) {
            throwMigrationRequired(
                `Points-by-file lookup table ${POINTS_BY_FILE_LOOKUP_TABLE} is missing required column point_id; please recreate the table before starting the service`
            );
        }
    });
    pointsByFileTableReady = true;
}

export async function ensurePointsByFileTable(): Promise<void> {
    if (pointsByFileTableReady) {
        return;
    }
    if (pointsByFileTableReadyInFlight) {
        await pointsByFileTableReadyInFlight;
        return;
    }

    pointsByFileTableReadyInFlight = ensurePointsByFileTableOnce();
    try {
        await pointsByFileTableReadyInFlight;
    } finally {
        pointsByFileTableReadyInFlight = null;
    }
}
