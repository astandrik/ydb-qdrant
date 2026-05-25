import { randomUUID, createHash } from "node:crypto";
import stableStringify from "fast-json-stable-stringify";

import {
    Column,
    createExecuteQuerySettings,
    TableDescription,
    TypedValues,
    Types,
    withSession,
} from "../ydb/client.js";
import { logger } from "../logging/logger.js";
import type {
    DeliveryStore,
    IndexingJob,
    IndexingQueue,
    RepoIndexManifest,
    RepoManifestStore,
} from "./types.js";

export const CODE_INDEXER_DELIVERIES_TABLE =
    "qdrant_code_indexer_deliveries";
export const CODE_INDEXER_JOBS_TABLE = "qdrant_code_indexer_jobs";
export const CODE_INDEXER_MANIFESTS_TABLE =
    "qdrant_code_indexer_manifests";

type StoredJob = {
    attempts: number;
    job: IndexingJob;
    jobId: string;
};

export type YdbIndexingQueueOptions = {
    maxAttempts?: number;
    now?: () => Date;
    retentionDays?: number;
    retryBackoffMs?: number;
};

type QueryRow = {
    items?: Array<
        | {
              textValue?: string;
              uint32Value?: number;
              uint64Value?: unknown;
          }
        | undefined
    >;
};

type ExecuteQueryResultLike = {
    resultSets?: Array<{
        rows?: QueryRow[];
    }>;
};

let stateTablesReady = false;
let stateTablesReadyInFlight: Promise<void> | null = null;

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

function ensureJsonSerializable(value: unknown): string {
    const json = stableStringify(value);
    if (!json) {
        throw new Error("code-indexer job is not JSON-serializable");
    }
    return json;
}

function toSafeNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value)) {
        const parsed = Number(value);
        return Number.isSafeInteger(parsed) ? parsed : null;
    }
    if (value && typeof value === "object") {
        const longLike = value as { low?: unknown; high?: unknown };
        if (typeof longLike.low === "number" && typeof longLike.high === "number") {
            const parsed =
                BigInt(longLike.low >>> 0) +
                (BigInt(longLike.high >>> 0) << 32n);
            if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
                return null;
            }
            return Number(parsed);
        }
    }
    return null;
}

function readFirstRow(result: ExecuteQueryResultLike): QueryRow | null {
    return result.resultSets?.[0]?.rows?.[0] ?? null;
}

