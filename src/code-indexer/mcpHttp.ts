import express, { type Request, type Response } from "express";

import {
    CodeIndexerMcpServer,
    type CodeIndexerMcpDeps,
    type CodeIndexerMcpPullRequestIndexSummary,
    type CodeIndexerMcpRepositoryIndexSummary,
    type CodeIndexerMcpRepositorySummary,
} from "./mcp.js";
import {
    defaultBranchCollectionForRepo,
    pullRequestCollectionForRepo,
} from "./naming.js";
import type {
    CodeIndexerApiTokenRecord,
    CodeIndexerInstallationRecord,
    CodeIndexerRepositoryRecord,
} from "./saasStore.js";
import type {
    IndexingJobProgressRecord,
    IndexingProgressStore,
} from "./types.js";

export type CodeIndexerMcpHttpStore = {
    findApiTokenByPlaintextToken(
        plaintextToken: string
    ): Promise<CodeIndexerApiTokenRecord | null>;
    getRepository(
        repoId: number | string
    ): Promise<CodeIndexerRepositoryRecord | null>;
    listInstallationsForUser(
        githubUserId: number | string
    ): Promise<CodeIndexerInstallationRecord[]>;
    listRepositoriesForInstallation(
        installationId: number | string
    ): Promise<CodeIndexerRepositoryRecord[]>;
};

export type CodeIndexerMcpHttpDeps = CodeIndexerMcpDeps & {
    accessStore: CodeIndexerMcpHttpStore;
    allowedOrigins: string[];
    progressStore: Pick<IndexingProgressStore, "listJobsForRepository">;
};

class McpHttpError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = "McpHttpError";
        this.statusCode = statusCode;
    }
}

const CORS_ALLOW_HEADERS =
    "Authorization, Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id";
const CORS_ALLOW_METHODS = "GET, POST, OPTIONS";
const CORS_EXPOSE_HEADERS = "Mcp-Session-Id";

function readBearerToken(req: Request): string | null {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }
    const token = authorization.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
}

