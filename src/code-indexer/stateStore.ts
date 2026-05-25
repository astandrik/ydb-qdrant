import { randomUUID, createHash } from "node:crypto";
import stableStringify from "fast-json-stable-stringify";
import type { Ydb } from "ydb-sdk";

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
    EnqueuedIndexingJob,
    IndexingJob,
    IndexingJobExecutionContext,
    IndexingJobPhase,
    IndexingJobProgressRecord,
    IndexingJobProgressUpdate,
    IndexingJobStatus,
    IndexingProgressStore,
    IndexingQueue,
    RepoIndexManifest,
    RepoManifestStore,
} from "./types.js";

export const CODE_INDEXER_DELIVERIES_TABLE =
    "qdrant_code_indexer_deliveries";
export const CODE_INDEXER_JOBS_TABLE = "qdrant_code_indexer_jobs";
export const CODE_INDEXER_JOB_PROGRESS_TABLE =
    "qdrant_code_indexer_job_progress";
export const CODE_INDEXER_MANIFESTS_TABLE =
    "qdrant_code_indexer_manifests";

const JOB_CLAIM_SCAN_LIMIT = 50;

type StoredJob = {
    attempts: number;
    job: IndexingJob;
    jobId: string;
};

export type YdbIndexingQueueOptions = {
    concurrency?: number;
    maxAttempts?: number;
    now?: () => Date;
    onFinalFailure?: (job: IndexingJob, err: unknown) => Promise<void>;
    progressStore?: IndexingProgressStore;
    retentionDays?: number;
    retryBackoffMs?: number;
};