function sleep(ms: number): Promise<void> {
    if (ms <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isRepositoryRef(value: unknown): boolean {
    return (
        isRecord(value) &&
        typeof value.defaultBranch === "string" &&
        typeof value.owner === "string" &&
        typeof value.repo === "string" &&
        typeof value.repoId === "number"
    );
}

function parseIndexingJob(value: unknown): IndexingJob {
    if (
        !isRecord(value) ||
        typeof value.kind !== "string" ||
        typeof value.installationId !== "number" ||
        !isRepositoryRef(value.repository)
    ) {
        throw new Error("stored code-indexer job payload is invalid");
    }

    switch (value.kind) {
        case "full-index":
            if (typeof value.ref !== "string" || typeof value.reason !== "string") {
                break;
            }
            return value as IndexingJob;
        case "incremental-push":
            if (
                typeof value.after !== "string" ||
                typeof value.before !== "string" ||
                typeof value.created !== "boolean" ||
                typeof value.deleted !== "boolean" ||
                typeof value.forced !== "boolean" ||
                typeof value.ref !== "string"
            ) {
                break;
            }
            return value as IndexingJob;
        case "delete-repo-index":
            if (typeof value.reason !== "string") {
                break;
            }
            return value as IndexingJob;
        case "pr-index":
            if (
                typeof value.baseRef !== "string" ||
                typeof value.headRef !== "string" ||
                typeof value.headSha !== "string" ||
                typeof value.prNumber !== "number" ||
                !isRepositoryRef(value.sourceRepository)
            ) {
                break;
            }
            return value as IndexingJob;
        case "delete-pr-index":
            if (
                typeof value.prNumber !== "number" ||
                typeof value.reason !== "string"
            ) {
                break;
            }
            return value as IndexingJob;
    }

    throw new Error("stored code-indexer job payload is invalid");
}

function parseStoredJob(row: QueryRow): StoredJob {
    const jobId = row.items?.[0]?.textValue;
    const payloadText = row.items?.[1]?.textValue;
    const attempts =
        toSafeNumber(row.items?.[2]?.uint32Value) ??
        toSafeNumber(row.items?.[2]?.uint64Value) ??
        0;

    if (typeof jobId !== "string" || typeof payloadText !== "string") {
        throw new Error("stored code-indexer job row is invalid");
    }

    return {
        attempts,
        job: parseIndexingJob(JSON.parse(payloadText) as unknown),
        jobId,
    };
}

function manifestIdFor(params: { collection: string; userUid: string }): string {
    return `${params.userUid}/${params.collection}`;
}

function isManifestFile(value: unknown): boolean {
    return (
        isRecord(value) &&
        typeof value.blobSha === "string" &&
        typeof value.path === "string"
    );
}

function parseRepoIndexManifest(value: unknown): RepoIndexManifest {
    if (
        !isRecord(value) ||
        typeof value.collection !== "string" ||
        !Array.isArray(value.files) ||
        !value.files.every(isManifestFile) ||
        (value.indexingFingerprint !== undefined &&
            typeof value.indexingFingerprint !== "string") ||
        typeof value.ref !== "string" ||
        !isRepositoryRef(value.repository) ||
        typeof value.sha !== "string" ||
        typeof value.userUid !== "string"
    ) {
        throw new Error("stored code-indexer repo manifest payload is invalid");
    }
    return value as RepoIndexManifest;
}

async function ensureDeliveryTable(): Promise<void> {
    await withSession(async (session) => {
        try {
            await session.describeTable(CODE_INDEXER_DELIVERIES_TABLE);
            return;
        } catch (err: unknown) {
            if (!isTableNotFoundError(err)) {
                throw err;
            }
        }

        const desc = new TableDescription()
            .withColumns(
                new Column("delivery_id", Types.UTF8),
                new Column("received_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("delivery_id");
        try {
            await session.createTable(CODE_INDEXER_DELIVERIES_TABLE, desc);
            logger.info(
                `created code-indexer deliveries table ${CODE_INDEXER_DELIVERIES_TABLE}`
            );
        } catch (err: unknown) {
            if (!isAlreadyExistsError(err)) {
                throw err;
            }
        }
    });
}

async function ensureJobsTable(): Promise<void> {
    await withSession(async (session) => {
        try {
            await session.describeTable(CODE_INDEXER_JOBS_TABLE);
            return;
        } catch (err: unknown) {
            if (!isTableNotFoundError(err)) {
                throw err;
            }
        }

        const desc = new TableDescription()
            .withColumns(
                new Column("job_id", Types.UTF8),
                new Column("status", Types.UTF8),
                new Column("attempts", Types.UINT32),
                new Column("payload", Types.JSON_DOCUMENT),
                new Column("created_at", Types.TIMESTAMP),
                new Column("updated_at", Types.TIMESTAMP),
                new Column("last_error", Types.optional(Types.UTF8))
            )
            .withPrimaryKeys("job_id");
        try {
            await session.createTable(CODE_INDEXER_JOBS_TABLE, desc);
            logger.info(
                `created code-indexer jobs table ${CODE_INDEXER_JOBS_TABLE}`
            );
        } catch (err: unknown) {
            if (!isAlreadyExistsError(err)) {
                throw err;
            }
        }
    });
}

async function ensureManifestsTable(): Promise<void> {
    await withSession(async (session) => {
        try {
            await session.describeTable(CODE_INDEXER_MANIFESTS_TABLE);
            return;
        } catch (err: unknown) {
            if (!isTableNotFoundError(err)) {
                throw err;
            }
        }

        const desc = new TableDescription()
            .withColumns(
                new Column("manifest_id", Types.UTF8),
                new Column("payload", Types.JSON_DOCUMENT),
                new Column("updated_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("manifest_id");
        try {
            await session.createTable(CODE_INDEXER_MANIFESTS_TABLE, desc);
            logger.info(
                `created code-indexer manifests table ${CODE_INDEXER_MANIFESTS_TABLE}`
            );
        } catch (err: unknown) {
            if (!isAlreadyExistsError(err)) {
                throw err;
            }
        }
    });
}

export async function ensureCodeIndexerStateTables(): Promise<void> {
    if (stateTablesReady) {
        return;
    }
    if (stateTablesReadyInFlight) {
        await stateTablesReadyInFlight;
        return;
    }

    stateTablesReadyInFlight = Promise.all([
        ensureDeliveryTable(),
        ensureJobsTable(),
        ensureManifestsTable(),
    ]).then(() => undefined);
    try {
        await stateTablesReadyInFlight;
        stateTablesReady = true;
    } finally {
        stateTablesReadyInFlight = null;
    }
}

export function jobIdForJob(job: IndexingJob): string {
    if (!job.deliveryId) {
        return `manual:${randomUUID()}`;
    }
    const digest = createHash("sha256")
        .update(ensureJsonSerializable(job))
        .digest("hex")
        .slice(0, 24);
    return `${job.deliveryId}:${digest}`;
}

export class YdbDeliveryStore implements DeliveryStore {
    async has(deliveryId: string): Promise<boolean> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $delivery_id AS Utf8;
            SELECT delivery_id
            FROM ${CODE_INDEXER_DELIVERIES_TABLE}
            WHERE delivery_id = $delivery_id
            LIMIT 1;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                { $delivery_id: TypedValues.utf8(deliveryId) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        return readFirstRow(result) !== null;
    }

    async mark(deliveryId: string): Promise<void> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $delivery_id AS Utf8;
            UPSERT INTO ${CODE_INDEXER_DELIVERIES_TABLE}
                (delivery_id, received_at)
            VALUES ($delivery_id, CurrentUtcTimestamp());
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                { $delivery_id: TypedValues.utf8(deliveryId) },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }
}

export class YdbRepoManifestStore implements RepoManifestStore {
    async delete(params: { collection: string; userUid: string }): Promise<void> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $manifest_id AS Utf8;

            DELETE FROM ${CODE_INDEXER_MANIFESTS_TABLE}
            WHERE manifest_id = $manifest_id;
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                { $manifest_id: TypedValues.utf8(manifestIdFor(params)) },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async get(params: {
        collection: string;
        userUid: string;
    }): Promise<RepoIndexManifest | null> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $manifest_id AS Utf8;

            SELECT payload
            FROM ${CODE_INDEXER_MANIFESTS_TABLE}
            WHERE manifest_id = $manifest_id
            LIMIT 1;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                { $manifest_id: TypedValues.utf8(manifestIdFor(params)) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        const row = readFirstRow(result);
        const payloadText = row?.items?.[0]?.textValue;
        return typeof payloadText === "string"
            ? parseRepoIndexManifest(JSON.parse(payloadText) as unknown)
            : null;
    }

    async save(manifest: RepoIndexManifest): Promise<void> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $manifest_id AS Utf8;
            DECLARE $payload AS JsonDocument;

            UPSERT INTO ${CODE_INDEXER_MANIFESTS_TABLE}
                (manifest_id, payload, updated_at)
            VALUES ($manifest_id, $payload, CurrentUtcTimestamp());
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $manifest_id: TypedValues.utf8(manifestIdFor(manifest)),
                    $payload: TypedValues.jsonDocument(
                        ensureJsonSerializable(manifest)
                    ),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }
}

export class YdbIndexingQueue implements IndexingQueue {
    private active = false;
    private drainRequested = false;
    private readonly maxAttempts: number;
    private readonly now: () => Date;
    private started = false;
    private readonly processJob: (job: IndexingJob) => Promise<void>;
    private readonly retentionMs: number;
    private readonly retryBackoffMs: number;

    constructor(
        processJob: (job: IndexingJob) => Promise<void>,
        options: YdbIndexingQueueOptions = {}
    ) {
        this.processJob = processJob;
        this.maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3));
        this.now = options.now ?? (() => new Date());
        this.retentionMs =
            Math.max(1, Math.floor(options.retentionDays ?? 14)) * 86_400_000;
        this.retryBackoffMs = Math.max(
            0,
            Math.floor(options.retryBackoffMs ?? 30_000)
        );
    }

    async enqueue(job: IndexingJob): Promise<void> {
        await ensureCodeIndexerStateTables();
        await this.enqueueStoredJob(job);
        this.drain();
    }

    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;
        void this.resetRunningJobsAndDrain();
    }

    private async resetRunningJobsAndDrain(): Promise<void> {
        await ensureCodeIndexerStateTables();
        await this.resetRunningJobs();
        await this.cleanupExpiredState();
        this.drain();
    }

    private drain(): void {
        if (this.active) {
            this.drainRequested = true;
            return;
        }
        this.active = true;
        void this.drainLoop();
    }

    private async drainLoop(): Promise<void> {
        try {
            while (true) {
                const storedJob = await this.claimNextPendingJob();
                if (!storedJob) {
                    break;
                }

                try {
                    logger.info(
                        {
                            attempts: storedJob.attempts + 1,
                            deliveryId: storedJob.job.deliveryId,
                            installationId: storedJob.job.installationId,
                            jobId: storedJob.jobId,
                            jobKind: storedJob.job.kind,
                            repoId: storedJob.job.repository.repoId,
                        },
                        "code-indexer: processing durable job"
                    );
                    await this.processJob(storedJob.job);
                    await this.markJobCompleted(storedJob.jobId);
                } catch (err: unknown) {
                    const attempt = storedJob.attempts + 1;
                    if (attempt < this.maxAttempts) {
                        await this.markJobPendingForRetry(storedJob.jobId, err);
                        logger.warn(
                            {
                                attempt,
                                err,
                                jobId: storedJob.jobId,
                                jobKind: storedJob.job.kind,
                                maxAttempts: this.maxAttempts,
                                retryBackoffMs: this.retryBackoffMs,
                            },
                            "code-indexer: durable job failed; retrying"
                        );
                        await sleep(this.retryBackoffMs);
                    } else {
                        await this.markJobFailed(storedJob.jobId, err);
                        logger.error(
                            {
                                attempt,
                                err,
                                jobId: storedJob.jobId,
                                jobKind: storedJob.job.kind,
                                maxAttempts: this.maxAttempts,
                            },
                            "code-indexer: durable job failed permanently"
                        );
                    }
                }
            }
        } finally {
            this.active = false;
            if (this.drainRequested) {
                this.drainRequested = false;
                this.drain();
            }
        }
    }

    private async enqueueStoredJob(job: IndexingJob): Promise<void> {
        const yql = `
            DECLARE $job_id AS Utf8;
            DECLARE $payload AS JsonDocument;

            UPSERT INTO ${CODE_INDEXER_JOBS_TABLE}
                (job_id, status, attempts, payload, created_at, updated_at, last_error)
            VALUES (
                $job_id,
                "pending",
                CAST(0 AS Uint32),
                $payload,
                CurrentUtcTimestamp(),
                CurrentUtcTimestamp(),
                CAST(NULL AS Utf8?)
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $job_id: TypedValues.utf8(jobIdForJob(job)),
                    $payload: TypedValues.jsonDocument(ensureJsonSerializable(job)),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    private async claimNextPendingJob(): Promise<StoredJob | null> {
        const selectYql = `
            SELECT job_id, payload, attempts
            FROM ${CODE_INDEXER_JOBS_TABLE}
            WHERE status = "pending"
            ORDER BY created_at
            LIMIT 1;
        `;
        const markRunningYql = `
            DECLARE $job_id AS Utf8;

            UPDATE ${CODE_INDEXER_JOBS_TABLE}
            SET status = "running",
                attempts = attempts + CAST(1 AS Uint32),
                updated_at = CurrentUtcTimestamp()
            WHERE job_id = $job_id AND status = "pending";
        `;

        return await withSession(async (session) => {
            const result = (await session.executeQuery(
                selectYql,
                {},
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
            const row = readFirstRow(result);
            if (!row) {
                return null;
            }
            const storedJob = parseStoredJob(row);
            await session.executeQuery(
                markRunningYql,
                { $job_id: TypedValues.utf8(storedJob.jobId) },
                undefined,
                createExecuteQuerySettings()
            );
            return storedJob;
        });
    }

    private async markJobCompleted(jobId: string): Promise<void> {
        const yql = `
            DECLARE $job_id AS Utf8;

            UPDATE ${CODE_INDEXER_JOBS_TABLE}
            SET status = "completed",
                updated_at = CurrentUtcTimestamp(),
                last_error = CAST(NULL AS Utf8?)
            WHERE job_id = $job_id;
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                { $job_id: TypedValues.utf8(jobId) },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    private async markJobFailed(jobId: string, err: unknown): Promise<void> {
        const yql = `
            DECLARE $job_id AS Utf8;
            DECLARE $last_error AS Utf8;

            UPDATE ${CODE_INDEXER_JOBS_TABLE}
            SET status = "failed",
                updated_at = CurrentUtcTimestamp(),
                last_error = $last_error
            WHERE job_id = $job_id;
        `;
        const message = err instanceof Error ? err.message : String(err);
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $job_id: TypedValues.utf8(jobId),
                    $last_error: TypedValues.utf8(message.slice(0, 4000)),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    private async markJobPendingForRetry(
        jobId: string,
        err: unknown
    ): Promise<void> {
        const yql = `
            DECLARE $job_id AS Utf8;
            DECLARE $last_error AS Utf8;

            UPDATE ${CODE_INDEXER_JOBS_TABLE}
            SET status = "pending",
                updated_at = CurrentUtcTimestamp(),
                last_error = $last_error
            WHERE job_id = $job_id;
        `;
        const message = err instanceof Error ? err.message : String(err);
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $job_id: TypedValues.utf8(jobId),
                    $last_error: TypedValues.utf8(message.slice(0, 4000)),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    private async resetRunningJobs(): Promise<void> {
        const yql = `
            UPDATE ${CODE_INDEXER_JOBS_TABLE}
            SET status = "pending",
                updated_at = CurrentUtcTimestamp()
            WHERE status = "running";
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {},
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    private async cleanupExpiredState(): Promise<void> {
        const cutoff = new Date(this.now().getTime() - this.retentionMs);
        const deleteJobsYql = `
            DECLARE $cutoff AS Timestamp;

            DELETE FROM ${CODE_INDEXER_JOBS_TABLE}
            WHERE updated_at < $cutoff
                AND (status = "completed" OR status = "failed");
        `;
        const deleteDeliveriesYql = `
            DECLARE $cutoff AS Timestamp;

            DELETE FROM ${CODE_INDEXER_DELIVERIES_TABLE}
            WHERE received_at < $cutoff;
        `;
        await withSession(async (session) => {
            const params = { $cutoff: TypedValues.timestamp(cutoff) };
            const settings = createExecuteQuerySettings();
            await session.executeQuery(
                deleteJobsYql,
                params,
                undefined,
                settings
            );
            await session.executeQuery(
                deleteDeliveriesYql,
                params,
                undefined,
                settings
            );
        });
    }
}
