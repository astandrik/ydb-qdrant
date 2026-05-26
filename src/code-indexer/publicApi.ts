import { randomBytes, randomUUID } from "node:crypto";

import express, { type Request, type Response } from "express";

import { logger } from "../logging/logger.js";
import {
    CodeIndexerAccessError,
    resolveDashboardSession,
    requireInstallationAccess,
    requireRepositoryAccess,
    type CodeIndexerAccessContext,
    type CodeIndexerAccessStore,
} from "./accessControl.js";
import {
    defaultBranchCollectionForRepo,
    repoCollectionPrefixForRepo,
    userUidForInstallation,
} from "./naming.js";
import {
    CodeIndexerQuotaError,
    type CodeIndexerQuota,
} from "./quota.js";
import type {
    CodeIndexerApiTokenRecord,
    CodeIndexerInstallationRecord,
    CodeIndexerRepositoryRecord,
    StoredGitHubUserSummary,
} from "./saasStore.js";
import type {
    CodeIndexStore,
    GitHubRepositoryRef,
    IndexingJobProgressRecord,
    IndexingProgressStore,
    IndexingQueue,
    RepoManifestStore,
} from "./types.js";

type CodeIndexerAdminProgressStore = IndexingProgressStore & {
    listAdminJobs(params?: {
        limit?: number;
    }): Promise<IndexingJobProgressRecord[]>;
};

export type CodeIndexerPublicApiStore = CodeIndexerAccessStore & {
    createApiToken(params: {
        githubUserId: number | string;
        name: string;
        plaintextToken: string;
        tokenId: string;
    }): Promise<void>;
    deleteApiTokensForUser(githubUserId: number | string): Promise<void>;
    deleteGitHubUser(githubUserId: number | string): Promise<void>;
    deleteInstallation(installationId: number | string): Promise<void>;
    deleteRepositoriesForInstallation(
        installationId: number | string
    ): Promise<void>;
    deleteSessionsForUser(githubUserId: number | string): Promise<void>;
    listApiTokens(
        githubUserId: number | string
    ): Promise<CodeIndexerApiTokenRecord[]>;
    listAdminApiTokens(params?: {
        limit?: number;
    }): Promise<CodeIndexerApiTokenRecord[]>;
    listAdminGitHubUsers(params?: {
        limit?: number;
    }): Promise<StoredGitHubUserSummary[]>;
    listAdminInstallations(params?: {
        limit?: number;
    }): Promise<CodeIndexerInstallationRecord[]>;
    listAdminRepositories(params?: {
        limit?: number;
    }): Promise<CodeIndexerRepositoryRecord[]>;
    listRepositoriesForInstallation(
        installationId: number | string
    ): Promise<CodeIndexerRepositoryRecord[]>;
    revokeApiToken(params: {
        githubUserId: number | string;
        tokenId: string;
    }): Promise<void>;
};

export type CodeIndexerPublicApiDeps = {
    adminGithubUserIds?: string[];
    createPlaintextToken?: () => string;
    createTokenId?: () => string;
    indexStore: CodeIndexStore;
    manifestStore?: RepoManifestStore;
    progressStore: CodeIndexerAdminProgressStore;
    quota?: CodeIndexerQuota;
    queue: IndexingQueue;
    store: CodeIndexerPublicApiStore;
};

class CodeIndexerPublicApiError extends Error {
    readonly code: string;
    readonly statusCode: number;

    constructor(params: { code: string; message: string; statusCode: number }) {
        super(params.message);
        this.name = "CodeIndexerPublicApiError";
        this.code = params.code;
        this.statusCode = params.statusCode;
    }
}

function apiError(
    code: string,
    message: string,
    statusCode: number
): CodeIndexerPublicApiError {
    return new CodeIndexerPublicApiError({ code, message, statusCode });
}

function readQueryString(value: unknown): string | undefined {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
        return value[0];
    }
    return undefined;
}

function readBodyRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function readTokenName(value: unknown): string {
    if (typeof value !== "string") {
        return "API token";
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 120) : "API token";
}

function readLimit(value: unknown, defaultValue: number, maxValue: number): number {
    const raw = readQueryString(value);
    if (!raw) {
        return defaultValue;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
        return defaultValue;
    }
    return Math.max(1, Math.min(maxValue, Math.floor(parsed)));
}

function readPathParam(req: Request, name: string): string {
    const value = req.params[name];
    if (!value) {
        throw apiError("bad_request", `${name} is required`, 400);
    }
    return value;
}

function toSafeIntegerId(value: number | string, name: string): number {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isSafeInteger(numeric) || numeric < 0) {
        throw apiError("bad_request", `${name} must be a safe integer`, 400);
    }
    return numeric;
}

function repositoryRefFromRecord(
    repository: CodeIndexerRepositoryRecord
): GitHubRepositoryRef {
    return {
        defaultBranch: repository.defaultBranch,
        owner: repository.owner,
        repo: repository.repo,
        repoId: toSafeIntegerId(repository.repoId, "repoId"),
    };
}

async function listIndexedCollectionsForRepository(params: {
    manifestStore: RepoManifestStore | undefined;
    repoId: number;
    userUid: string;
}): Promise<string[]> {
    const defaultCollection = defaultBranchCollectionForRepo(params.repoId);
    if (!params.manifestStore) {
        return [defaultCollection];
    }
    const collections = await params.manifestStore.listCollectionsByPrefix({
        collectionPrefix: repoCollectionPrefixForRepo(params.repoId),
        userUid: params.userUid,
    });
    return [...new Set([defaultCollection, ...collections])].sort();
}

function serializeProgress(progress: IndexingJobProgressRecord) {
    return {
        createdAt: progress.createdAt.toISOString(),
        ...(progress.currentPath === undefined
            ? {}
            : { currentPath: progress.currentPath }),
        ...(progress.finishedAt === undefined
            ? {}
            : { finishedAt: progress.finishedAt.toISOString() }),
        installationId: progress.installationId,
        jobId: progress.jobId,
        jobKind: progress.jobKind,
        ...(progress.lastError === undefined
            ? {}
            : { lastError: progress.lastError }),
        ...(progress.message === undefined ? {} : { message: progress.message }),
        owner: progress.owner,
        phase: progress.phase,
        processedChunks: progress.processedChunks,
        processedFiles: progress.processedFiles,
        ...(progress.prNumber === undefined ? {} : { prNumber: progress.prNumber }),
        repo: progress.repo,
        repoId: progress.repoId,
        ...(progress.startedAt === undefined
            ? {}
            : { startedAt: progress.startedAt.toISOString() }),
        status: progress.status,
        ...(progress.totalChunks === undefined
            ? {}
            : { totalChunks: progress.totalChunks }),
        ...(progress.totalFiles === undefined
            ? {}
            : { totalFiles: progress.totalFiles }),
        updatedAt: progress.updatedAt.toISOString(),
    };
}

function createDefaultPlaintextToken(): string {
    return `ydbqci_${randomBytes(32).toString("base64url")}`;
}

function sendApiError(res: Response, err: unknown): void {
    const knownError =
        err instanceof CodeIndexerAccessError ||
        err instanceof CodeIndexerQuotaError ||
        err instanceof CodeIndexerPublicApiError;
    const statusCode = knownError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : String(err);
    if (statusCode >= 500) {
        logger.error({ err }, "code-indexer public API failed");
    } else {
        logger.warn({ err }, "code-indexer public API rejected request");
    }
    res.status(statusCode).json({ error: message, status: "error" });
}

async function requireContext(
    deps: CodeIndexerPublicApiDeps,
    req: Request
): Promise<CodeIndexerAccessContext> {
    return await resolveDashboardSession({
        cookieHeader: req.header("cookie"),
        store: deps.store,
    });
}

