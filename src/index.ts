import "dotenv/config";
import { buildServer } from "./server.js";
import {
    PORT,
    UPSERT_BODY_TIMEOUT_MS,
    UPSERT_HTTP_TIMEOUT_MS,
} from "./config/env.js";
import { logger } from "./logging/logger.js";
import { readyOrThrow, isCompilationTimeoutError } from "./ydb/client.js";
import {
    GLOBAL_POINTS_TABLE,
    ensureMetaTable,
    ensureGlobalPointsTable,
    POINTS_BY_FILE_LOOKUP_TABLE,
    ensurePointsByFileTable,
} from "./ydb/schema.js";
import { verifyCollectionsQueryCompilationForStartup } from "./repositories/collectionsRepo.js";
import { scheduleExit } from "./utils/exit.js";

function describeUnknownError(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    if (typeof err === "string") {
        return err;
    }
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
}

function isFatalStartupSchemaError(err: unknown): boolean {
    if (!(err instanceof Error)) {
        return false;
    }
    return (
        err.message.includes(`Global points table ${GLOBAL_POINTS_TABLE}`) ||
        err.message.includes(
            `Points-by-file lookup table ${POINTS_BY_FILE_LOOKUP_TABLE}`
        )
    );
}

let originalStderrWrite: typeof process.stderr.write | undefined;
let stderrAsErrorLoggerInstalled = false;

function writeToOriginalStderr(
    chunk: string | Uint8Array,
    encoding?: BufferEncoding | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void
): boolean {
    if (!originalStderrWrite) {
        return true;
    }
    if (typeof encoding === "function") {
        return originalStderrWrite(chunk, encoding);
    }
    if (encoding !== undefined) {
        return originalStderrWrite(chunk, encoding, cb);
    }
    return originalStderrWrite(chunk);
}

export function installStderrAsErrorLogger(): void {
    if (stderrAsErrorLoggerInstalled) {
        return;
    }

    // Some infra log collectors treat raw stderr lines as DEBUG by default.
    // Mirror stderr writes into structured error logs while preserving the
    // original stream so native/runtime diagnostics still reach stderr.
    originalStderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((
        chunk: string | Uint8Array,
        encoding?:
            | BufferEncoding
            | ((err?: Error | null) => void),
        cb?: (err?: Error | null) => void
    ): boolean => {
        const enc = typeof encoding === "string" ? encoding : undefined;

        const text =
            typeof chunk === "string"
                ? chunk
                : Buffer.from(chunk).toString(enc ?? "utf8");

        for (const line of text.split(/\r?\n/)) {
            if (line.length > 0) {
                logger.error({ stream: "stderr" }, line);
            }
        }

        return writeToOriginalStderr(chunk, encoding, cb);
    }) as typeof process.stderr.write;
    stderrAsErrorLoggerInstalled = true;
}

export function __restoreStderrWriteForTests(): void {
    if (!stderrAsErrorLoggerInstalled || !originalStderrWrite) {
        return;
    }
    process.stderr.write = originalStderrWrite;
    stderrAsErrorLoggerInstalled = false;
}

installStderrAsErrorLogger();

process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    scheduleExit(1);
});

process.on("unhandledRejection", (reason) => {
    if (reason instanceof Error) {
        logger.fatal({ err: reason }, "Unhandled rejection");
    } else {
        logger.fatal(
            { err: new Error(describeUnknownError(reason)), reason },
            "Unhandled rejection"
        );
    }
    scheduleExit(1);
});

async function start(): Promise<void> {
    try {
        await readyOrThrow();
        await ensureMetaTable();
        await ensureGlobalPointsTable();
        await ensurePointsByFileTable();
        await verifyCollectionsQueryCompilationForStartup();
        logger.info(
            "YDB compilation startup probe for qdr__collections completed successfully"
        );
    } catch (err: unknown) {
        if (isCompilationTimeoutError(err)) {
            logger.error(
                { err },
                "Fatal YDB compilation timeout during startup probe; exiting so supervisor can restart the process"
            );
            process.exit(1);
            return;
        }
        if (isFatalStartupSchemaError(err)) {
            logger.error(
                { err },
                "Fatal YDB schema/startup check failure; exiting until required migrations are applied"
            );
            process.exit(1);
            return;
        }
        logger.error(
            { err },
            "YDB not ready; startup continues, requests may fail until configured."
        );
    }
    logger.info(
        {
            upsertBodyTimeoutMs: UPSERT_BODY_TIMEOUT_MS,
            upsertProcessingTimeoutMs: UPSERT_HTTP_TIMEOUT_MS,
        },
        "Resolved upsert timeout budgets"
    );
    const app = buildServer();
    app.listen(PORT, () => {
        logger.info({ port: PORT }, "ydb-qdrant proxy listening");
    });
}

void start();
