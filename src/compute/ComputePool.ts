import { Piscina } from "piscina";
import {
    WORKERS_ENABLED,
    WORKERS_IDLE_TIMEOUT_MS,
    WORKERS_MAX_QUEUE,
    WORKERS_MAX_THREADS,
    WORKERS_MIN_THREADS,
} from "../config/env.js";
import { logger } from "../logging/logger.js";
import type {
    PrepareUpsertBatchTask,
    PreparedUpsertRow,
    VerifySearchRowsResult,
    VerifySearchRowsTask,
} from "./ComputeWorker.js";

type PoolTaskName = "prepareUpsertBatch" | "verifySearchRows";

let pool: Piscina | undefined;

function buildWorkerFilename(): string {
    const isTsSource = import.meta.url.endsWith(".ts");
    const workerUrl = new URL(
        isTsSource ? "./ComputeWorker.ts" : "./ComputeWorker.js",
        import.meta.url
    );
    return workerUrl.href;
}

function buildExecArgv(): string[] | undefined {
    const isTsSource = import.meta.url.endsWith(".ts");
    if (!isTsSource) {
        return undefined;
    }
    // Enable TypeScript execution in worker threads while running under tsx (dev).
    // See: https://tsx.is/dev-api/
    return ["--import", "tsx"];
}

function createPool(): Piscina {
    const filename = buildWorkerFilename();
    const execArgv = buildExecArgv();

    const p = new Piscina({
        filename,
        ...(execArgv ? { execArgv } : {}),
        minThreads: WORKERS_MIN_THREADS,
        maxThreads: WORKERS_MAX_THREADS,
        ...(WORKERS_IDLE_TIMEOUT_MS >= 0
            ? { idleTimeout: WORKERS_IDLE_TIMEOUT_MS }
            : {}),
        ...(WORKERS_MAX_QUEUE !== undefined ? { maxQueue: WORKERS_MAX_QUEUE } : {}),
    });
    p.on("error", (err) => {
        logger.error({ err }, "Compute worker pool emitted an error");
    });

    return p;
}

function getPool(): Piscina {
    if (!pool) {
        pool = createPool();
    }
    return pool;
}

export function isComputePoolEnabled(): boolean {
    return WORKERS_ENABLED === true;
}

export function isComputePoolQueueAtLimitError(err: unknown): boolean {
    if (!(err instanceof Error)) {
        return false;
    }
    // Piscina uses these messages for backpressure / overload conditions.
    // See piscina/src/errors.ts in the dependency for the canonical strings.
    return (
        err.message === "Task queue is at limit" ||
        err.message === "No task queue available and all Workers are busy"
    );
}

export async function runPrepareUpsertBatch(
    task: PrepareUpsertBatchTask
): Promise<PreparedUpsertRow[]> {
    return (await getPool().run(task, {
        name: "prepareUpsertBatch" satisfies PoolTaskName,
    })) as PreparedUpsertRow[];
}

export async function runVerifySearchRows(
    task: VerifySearchRowsTask
): Promise<VerifySearchRowsResult> {
    return (await getPool().run(task, {
        name: "verifySearchRows" satisfies PoolTaskName,
    })) as VerifySearchRowsResult;
}