async function requireAdminContext(
    deps: CodeIndexerPublicApiDeps,
    req: Request
): Promise<CodeIndexerAccessContext> {
    const context = await requireContext(deps, req);
    const adminIds = new Set((deps.adminGithubUserIds ?? []).map(String));
    if (!adminIds.has(context.user.githubUserId)) {
        throw apiError(
            "admin_forbidden",
            "admin access is not allowed for this GitHub user",
            403
        );
    }
    return context;
}

function countByStatus<T extends { status: string }>(
    items: T[]
): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
        counts[item.status] = (counts[item.status] ?? 0) + 1;
    }
    return counts;
}

function activeJobCount(jobs: IndexingJobProgressRecord[]): number {
    return jobs.filter(
        (job) => job.status === "pending" || job.status === "running"
    ).length;
}

function serializeAdminRepository(params: {
    installations: Map<string, CodeIndexerInstallationRecord>;
    jobs: IndexingJobProgressRecord[];
    repository: CodeIndexerRepositoryRecord;
}) {
    const installation = params.installations.get(params.repository.installationId);
    const activeJobs = params.jobs
        .filter(
            (job) =>
                job.repoId === params.repository.repoId &&
                (job.status === "pending" || job.status === "running")
        )
        .map(serializeProgress);
    const primaryJob =
        activeJobs.find((job) => job.status === "running") ?? activeJobs[0];

    return {
        ...params.repository,
        accountLogin: installation?.accountLogin ?? "unknown",
        accountType: installation?.accountType ?? "unknown",
        installationStatus: installation?.status ?? "unknown",
        ...(primaryJob ? { activeJob: primaryJob } : {}),
        ...(activeJobs.length > 0 ? { activeJobs } : {}),
    };
}