type QueryRow = {
    items?: Array<
        | {
              textValue?: string;
              uint32Value?: number;
              uint64Value?: unknown;
              timestampValue?: Date | string;
              nullFlagValue?: unknown;
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

function optionalNull(itemType: Ydb.IType): Ydb.ITypedValue {
    return {
        type: Types.optional(itemType),
        value: TypedValues.VOID.value,
    } as Ydb.ITypedValue;
}

function optionalValue(
    value: Ydb.ITypedValue | undefined,
    itemType: Ydb.IType
): Ydb.ITypedValue {
    return value === undefined ? optionalNull(itemType) : TypedValues.optional(value);
}

function optionalUtf8(value: string | null): Ydb.ITypedValue {
    return optionalValue(
        value === null ? undefined : TypedValues.utf8(value),
        Types.UTF8
    );
}

function optionalTimestamp(value: Date | null): Ydb.ITypedValue {
    return optionalValue(
        value === null ? undefined : TypedValues.timestamp(value),
        Types.TIMESTAMP
    );
}

function optionalUint32(value: number | null): Ydb.ITypedValue {
    return optionalValue(
        value === null ? undefined : TypedValues.uint32(value),
        Types.UINT32
    );
}

function readFirstRow(result: ExecuteQueryResultLike): QueryRow | null {
    return result.resultSets?.[0]?.rows?.[0] ?? null;
}

function readRows(result: ExecuteQueryResultLike): QueryRow[] {
    return result.resultSets?.[0]?.rows ?? [];
}

function readText(row: QueryRow, index: number): string | undefined {
    const value = row.items?.[index]?.textValue;
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readUint(row: QueryRow, index: number): number | undefined {
    return (
        toSafeNumber(row.items?.[index]?.uint32Value) ??
        toSafeNumber(row.items?.[index]?.uint64Value) ??
        undefined
    );
}

function readTimestamp(row: QueryRow, index: number): Date | undefined {
    const item = row.items?.[index];
    const value = item?.timestampValue;
    if (value instanceof Date) {
        return value;
    }
    const numericValue = toSafeNumber(value) ?? toSafeNumber(item?.uint64Value);
    if (numericValue !== null) {
        return new Date(Math.trunc(numericValue / 1000));
    }
    if (typeof value === "string") {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
}

function sleep(ms: number): Promise<void> {
    if (ms <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return message.slice(0, 4000);
}

function repoLockKeyForJob(job: IndexingJob): string {
    return `${job.installationId}/${job.repository.repoId}`;
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

function isIndexingJobStatus(value: unknown): value is IndexingJobStatus {
    return (
        value === "pending" ||
        value === "running" ||
        value === "completed" ||
        value === "failed"
    );
}

function isIndexingJobPhase(value: unknown): value is IndexingJobPhase {
    return (
        value === "queued" ||
        value === "claiming" ||
        value === "loading_config" ||
        value === "fetching_tree" ||
        value === "resetting_collection" ||
        value === "processing_files" ||
        value === "fetching_file" ||
        value === "chunking" ||
        value === "embedding" ||
        value === "upserting" ||
        value === "saving_manifest" ||
        value === "deleting" ||
        value === "completed" ||
        value === "failed"
    );
}

function isIndexingJobKind(value: unknown): value is IndexingJob["kind"] {
    return (
        value === "full-index" ||
        value === "incremental-push" ||
        value === "delete-repo-index" ||
        value === "pr-index" ||
        value === "delete-pr-index"
    );
}

function parseJobProgressRow(row: QueryRow): IndexingJobProgressRecord {
    const jobId = readText(row, 0);
    const installationId = readText(row, 1);
    const repoId = readText(row, 2);
    const owner = readText(row, 3);
    const repo = readText(row, 4);
    const jobKind = readText(row, 5);
    const status = readText(row, 6);
    const phase = readText(row, 7);
    const createdAt = readTimestamp(row, 15);
    const updatedAt = readTimestamp(row, 17);
    const processedFiles = readUint(row, 10);
    const processedChunks = readUint(row, 12);

    if (
        !jobId ||
        !installationId ||
        !repoId ||
        !owner ||
        !repo ||
        !isIndexingJobKind(jobKind) ||
        !isIndexingJobStatus(status) ||
        !isIndexingJobPhase(phase) ||
        !createdAt ||
        !updatedAt ||
        processedFiles === undefined ||
        processedChunks === undefined
    ) {
        throw new Error("stored code-indexer job progress row is invalid");
    }

    return {
        createdAt,
        installationId,
        jobId,
        jobKind,
        owner,
        phase,
        processedChunks,
        processedFiles,
        repo,
        repoId,
        status,
        updatedAt,
        ...(readText(row, 8) ? { message: readText(row, 8) } : {}),
        ...(readUint(row, 9) !== undefined ? { totalFiles: readUint(row, 9) } : {}),
        ...(readUint(row, 11) !== undefined
            ? { totalChunks: readUint(row, 11) }
            : {}),
        ...(readText(row, 13) ? { currentPath: readText(row, 13) } : {}),
        ...(readText(row, 14) ? { lastError: readText(row, 14) } : {}),
        ...(readTimestamp(row, 16) ? { startedAt: readTimestamp(row, 16) } : {}),
        ...(readTimestamp(row, 18) ? { finishedAt: readTimestamp(row, 18) } : {}),
    };
}

function selectJobProgressColumns(): string {
    return `
            SELECT
                job_id,
                installation_id,
                repo_id,
                owner,
                repo,
                job_kind,
                status,
                phase,
                message,
                total_files,
                processed_files,
                total_chunks,
                processed_chunks,
                current_path,
                last_error,
                created_at,
                started_at,
                updated_at,
                finished_at`;
}

function addUtf8Update(params: {
    assignments: string[];
    column: string;
    declarations: string[];
    param: string;
    queryParams: Record<string, Ydb.ITypedValue>;
    value: string | undefined;
}): void {
    if (params.value === undefined) {
        return;
    }
    params.declarations.push(`DECLARE ${params.param} AS Utf8;`);
    params.assignments.push(`${params.column} = ${params.param}`);
    params.queryParams[params.param] = TypedValues.utf8(params.value);
}

function addUint32Update(params: {
    assignments: string[];
    column: string;
    declarations: string[];
    param: string;
    queryParams: Record<string, Ydb.ITypedValue>;
    value: number | undefined;
}): void {
    if (params.value === undefined) {
        return;
    }
    params.declarations.push(`DECLARE ${params.param} AS Uint32;`);
    params.assignments.push(`${params.column} = ${params.param}`);
    params.queryParams[params.param] = TypedValues.uint32(params.value);
}

function addOptionalUtf8Update(params: {
    assignments: string[];
    column: string;
    declarations: string[];
    param: string;
    queryParams: Record<string, Ydb.ITypedValue>;
    value: string | null | undefined;
}): void {
    if (params.value === undefined) {
        return;
    }
    params.declarations.push(`DECLARE ${params.param} AS Utf8?;`);
    params.assignments.push(`${params.column} = ${params.param}`);
    params.queryParams[params.param] = optionalUtf8(params.value);
}

function addOptionalUint32Update(params: {
    assignments: string[];
    column: string;
    declarations: string[];
    param: string;
    queryParams: Record<string, Ydb.ITypedValue>;
    value: number | null | undefined;
}): void {
    if (params.value === undefined) {
        return;
    }
    params.declarations.push(`DECLARE ${params.param} AS Uint32?;`);
    params.assignments.push(`${params.column} = ${params.param}`);
    params.queryParams[params.param] = optionalUint32(params.value);
}

function addOptionalTimestampUpdate(params: {
    assignments: string[];
    column: string;
    declarations: string[];
    param: string;
    queryParams: Record<string, Ydb.ITypedValue>;
    value: Date | null | undefined;
}): void {
    if (params.value === undefined) {
        return;
    }
    params.declarations.push(`DECLARE ${params.param} AS Timestamp?;`);
    params.assignments.push(`${params.column} = ${params.param}`);
    params.queryParams[params.param] = optionalTimestamp(params.value);
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

async function ensureJobProgressTable(): Promise<void> {
    await withSession(async (session) => {
        try {
            await session.describeTable(CODE_INDEXER_JOB_PROGRESS_TABLE);
            return;
        } catch (err: unknown) {
            if (!isTableNotFoundError(err)) {
                throw err;
            }
        }

        const desc = new TableDescription()
            .withColumns(
                new Column("job_id", Types.UTF8),
                new Column("installation_id", Types.UTF8),
                new Column("repo_id", Types.UTF8),
                new Column("owner", Types.UTF8),
                new Column("repo", Types.UTF8),
                new Column("job_kind", Types.UTF8),
                new Column("status", Types.UTF8),
                new Column("phase", Types.UTF8),
                new Column("message", Types.optional(Types.UTF8)),
                new Column("total_files", Types.optional(Types.UINT32)),
                new Column("processed_files", Types.UINT32),
                new Column("total_chunks", Types.optional(Types.UINT32)),
                new Column("processed_chunks", Types.UINT32),
                new Column("current_path", Types.optional(Types.UTF8)),
                new Column("last_error", Types.optional(Types.UTF8)),
                new Column("created_at", Types.TIMESTAMP),
                new Column("started_at", Types.optional(Types.TIMESTAMP)),
                new Column("updated_at", Types.TIMESTAMP),
                new Column("finished_at", Types.optional(Types.TIMESTAMP))
            )
            .withPrimaryKeys("job_id");
        try {
            await session.createTable(CODE_INDEXER_JOB_PROGRESS_TABLE, desc);
            logger.info(
                `created code-indexer job progress table ${CODE_INDEXER_JOB_PROGRESS_TABLE}`
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
        ensureJobProgressTable(),
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

export class YdbIndexingProgressStore implements IndexingProgressStore {
    async createJobProgress(params: {
        job: IndexingJob;
        jobId: string;
    }): Promise<IndexingJobProgressRecord> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $job_id AS Utf8;
            DECLARE $installation_id AS Utf8;
            DECLARE $repo_id AS Utf8;
            DECLARE $owner AS Utf8;
            DECLARE $repo AS Utf8;
            DECLARE $job_kind AS Utf8;

            UPSERT INTO ${CODE_INDEXER_JOB_PROGRESS_TABLE}
                (
                    job_id,
                    installation_id,
                    repo_id,
                    owner,
                    repo,
                    job_kind,
                    status,
                    phase,
                    message,
                    total_files,
                    processed_files,
                    total_chunks,
                    processed_chunks,
                    current_path,
                    last_error,
                    created_at,
                    started_at,
                    updated_at,
                    finished_at
                )
            VALUES (
                $job_id,
                $installation_id,
                $repo_id,
                $owner,
                $repo,
                $job_kind,
                Utf8("pending"),
                Utf8("queued"),
                CAST(NULL AS Utf8?),
                CAST(NULL AS Uint32?),
                0u,
                CAST(NULL AS Uint32?),
                0u,
                CAST(NULL AS Utf8?),
                CAST(NULL AS Utf8?),
                CurrentUtcTimestamp(),
                CAST(NULL AS Timestamp?),
                CurrentUtcTimestamp(),
                CAST(NULL AS Timestamp?)
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $installation_id: TypedValues.utf8(
                        String(params.job.installationId)
                    ),
                    $job_id: TypedValues.utf8(params.jobId),
                    $job_kind: TypedValues.utf8(params.job.kind),
                    $owner: TypedValues.utf8(params.job.repository.owner),
                    $repo: TypedValues.utf8(params.job.repository.repo),
                    $repo_id: TypedValues.utf8(
                        String(params.job.repository.repoId)
                    ),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
        const now = new Date();
        return {
            createdAt: now,
            installationId: String(params.job.installationId),
            jobId: params.jobId,
            jobKind: params.job.kind,
            owner: params.job.repository.owner,
            phase: "queued",
            processedChunks: 0,
            processedFiles: 0,
            repo: params.job.repository.repo,
            repoId: String(params.job.repository.repoId),
            status: "pending",
            updatedAt: now,
        };
    }

    async getJobProgress(
        jobId: string
    ): Promise<IndexingJobProgressRecord | null> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $job_id AS Utf8;

            ${selectJobProgressColumns()}
            FROM ${CODE_INDEXER_JOB_PROGRESS_TABLE}
            WHERE job_id = $job_id
            LIMIT 1;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                { $job_id: TypedValues.utf8(jobId) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        const row = readFirstRow(result);
        return row ? parseJobProgressRow(row) : null;
    }

    async listActiveJobsForInstallation(
        installationId: number | string
    ): Promise<IndexingJobProgressRecord[]> {
        await ensureCodeIndexerStateTables();
        const yql = `
            DECLARE $installation_id AS Utf8;

            ${selectJobProgressColumns()}
            FROM ${CODE_INDEXER_JOB_PROGRESS_TABLE}
            WHERE installation_id = $installation_id
              AND status IN (Utf8("pending"), Utf8("running"))
            ORDER BY updated_at DESC;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                { $installation_id: TypedValues.utf8(String(installationId)) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        return (result.resultSets?.[0]?.rows ?? []).map(parseJobProgressRow);
    }

    async updateJobProgress(params: {
        jobId: string;
        update: IndexingJobProgressUpdate;
    }): Promise<void> {
        await ensureCodeIndexerStateTables();
        const assignments = ["updated_at = CurrentUtcTimestamp()"];
        const declarations = ["DECLARE $job_id AS Utf8;"];
        const queryParams: Record<string, Ydb.ITypedValue> = {
            $job_id: TypedValues.utf8(params.jobId),
        };

        addUtf8Update({
            assignments,
            column: "status",
            declarations,
            param: "$status",
            queryParams,
            value: params.update.status,
        });
        addUtf8Update({
            assignments,
            column: "phase",
            declarations,
            param: "$phase",
            queryParams,
            value: params.update.phase,
        });
        addOptionalUtf8Update({
            assignments,
            column: "message",
            declarations,
            param: "$message",
            queryParams,
            value: params.update.message,
        });
        addOptionalUint32Update({
            assignments,
            column: "total_files",
            declarations,
            param: "$total_files",
            queryParams,
            value: params.update.totalFiles,
        });
        addUint32Update({
            assignments,
            column: "processed_files",
            declarations,
            param: "$processed_files",
            queryParams,
            value: params.update.processedFiles,
        });
        addOptionalUint32Update({
            assignments,
            column: "total_chunks",
            declarations,
            param: "$total_chunks",
            queryParams,
            value: params.update.totalChunks,
        });
        addUint32Update({
            assignments,
            column: "processed_chunks",
            declarations,
            param: "$processed_chunks",
            queryParams,
            value: params.update.processedChunks,
        });
        addOptionalUtf8Update({
            assignments,
            column: "current_path",
            declarations,
            param: "$current_path",
            queryParams,
            value: params.update.currentPath,
        });
        addOptionalUtf8Update({
            assignments,
            column: "last_error",
            declarations,
            param: "$last_error",
            queryParams,
            value:
                typeof params.update.lastError === "string"
                    ? params.update.lastError.slice(0, 4000)
                    : params.update.lastError,
        });
        addOptionalTimestampUpdate({
            assignments,
            column: "started_at",
            declarations,
            param: "$started_at",
            queryParams,
            value: params.update.startedAt,
        });
        addOptionalTimestampUpdate({
            assignments,
            column: "finished_at",
            declarations,
            param: "$finished_at",
            queryParams,
            value: params.update.finishedAt,
        });

        const yql = `
            ${declarations.join("\n            ")}

            UPDATE ${CODE_INDEXER_JOB_PROGRESS_TABLE}
            SET ${assignments.join(",\n                ")}
            WHERE job_id = $job_id;
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                queryParams,
                undefined,
                createExecuteQuerySettings()
            );
        });
    }
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
    private activeWorkerCount = 0;
    private claimLock: Promise<void> = Promise.resolve();
    private readonly concurrency: number;
    private drainRequested = false;
    private readonly maxAttempts: number;
    private readonly now: () => Date;
    private readonly onFinalFailure?: (job: IndexingJob, err: unknown) => Promise<void>;
    private readonly progressStore: IndexingProgressStore;
    private started = false;
    private readonly processJob: (
        job: IndexingJob,
        context: IndexingJobExecutionContext
    ) => Promise<void>;
    private readonly retentionMs: number;
    private readonly retryBackoffMs: number;
    private readonly runningRepoKeys = new Set<string>();

    constructor(
        processJob: (
            job: IndexingJob,
            context: IndexingJobExecutionContext
        ) => Promise<void>,
        options: YdbIndexingQueueOptions = {}
    ) {
        this.processJob = processJob;
        this.concurrency = Math.max(1, Math.floor(options.concurrency ?? 1));
        this.maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3));
        this.now = options.now ?? (() => new Date());
        this.onFinalFailure = options.onFinalFailure;
        this.progressStore =
            options.progressStore ?? new YdbIndexingProgressStore();
        this.retentionMs =
            Math.max(1, Math.floor(options.retentionDays ?? 14)) * 86_400_000;
        this.retryBackoffMs = Math.max(
            0,
            Math.floor(options.retryBackoffMs ?? 30_000)
        );
    }

    async enqueue(job: IndexingJob): Promise<EnqueuedIndexingJob> {
        await ensureCodeIndexerStateTables();
        const jobId = jobIdForJob(job);
        await this.enqueueStoredJob(job, jobId);
        await this.progressStore.createJobProgress({ job, jobId });
        this.drain();
        return { jobId, phase: "queued", status: "pending" };
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
        const workerCapacity = this.concurrency - this.activeWorkerCount;
        if (workerCapacity <= 0) {
            this.drainRequested = true;
            return;
        }
        this.drainRequested = false;
        for (let i = 0; i < workerCapacity; i += 1) {
            this.startDrainWorker();
        }
    }

    private startDrainWorker(): void {
        this.activeWorkerCount += 1;
        void this.drainWorker().finally(() => {
            this.activeWorkerCount -= 1;
            if (this.drainRequested) {
                this.drain();
            }
        });
    }

    private async drainWorker(): Promise<void> {
        while (true) {
            const storedJob = await this.claimNextPendingJob();
            if (!storedJob) {
                return;
            }
            const repoKey = repoLockKeyForJob(storedJob.job);
            try {
                await this.processStoredJob(storedJob);
            } finally {
                this.runningRepoKeys.delete(repoKey);
            }
        }
    }

    private async processStoredJob(storedJob: StoredJob): Promise<void> {
        try {
            await this.progressStore.updateJobProgress({
                jobId: storedJob.jobId,
                update: {
                    phase: "claiming",
                    startedAt: this.now(),
                    status: "running",
                },
            });
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
            await this.processJob(storedJob.job, {
                jobId: storedJob.jobId,
            });
            await this.markJobCompleted(storedJob.jobId);
            await this.progressStore.updateJobProgress({
                jobId: storedJob.jobId,
                update: {
                    finishedAt: this.now(),
                    lastError: null,
                    message: null,
                    phase: "completed",
                    status: "completed",
                },
            });
        } catch (err: unknown) {
            const attempt = storedJob.attempts + 1;
            if (attempt < this.maxAttempts) {
                await this.markJobPendingForRetry(storedJob.jobId, err);
                await this.progressStore.updateJobProgress({
                    jobId: storedJob.jobId,
                    update: {
                        lastError: sanitizeError(err),
                        message: `Retrying after attempt ${attempt} failed.`,
                        phase: "queued",
                        status: "pending",
                    },
                });
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
                await this.progressStore.updateJobProgress({
                    jobId: storedJob.jobId,
                    update: {
                        finishedAt: this.now(),
                        lastError: sanitizeError(err),
                        message: "Indexing failed permanently.",
                        phase: "failed",
                        status: "failed",
                    },
                });
                await this.reportFinalFailure(storedJob.job, err);
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

    private async reportFinalFailure(
        job: IndexingJob,
        err: unknown
    ): Promise<void> {
        if (!this.onFinalFailure) {
            return;
        }
        try {
            await this.onFinalFailure(job, err);
        } catch (reportErr: unknown) {
            logger.error(
                { err: reportErr, jobKind: job.kind, repoId: job.repository.repoId },
                "code-indexer: final failure status update failed"
            );
        }
    }

    private async enqueueStoredJob(
        job: IndexingJob,
        jobId: string
    ): Promise<void> {
        const yql = `
            DECLARE $job_id AS Utf8;
            DECLARE $payload AS JsonDocument;

            UPSERT INTO ${CODE_INDEXER_JOBS_TABLE}
                (job_id, status, attempts, payload, created_at, updated_at, last_error)
            VALUES (
                $job_id,
                Utf8("pending"),
                0u,
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
                    $job_id: TypedValues.utf8(jobId),
                    $payload: TypedValues.jsonDocument(ensureJsonSerializable(job)),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    private async claimNextPendingJob(): Promise<StoredJob | null> {
        return await this.withClaimLock(async () => {
            const storedJob = await this.selectNextUnlockedPendingJob();
            if (!storedJob) {
                return null;
            }
            await this.markJobRunning(storedJob.jobId);
            this.runningRepoKeys.add(repoLockKeyForJob(storedJob.job));
            return storedJob;
        });
    }

    private async selectNextUnlockedPendingJob(): Promise<StoredJob | null> {
        let offset = 0;
        while (true) {
            const rows = await this.selectPendingJobRows(offset);
            for (const row of rows) {
                const storedJob = parseStoredJob(row);
                if (!this.runningRepoKeys.has(repoLockKeyForJob(storedJob.job))) {
                    return storedJob;
                }
            }
            if (rows.length < JOB_CLAIM_SCAN_LIMIT) {
                return null;
            }
            offset += JOB_CLAIM_SCAN_LIMIT;
        }
    }

    private async selectPendingJobRows(offset: number): Promise<QueryRow[]> {
        const yql = `
            SELECT job_id, payload, attempts
            FROM ${CODE_INDEXER_JOBS_TABLE}
            WHERE status = Utf8("pending")
            ORDER BY created_at
            LIMIT ${JOB_CLAIM_SCAN_LIMIT} OFFSET ${offset};
        `;

        return await withSession(async (session) => {
            const result = (await session.executeQuery(
                yql,
                {},
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
            return readRows(result);
        });
    }

    private async markJobRunning(jobId: string): Promise<void> {
        const yql = `
            DECLARE $job_id AS Utf8;

            UPDATE ${CODE_INDEXER_JOBS_TABLE}
            SET status = Utf8("running"),
                attempts = attempts + 1u,
                updated_at = CurrentUtcTimestamp()
            WHERE job_id = $job_id AND status = Utf8("pending");
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

    private async withClaimLock<T>(fn: () => Promise<T>): Promise<T> {
        const previous = this.claimLock;
        let release!: () => void;
        this.claimLock = new Promise<void>((resolve) => {
            release = resolve;
        });
        await previous;
        try {
            return await fn();
        } finally {
            release();
        }
    }

    private async markJobCompleted(jobId: string): Promise<void> {
        const yql = `
            DECLARE $job_id AS Utf8;

            UPDATE ${CODE_INDEXER_JOBS_TABLE}
            SET status = Utf8("completed"),
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
            SET status = Utf8("failed"),
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
            SET status = Utf8("pending"),
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
            SET status = Utf8("pending"),
                updated_at = CurrentUtcTimestamp()
            WHERE status = Utf8("running");
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
                AND (status = Utf8("completed") OR status = Utf8("failed"));
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