function applyCorsHeaders(
    req: Request,
    res: Response,
    allowedOrigins: string[]
): void {
    const origin = req.header("origin");
    if (origin && !allowedOrigins.includes(origin)) {
        throw new McpHttpError(403, "origin is not allowed");
    }
    if (!origin) {
        return;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
    res.setHeader("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
    res.setHeader("Access-Control-Expose-Headers", CORS_EXPOSE_HEADERS);
    res.vary("Origin");
}

async function authenticate(
    req: Request,
    store: CodeIndexerMcpHttpStore
): Promise<CodeIndexerApiTokenRecord> {
    const token = readBearerToken(req);
    if (!token) {
        throw new McpHttpError(401, "unauthorized");
    }
    const record = await store.findApiTokenByPlaintextToken(token);
    if (!record) {
        throw new McpHttpError(401, "unauthorized");
    }
    return record;
}

function sendHttpError(res: Response, err: unknown): void {
    const statusCode = err instanceof McpHttpError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : String(err);
    res.status(statusCode).json({ error: message, status: "error" });
}

function toSafeIntegerId(value: number | string): number | null {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
}

function activeInstallations(
    installations: CodeIndexerInstallationRecord[]
): CodeIndexerInstallationRecord[] {
    return installations.filter(
        (installation) =>
            installation.status !== "deleted" &&
            installation.status !== "suspended"
    );
}

function isSearchableRepository(
    repository: CodeIndexerRepositoryRecord
): boolean {
    return repository.status !== "deleted";
}

function serializeDate(value: Date | undefined): string | undefined {
    return value ? value.toISOString() : undefined;
}

function serializeRepository(
    repository: CodeIndexerRepositoryRecord
): CodeIndexerMcpRepositorySummary | null {
    const installationId = toSafeIntegerId(repository.installationId);
    const repoId = toSafeIntegerId(repository.repoId);
    if (installationId === null || repoId === null) {
        return null;
    }
    return {
        ...(repository.chunkCount === undefined
            ? {}
            : { chunkCount: repository.chunkCount }),
        defaultBranch: repository.defaultBranch,
        installationId,
        ...(repository.lastError ? { lastError: repository.lastError } : {}),
        ...(repository.lastIndexedAt
            ? { lastIndexedAt: serializeDate(repository.lastIndexedAt) }
            : {}),
        ...(repository.lastIndexedSha
            ? { lastIndexedSha: repository.lastIndexedSha }
            : {}),
        owner: repository.owner,
        repo: repository.repo,
        repoId,
        status: repository.status,
    };
}

async function resolveAccessibleRepository(params: {
    accessStore: CodeIndexerMcpHttpStore;
    githubUserId: number | string;
    installationId?: number;
    owner?: string;
    repo?: string;
    repoId?: number;
}): Promise<CodeIndexerRepositoryRecord | null> {
    const installations = activeInstallations(
        await params.accessStore.listInstallationsForUser(params.githubUserId)
    );
    const accessibleInstallationIds = new Set(
        installations.map((installation) => installation.installationId)
    );
    if (params.repoId !== undefined) {
        const repository = await params.accessStore.getRepository(params.repoId);
        if (
            !repository ||
            !isSearchableRepository(repository) ||
            !accessibleInstallationIds.has(repository.installationId) ||
            (params.installationId !== undefined &&
                repository.installationId !== String(params.installationId))
        ) {
            return null;
        }
        return repository;
    }
    if (!params.owner || !params.repo) {
        return null;
    }
    for (const installation of installations) {
        const repositories =
            await params.accessStore.listRepositoriesForInstallation(
                installation.installationId
            );
        const repository = repositories.find(
            (candidate) =>
                isSearchableRepository(candidate) &&
                candidate.owner === params.owner &&
                candidate.repo === params.repo
        );
        if (repository) {
            return repository;
        }
    }
    return null;
}

async function listRepositoriesForUser(params: {
    accessStore: CodeIndexerMcpHttpStore;
    githubUserId: number | string;
}): Promise<CodeIndexerMcpRepositorySummary[]> {
    const installations = activeInstallations(
        await params.accessStore.listInstallationsForUser(params.githubUserId)
    );
    const repositories: CodeIndexerMcpRepositorySummary[] = [];
    for (const installation of installations) {
        const installationRepositories =
            await params.accessStore.listRepositoriesForInstallation(
                installation.installationId
            );
        for (const repository of installationRepositories) {
            if (!isSearchableRepository(repository)) {
                continue;
            }
            const summary = serializeRepository(repository);
            if (summary) {
                repositories.push(summary);
            }
        }
    }
    return repositories.sort((a, b) =>
        `${a.owner}/${a.repo}`.localeCompare(`${b.owner}/${b.repo}`)
    );
}

function statusForPullRequestJob(
    job: IndexingJobProgressRecord
): CodeIndexerMcpPullRequestIndexSummary["status"] | null {
    if (job.jobKind === "delete-pr-index") {
        if (job.status === "completed") {
            return "deleted";
        }
        if (job.status === "failed") {
            return "failed";
        }
        return "deleting";
    }
    if (job.jobKind !== "pr-index") {
        return null;
    }
    if (job.status === "completed") {
        return "ready";
    }
    if (job.status === "failed") {
        return "failed";
    }
    return job.status === "running" ? "indexing" : "queued";
}

function summarizePullRequestIndexes(params: {
    jobs: IndexingJobProgressRecord[];
    repoId: number;
}): CodeIndexerMcpPullRequestIndexSummary[] {
    const latestByPr = new Map<number, IndexingJobProgressRecord>();
    for (const job of params.jobs) {
        if (
            (job.jobKind !== "pr-index" && job.jobKind !== "delete-pr-index") ||
            job.prNumber === undefined
        ) {
            continue;
        }
        const existing = latestByPr.get(job.prNumber);
        if (!existing || existing.updatedAt < job.updatedAt) {
            latestByPr.set(job.prNumber, job);
        }
    }
    const summaries: CodeIndexerMcpPullRequestIndexSummary[] = [];
    for (const [prNumber, job] of latestByPr.entries()) {
        const status = statusForPullRequestJob(job);
        if (!status) {
            continue;
        }
        summaries.push({
            ...(status === "deleted"
                ? {}
                : {
                      collection: pullRequestCollectionForRepo(
                          params.repoId,
                          prNumber
                      ),
                  }),
            jobId: job.jobId,
            phase: job.phase,
            prNumber,
            status,
            updatedAt: job.updatedAt.toISOString(),
        });
    }
    return summaries.sort((a, b) =>
        (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
    );
}

export function createMcpHttpRouter(deps: CodeIndexerMcpHttpDeps) {
    const router = express.Router();
    const server = new CodeIndexerMcpServer({
        ...deps,
        repositoryCatalog: {
            listRepositories: async (params) => {
                return await listRepositoriesForUser({
                    accessStore: deps.accessStore,
                    githubUserId: params.githubUserId,
                });
            },
            listRepositoryIndexes: async (
                params
            ): Promise<CodeIndexerMcpRepositoryIndexSummary | null> => {
                const repository = await resolveAccessibleRepository({
                    accessStore: deps.accessStore,
                    githubUserId: params.githubUserId,
                    installationId: params.installationId,
                    owner: params.owner,
                    repo: params.repo,
                    repoId: params.repoId,
                });
                if (!repository) {
                    return null;
                }
                const summary = serializeRepository(repository);
                if (!summary) {
                    return null;
                }
                const jobs = await deps.progressStore.listJobsForRepository({
                    installationId: repository.installationId,
                    limit: params.limit ?? 25,
                    repoId: repository.repoId,
                });
                return {
                    defaultBranch: {
                        branch: repository.defaultBranch,
                        ...(repository.chunkCount === undefined
                            ? {}
                            : { chunkCount: repository.chunkCount }),
                        collection: defaultBranchCollectionForRepo(summary.repoId),
                        ...(repository.lastError
                            ? { lastError: repository.lastError }
                            : {}),
                        ...(repository.lastIndexedAt
                            ? {
                                  lastIndexedAt: serializeDate(
                                      repository.lastIndexedAt
                                  ),
                              }
                            : {}),
                        ...(repository.lastIndexedSha
                            ? { lastIndexedSha: repository.lastIndexedSha }
                            : {}),
                        status: repository.status,
                    },
                    installationId: summary.installationId,
                    owner: repository.owner,
                    pullRequests: summarizePullRequestIndexes({
                        jobs,
                        repoId: summary.repoId,
                    }),
                    repo: repository.repo,
                    repoId: summary.repoId,
                };
            },
        },
        repositoryResolver: {
            resolveRepository: async (params) => {
                const repository = await resolveAccessibleRepository({
                    accessStore: deps.accessStore,
                    githubUserId: params.githubUserId,
                    installationId: params.installationId,
                    owner: params.owner,
                    repo: params.repo,
                    repoId: params.repoId,
                });
                if (!repository) {
                    return null;
                }
                const installationId = toSafeIntegerId(repository.installationId);
                const repoId = toSafeIntegerId(repository.repoId);
                return installationId === null || repoId === null
                    ? null
                    : { installationId, repoId };
            },
        },
    });

    router.options("/", (req: Request, res: Response): void => {
        try {
            applyCorsHeaders(req, res, deps.allowedOrigins);
            res.status(204).send();
        } catch (err: unknown) {
            sendHttpError(res, err);
        }
    });

    router.get("/", async (req: Request, res: Response): Promise<void> => {
        try {
            applyCorsHeaders(req, res, deps.allowedOrigins);
            await authenticate(req, deps.accessStore);
            res.status(200)
                .type("text/event-stream")
                .send(": ydb-qdrant-code-indexer\n\n");
        } catch (err: unknown) {
            sendHttpError(res, err);
        }
    });

    router.post(
        "/",
        express.json({ limit: "1mb" }),
        async (req: Request, res: Response): Promise<void> => {
            try {
                applyCorsHeaders(req, res, deps.allowedOrigins);
                const token = await authenticate(req, deps.accessStore);
                const result = await server.handleJsonRpcMessage(
                    JSON.stringify(req.body),
                    { githubUserId: token.githubUserId }
                );
                if (!result) {
                    res.status(202).json({ status: "accepted" });
                    return;
                }
                res.status(200).type("application/json").send(JSON.stringify(result));
            } catch (err: unknown) {
                sendHttpError(res, err);
            }
        }
    );

    return router;
}