export function createPublicApiRouter(deps: CodeIndexerPublicApiDeps) {
    const router = express.Router();
    router.use(express.json({ limit: "64kb" }));

    router.get(
        "/admin/overview",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireAdminContext(deps, req);
                const [users, installations, repositories, tokens, jobs] =
                    await Promise.all([
                        deps.store.listAdminGitHubUsers({ limit: 10_000 }),
                        deps.store.listAdminInstallations({ limit: 10_000 }),
                        deps.store.listAdminRepositories({ limit: 10_000 }),
                        deps.store.listAdminApiTokens({ limit: 10_000 }),
                        deps.progressStore.listAdminJobs({ limit: 500 }),
                    ]);
                res.json({
                    overview: {
                        generatedAt: new Date().toISOString(),
                        recentJobs: jobs.slice(0, 25).map(serializeProgress),
                        totals: {
                            activeJobs: activeJobCount(jobs),
                            apiTokens: tokens.length,
                            failedJobs: jobs.filter(
                                (job) => job.status === "failed"
                            ).length,
                            indexedChunks: repositories.reduce(
                                (sum, repository) =>
                                    sum + (repository.chunkCount ?? 0),
                                0
                            ),
                            installations: installations.length,
                            repositories: repositories.length,
                            repositoriesByStatus: countByStatus(repositories),
                            revokedApiTokens: tokens.filter(
                                (token) => token.revoked
                            ).length,
                            users: users.length,
                        },
                    },
                    status: "ok",
                    user: context.user,
                });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.get(
        "/admin/repositories",
        async (req: Request, res: Response): Promise<void> => {
            try {
                await requireAdminContext(deps, req);
                const limit = readLimit(req.query.limit, 500, 2_000);
                const status = readQueryString(req.query.status);
                const query = readQueryString(req.query.q)?.toLowerCase();
                const [installations, repositories, jobs] = await Promise.all([
                    deps.store.listAdminInstallations({ limit: 10_000 }),
                    deps.store.listAdminRepositories({ limit: 10_000 }),
                    deps.progressStore.listAdminJobs({ limit: 500 }),
                ]);
                const installationsById = new Map(
                    installations.map((installation) => [
                        installation.installationId,
                        installation,
                    ])
                );
                const filteredRepositories = repositories
                    .filter((repository) =>
                        status ? repository.status === status : true
                    )
                    .filter((repository) =>
                        query
                            ? `${repository.owner}/${repository.repo}`
                                  .toLowerCase()
                                  .includes(query)
                            : true
                    )
                    .slice(0, limit)
                    .map((repository) =>
                        serializeAdminRepository({
                            installations: installationsById,
                            jobs,
                            repository,
                        })
                    );
                res.json({
                    limit,
                    repositories: filteredRepositories,
                    status: "ok",
                });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.get(
        "/admin/jobs",
        async (req: Request, res: Response): Promise<void> => {
            try {
                await requireAdminContext(deps, req);
                const limit = readLimit(req.query.limit, 100, 500);
                const status = readQueryString(req.query.status);
                const query = readQueryString(req.query.q)?.toLowerCase();
                const jobs = (await deps.progressStore.listAdminJobs({ limit: 500 }))
                    .filter((job) => (status ? job.status === status : true))
                    .filter((job) =>
                        query
                            ? `${job.owner}/${job.repo} ${job.jobId}`
                                  .toLowerCase()
                                  .includes(query)
                            : true
                    )
                    .slice(0, limit)
                    .map(serializeProgress);
                res.json({ jobs, limit, status: "ok" });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.get("/me", async (req: Request, res: Response): Promise<void> => {
        try {
            const context = await requireContext(deps, req);
            res.json({ status: "ok", user: context.user });
        } catch (err: unknown) {
            sendApiError(res, err);
        }
    });

    router.get(
        "/installations",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const installations = await deps.store.listInstallationsForUser(
                    context.user.githubUserId
                );
                res.json({ installations, status: "ok" });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.get(
        "/repositories",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const installationId = readQueryString(req.query.installationId);
                if (!installationId) {
                    throw apiError(
                        "bad_request",
                        "installationId is required",
                        400
                    );
                }
                await requireInstallationAccess({
                    context,
                    installationId,
                    store: deps.store,
                });
                const repositories =
                    await deps.store.listRepositoriesForInstallation(
                        installationId
                    );
                const activeJobs =
                    await deps.progressStore.listActiveJobsForInstallation(
                        installationId
                    );
                const activeJobsByRepoId = new Map<
                    string,
                    ReturnType<typeof serializeProgress>[]
                >();
                for (const job of activeJobs) {
                    const serializedJob = serializeProgress(job);
                    activeJobsByRepoId.set(job.repoId, [
                        ...(activeJobsByRepoId.get(job.repoId) ?? []),
                        serializedJob,
                    ]);
                }
                res.json({
                    repositories: repositories.map((repository) => {
                        const repoJobs =
                            activeJobsByRepoId.get(repository.repoId) ?? [];
                        const primaryJob =
                            repoJobs.find((job) => job.status === "running") ??
                            repoJobs[0];
                        return {
                            ...repository,
                            ...(primaryJob ? { activeJob: primaryJob } : {}),
                            ...(repoJobs.length > 0
                                ? { activeJobs: repoJobs }
                                : {}),
                        };
                    }),
                    status: "ok",
                });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.post(
        "/repositories/:repoId/reindex",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const repository = await requireRepositoryAccess({
                    context,
                    repoId: readPathParam(req, "repoId"),
                    store: deps.store,
                });
                const repositories =
                    await deps.store.listRepositoriesForInstallation(
                        repository.installationId
                    );
                deps.quota?.assertRepositoriesPerInstallation({
                    githubUserId: context.user.githubUserId,
                    installationId: repository.installationId,
                    repoCount: repositories.filter(
                        (candidate) => candidate.status !== "deleted"
                    ).length,
                });
                const job = await deps.queue.enqueue({
                    installationId: toSafeIntegerId(
                        repository.installationId,
                        "installationId"
                    ),
                    kind: "full-index",
                    reason: "manual-reindex",
                    ref: repository.defaultBranch,
                    repository: repositoryRefFromRecord(repository),
                });
                res.status(202).json({ job, status: "ok" });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.get(
        "/jobs/:jobId",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const progress = await deps.progressStore.getJobProgress(
                    readPathParam(req, "jobId")
                );
                if (!progress) {
                    throw apiError("not_found", "job not found", 404);
                }
                await requireRepositoryAccess({
                    context,
                    repoId: progress.repoId,
                    store: deps.store,
                });
                res.json({ job: serializeProgress(progress), status: "ok" });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.post("/tokens", async (req: Request, res: Response): Promise<void> => {
        try {
            const context = await requireContext(deps, req);
            const body = readBodyRecord(req.body);
            const name = readTokenName(body.name);
            const tokenId = deps.createTokenId?.() ?? randomUUID();
            const plaintextToken =
                deps.createPlaintextToken?.() ?? createDefaultPlaintextToken();
            await deps.store.createApiToken({
                githubUserId: context.user.githubUserId,
                name,
                plaintextToken,
                tokenId,
            });
            res.status(201).json({
                status: "ok",
                token: {
                    name,
                    plaintextToken,
                    tokenId,
                },
            });
        } catch (err: unknown) {
            sendApiError(res, err);
        }
    });

    router.get("/tokens", async (req: Request, res: Response): Promise<void> => {
        try {
            const context = await requireContext(deps, req);
            const tokens = await deps.store.listApiTokens(
                context.user.githubUserId
            );
            res.json({ status: "ok", tokens });
        } catch (err: unknown) {
            sendApiError(res, err);
        }
    });

    router.delete(
        "/tokens/:tokenId",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                await deps.store.revokeApiToken({
                    githubUserId: context.user.githubUserId,
                    tokenId: readPathParam(req, "tokenId"),
                });
                res.status(204).send();
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.post(
        "/privacy/delete-my-data",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const installations = await deps.store.listInstallationsForUser(
                    context.user.githubUserId
                );
                let deletedRepositories = 0;
                for (const installation of installations) {
                    const repositories =
                        await deps.store.listRepositoriesForInstallation(
                            installation.installationId
                        );
                    for (const repository of repositories) {
                        const installationId = toSafeIntegerId(
                            repository.installationId,
                            "installationId"
                        );
                        const repoId = toSafeIntegerId(
                            repository.repoId,
                            "repoId"
                        );
                        const userUid = userUidForInstallation(installationId);
                        const indexedCollections =
                            await listIndexedCollectionsForRepository({
                                manifestStore: deps.manifestStore,
                                repoId,
                                userUid,
                            });
                        for (const collection of indexedCollections) {
                            await deps.indexStore.deleteCollection({
                                collection,
                                userUid,
                            });
                            await deps.manifestStore?.delete({
                                collection,
                                userUid,
                            });
                        }
                        await deps.queue.enqueue({
                            installationId,
                            kind: "delete-repo-index",
                            reason: "privacy-delete",
                            repository: repositoryRefFromRecord(repository),
                        });
                        deletedRepositories += 1;
                    }
                    await deps.store.deleteRepositoriesForInstallation(
                        installation.installationId
                    );
                    await deps.store.deleteInstallation(
                        installation.installationId
                    );
                }
                await deps.store.deleteSessionsForUser(
                    context.user.githubUserId
                );
                await deps.store.deleteApiTokensForUser(
                    context.user.githubUserId
                );
                await deps.store.deleteGitHubUser(context.user.githubUserId);
                res.json({
                    deletedInstallations: installations.length,
                    deletedRepositories,
                    status: "ok",
                });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    return router;
}
