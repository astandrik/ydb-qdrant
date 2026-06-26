import http from "node:http";

import { describe, expect, it, vi } from "vitest";

import { CODE_INDEXER_SESSION_COOKIE } from "../../src/code-indexer/auth.js";
import { createCodeIndexerQuota } from "../../src/code-indexer/quota.js";
import { buildCodeIndexerServer } from "../../src/code-indexer/server.js";
import type {
    CodeIndexStore,
    DeliveryStore,
    EmbeddingProvider,
    IndexingProgressStore,
    IndexingQueue,
    RepoManifestStore,
} from "../../src/code-indexer/types.js";

type TestResponse = {
    body: string;
    statusCode: number;
};

type TestSession = {
    githubUserId: string;
    sessionId: string;
};

type TestUser = {
    accessToken: string;
    githubUserId: string;
    login: string;
};

type TestInstallation = {
    accountLogin: string;
    accountType: string;
    createdByGithubUserId: string;
    installationId: string;
    status: string;
};

type TestRepository = {
    chunkCount?: number;
    defaultBranch: string;
    installationId: string;
    lastError?: string;
    lastIndexedAt?: Date;
    lastIndexedSha?: string;
    owner: string;
    repo: string;
    repoId: string;
    status: "queued" | "indexing" | "ready" | "failed" | "deleted";
};

type TestApiToken = {
    githubUserId: string;
    name: string;
    revoked: boolean;
    tokenId: string;
};

type TestAdminJob = {
    createdAt: Date;
    currentPath?: string;
    finishedAt?: Date;
    installationId: string;
    jobId: string;
    jobKind: "full-index" | "pr-index";
    lastError?: string;
    owner: string;
    phase: "queued" | "embedding" | "failed" | "completed";
    processedChunks: number;
    processedFiles: number;
    prNumber?: number;
    repo: string;
    repoId: string;
    startedAt?: Date;
    status: "pending" | "running" | "completed" | "failed";
    totalChunks?: number;
    totalFiles?: number;
    updatedAt: Date;
};

function createBaseDeps() {
    const deleteCollection = vi.fn(() => Promise.resolve());
    const enqueue = vi.fn(() =>
        Promise.resolve({
            jobId: "manual:test-job",
            phase: "queued" as const,
            status: "pending" as const,
        })
    );
    const deleteRepositoryJobs = vi.fn(() => Promise.resolve());
    const embeddingProvider: EmbeddingProvider = {
        dimension: 2,
        embedDocuments: vi.fn(),
        embedQuery: vi.fn(),
    };
    const indexStore: CodeIndexStore = {
        countCollection: vi.fn(),
        countExistingPointIds: vi.fn(),
        deleteCollection,
        deletePath: vi.fn(),
        ensureCollection: vi.fn(),
        resetCollection: vi.fn(),
        search: vi.fn(),
        upsertChunks: vi.fn(),
    };
    const deliveryStore: DeliveryStore = {
        has: vi.fn(),
        mark: vi.fn(),
    };
    const getJobProgress = vi.fn(() => Promise.resolve(null));
    const listActiveJobsForInstallation = vi.fn(() => Promise.resolve([]));
    const listAdminJobs = vi.fn((params?: { limit?: number }) =>
        Promise.resolve([
            {
                createdAt: new Date("2026-05-25T12:00:00.000Z"),
                currentPath: "src/index.ts",
                installationId: "777",
                jobId: "admin:running",
                jobKind: "full-index",
                owner: "astandrik",
                phase: "embedding",
                processedChunks: 30,
                processedFiles: 10,
                repo: "local-ydb-toolkit",
                repoId: "456",
                startedAt: new Date("2026-05-25T12:00:01.000Z"),
                status: "running",
                totalChunks: 100,
                totalFiles: 40,
                updatedAt: new Date("2026-05-25T12:00:02.000Z"),
            },
            {
                createdAt: new Date("2026-05-25T11:00:00.000Z"),
                finishedAt: new Date("2026-05-25T11:05:00.000Z"),
                installationId: "999",
                jobId: "admin:failed",
                jobKind: "pr-index",
                lastError: "embedding failed",
                owner: "other",
                phase: "failed",
                processedChunks: 3,
                processedFiles: 2,
                prNumber: 12,
                repo: "private",
                repoId: "999001",
                startedAt: new Date("2026-05-25T11:00:01.000Z"),
                status: "failed",
                totalChunks: 8,
                totalFiles: 4,
                updatedAt: new Date("2026-05-25T11:05:00.000Z"),
            },
        ].slice(0, params?.limit ?? 100) as TestAdminJob[])
    );
    const progressStore = {
        createJobProgress: vi.fn(),
        getJobProgress,
        listAdminJobs,
        listActiveJobsForInstallation,
        updateJobProgress: vi.fn(),
    } as IndexingProgressStore & {
        listAdminJobs(params?: { limit?: number }): Promise<TestAdminJob[]>;
    };
    const queue: IndexingQueue = {
        deleteRepositoryJobs,
        enqueue,
    };
    const listCollectionsByPrefix = vi.fn(() => Promise.resolve([]));
    const manifestStore: RepoManifestStore = {
        delete: vi.fn(() => Promise.resolve()),
        get: vi.fn(() => Promise.resolve(null)),
        listCollectionsByPrefix,
        save: vi.fn(() => Promise.resolve()),
    };
    return {
        deleteCollection,
        deliveryStore,
        deleteRepositoryJobs,
        embeddingProvider,
        enqueue,
        getJobProgress,
        indexStore,
        listAdminJobs,
        listActiveJobsForInstallation,
        listCollectionsByPrefix,
        progressStore,
        queue,
        manifestStore,
    };
}

function createPublicApiStore() {
    const sessions = new Map<string, TestSession>([
        ["session-id", { githubUserId: "123", sessionId: "session-id" }],
    ]);
    const users = new Map<string, TestUser>([
        [
            "123",
            {
                accessToken: "ghu-user",
                githubUserId: "123",
                login: "octocat",
            },
        ],
    ]);
    const installations: TestInstallation[] = [
        {
            accountLogin: "astandrik",
            accountType: "User",
            createdByGithubUserId: "123",
            installationId: "777",
            status: "active",
        },
    ];
    const repositories: TestRepository[] = [
        {
            chunkCount: 909,
            defaultBranch: "main",
            installationId: "777",
            lastIndexedAt: new Date("2026-05-25T09:00:00.000Z"),
            lastIndexedSha: "abc123",
            owner: "astandrik",
            repo: "local-ydb-toolkit",
            repoId: "456",
            status: "ready",
        },
        {
            defaultBranch: "main",
            installationId: "999",
            owner: "other",
            repo: "private",
            repoId: "999001",
            status: "ready",
        },
    ];
    const tokens: TestApiToken[] = [];

    const store = {
        createApiToken: vi.fn(
            (params: {
                githubUserId: number | string;
                name: string;
                plaintextToken: string;
                tokenId: string;
            }) => {
                tokens.push({
                    githubUserId: String(params.githubUserId),
                    name: params.name,
                    revoked: false,
                    tokenId: params.tokenId,
                });
                return Promise.resolve();
            }
        ),
        deleteApiTokensForUser: vi.fn((githubUserId: number | string) => {
            for (let index = tokens.length - 1; index >= 0; index -= 1) {
                if (tokens[index]?.githubUserId === String(githubUserId)) {
                    tokens.splice(index, 1);
                }
            }
            return Promise.resolve();
        }),
        deleteGitHubUser: vi.fn((githubUserId: number | string) => {
            users.delete(String(githubUserId));
            return Promise.resolve();
        }),
        countInstallationUsers: vi.fn(() => Promise.resolve(0)),
        deleteInstallation: vi.fn((installationId: number | string) => {
            const index = installations.findIndex(
                (installation) =>
                    installation.installationId === String(installationId)
            );
            if (index >= 0) {
                installations.splice(index, 1);
            }
            return Promise.resolve();
        }),
        deleteRepositoriesForInstallation: vi.fn(
            (installationId: number | string) => {
                for (
                    let index = repositories.length - 1;
                    index >= 0;
                    index -= 1
                ) {
                    if (
                        repositories[index]?.installationId ===
                        String(installationId)
                    ) {
                        repositories.splice(index, 1);
                    }
                }
                return Promise.resolve();
            }
        ),
        deleteInstallationUser: vi.fn(() => Promise.resolve()),
        deleteSessionsForUser: vi.fn((githubUserId: number | string) => {
            for (const [sessionId, session] of sessions.entries()) {
                if (session.githubUserId === String(githubUserId)) {
                    sessions.delete(sessionId);
                }
            }
            return Promise.resolve();
        }),
        getGitHubUser: vi.fn((githubUserId: number | string) =>
            Promise.resolve(users.get(String(githubUserId)) ?? null)
        ),
        getRepository: vi.fn((repoId: number | string) =>
            Promise.resolve(
                repositories.find(
                    (repository) => repository.repoId === String(repoId)
                ) ?? null
            )
        ),
        getSession: vi.fn((sessionId: string) =>
            Promise.resolve(sessions.get(sessionId) ?? null)
        ),
        listApiTokens: vi.fn((githubUserId: number | string) =>
            Promise.resolve(
                tokens.filter(
                    (token) => token.githubUserId === String(githubUserId)
                )
            )
        ),
        listAdminApiTokens: vi.fn(() => Promise.resolve(tokens)),
        listAdminGitHubUsers: vi.fn(() =>
            Promise.resolve([{ githubUserId: "123", login: "octocat" }])
        ),
        listAdminInstallations: vi.fn(() => Promise.resolve(installations)),
        listAdminRepositories: vi.fn(() => Promise.resolve(repositories)),
        listInstallationsForUser: vi.fn((githubUserId: number | string) =>
            Promise.resolve(
                installations.filter(
                    (installation) =>
                        installation.createdByGithubUserId ===
                        String(githubUserId)
                )
            )
        ),
        listRepositoriesForInstallation: vi.fn(
            (installationId: number | string) =>
                Promise.resolve(
                    repositories.filter(
                        (repository) =>
                            repository.installationId === String(installationId)
                    )
                )
        ),
        revokeApiToken: vi.fn(
            (params: { githubUserId: number | string; tokenId: string }) => {
                const token = tokens.find(
                    (candidate) =>
                        candidate.githubUserId === String(params.githubUserId) &&
                        candidate.tokenId === params.tokenId
                );
                if (token) {
                    token.revoked = true;
                }
                return Promise.resolve();
            }
        ),
    };

    return { store, tokens };
}

async function startPublicApiServer(options: {
    adminGithubUserIds?: string[];
    extraRepositories?: TestRepository[];
    quota?: ReturnType<typeof createCodeIndexerQuota>;
} = {}): Promise<{
    baseUrl: string;
    deps: ReturnType<typeof createBaseDeps>;
    server: http.Server;
    store: ReturnType<typeof createPublicApiStore>["store"];
}> {
    const deps = createBaseDeps();
    const { store } = createPublicApiStore();
    if (options.extraRepositories) {
        const originalList = store.listRepositoriesForInstallation;
        store.listRepositoriesForInstallation = vi.fn(
            async (installationId: number | string) => [
                ...(await originalList(installationId)),
                ...options.extraRepositories!.filter(
                    (repository) =>
                        repository.installationId === String(installationId)
                ),
            ]
        );
    }
    const app = buildCodeIndexerServer({
        deliveryStore: deps.deliveryStore,
        embeddingProvider: deps.embeddingProvider,
        publicApi: {
            adminGithubUserIds: options.adminGithubUserIds ?? [],
            createPlaintextToken: () => "ydbqci_plaintext",
            createTokenId: () => "token-id",
            indexStore: deps.indexStore,
            manifestStore: deps.manifestStore,
            progressStore: deps.progressStore,
            quota: options.quota,
            queue: deps.queue,
            store,
        },
        queue: deps.queue,
        store: deps.indexStore,
        webhookSecret: "webhook-secret",
    });
    const server = http.createServer(app);

    await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("unexpected server address");
    }

    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        deps,
        server,
        store,
    };
}

async function closeServer(server: http.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
}

async function request(params: {
    baseUrl: string;
    body?: unknown;
    cookie?: string;
    method?: "DELETE" | "GET" | "POST";
    path: string;
}): Promise<TestResponse> {
    const url = new URL(params.path, params.baseUrl);
    const body =
        params.body === undefined ? undefined : JSON.stringify(params.body);
    return await new Promise((resolve, reject) => {
        const req = http.request(
            url,
            {
                headers: {
                    ...(params.cookie ? { Cookie: params.cookie } : {}),
                    ...(body
                        ? {
                              "Content-Length": String(Buffer.byteLength(body)),
                              "Content-Type": "application/json",
                          }
                        : {}),
                },
                method: params.method ?? "GET",
            },
            (res) => {
                const chunks: string[] = [];
                res.setEncoding("utf8");
                res.on("data", (chunk: string) => chunks.push(chunk));
                res.on("end", () => {
                    resolve({
                        body: chunks.join(""),
                        statusCode: res.statusCode ?? 0,
                    });
                });
            }
        );
        req.on("error", reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

function sessionCookie(): string {
    return `${CODE_INDEXER_SESSION_COOKIE}=session-id`;
}

describe("code-indexer public API", () => {
    it("rejects unauthenticated API requests", async () => {
        const { baseUrl, server } = await startPublicApiServer();
        try {
            const response = await request({ baseUrl, path: "/api/me" });

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toMatchObject({
                error: "unauthenticated",
                status: "error",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("rejects unauthenticated admin API requests", async () => {
        const { baseUrl, server } = await startPublicApiServer({
            adminGithubUserIds: ["123"],
        });
        try {
            const response = await request({
                baseUrl,
                path: "/api/admin/overview",
            });

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toMatchObject({
                error: "unauthenticated",
                status: "error",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("rejects non-admin dashboard users from admin API requests", async () => {
        const { baseUrl, server } = await startPublicApiServer({
            adminGithubUserIds: ["999"],
        });
        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/admin/overview",
            });

            expect(response.statusCode).toBe(403);
            expect(JSON.parse(response.body)).toMatchObject({
                error: "admin access is not allowed for this GitHub user",
                status: "error",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("returns global admin overview, repositories, and jobs for allowlisted users", async () => {
        const { baseUrl, server } = await startPublicApiServer({
            adminGithubUserIds: ["123"],
        });
        try {
            const overview = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/admin/overview",
            });
            const repositories = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/admin/repositories",
            });
            const jobs = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/admin/jobs?status=failed",
            });

            expect(overview.statusCode).toBe(200);
            expect(JSON.parse(overview.body)).toMatchObject({
                overview: {
                    totals: {
                        activeJobs: 1,
                        apiTokens: 0,
                        failedJobs: 1,
                        installations: 1,
                        repositories: 2,
                        users: 1,
                    },
                },
                status: "ok",
                user: { githubUserId: "123", login: "octocat" },
            });
            expect(JSON.parse(repositories.body)).toMatchObject({
                repositories: [
                    {
                        accountLogin: "astandrik",
                        chunkCount: 909,
                        owner: "astandrik",
                        repo: "local-ydb-toolkit",
                        repoId: "456",
                        status: "ready",
                    },
                    {
                        accountLogin: "unknown",
                        owner: "other",
                        repo: "private",
                        repoId: "999001",
                        status: "ready",
                    },
                ],
                status: "ok",
            });
            expect(JSON.parse(jobs.body)).toMatchObject({
                jobs: [
                    {
                        jobId: "admin:failed",
                        lastError: "embedding failed",
                        prNumber: 12,
                        repoId: "999001",
                        status: "failed",
                    },
                ],
                status: "ok",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("returns the current user, installations, and authorized repositories", async () => {
        const { baseUrl, server } = await startPublicApiServer();
        try {
            const me = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/me",
            });
            const installations = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/installations",
            });
            const repositories = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/repositories?installationId=777",
            });

            expect(me.statusCode).toBe(200);
            expect(JSON.parse(me.body)).toMatchObject({
                status: "ok",
                user: { githubUserId: "123", login: "octocat" },
            });
            expect(JSON.parse(installations.body)).toMatchObject({
                installations: [
                    {
                        accountLogin: "astandrik",
                        installationId: "777",
                        status: "active",
                    },
                ],
                status: "ok",
            });
            expect(JSON.parse(repositories.body)).toMatchObject({
                repositories: [
                    {
                        owner: "astandrik",
                        repo: "local-ydb-toolkit",
                        repoId: "456",
                    },
                ],
                status: "ok",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("rejects reindex requests for repositories outside the user's installations", async () => {
        const { baseUrl, deps, server } = await startPublicApiServer();
        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                method: "POST",
                path: "/api/repositories/999001/reindex",
            });

            expect(response.statusCode).toBe(403);
            expect(JSON.parse(response.body)).toMatchObject({
                error: "repository is not accessible to the authenticated user",
                status: "error",
            });
            expect(deps.enqueue).not.toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });

    it("enqueues authorized repository reindex jobs", async () => {
        const { baseUrl, deps, server } = await startPublicApiServer();
        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                method: "POST",
                path: "/api/repositories/456/reindex",
            });

            expect(response.statusCode).toBe(202);
            expect(JSON.parse(response.body)).toMatchObject({
                job: {
                    jobId: "manual:test-job",
                    phase: "queued",
                    status: "pending",
                },
                status: "ok",
            });
            expect(deps.enqueue).toHaveBeenCalledWith({
                installationId: 777,
                kind: "full-index",
                reason: "manual-reindex",
                ref: "main",
                repository: {
                    defaultBranch: "main",
                    owner: "astandrik",
                    repo: "local-ydb-toolkit",
                    repoId: 456,
                },
            });
        } finally {
            await closeServer(server);
        }
    });

    it("returns active repository job progress and direct authorized job progress", async () => {
        const { baseUrl, deps, server } = await startPublicApiServer();
        const progress = {
            createdAt: new Date("2026-05-25T12:00:00.000Z"),
            currentPath: "src/index.ts",
            installationId: "777",
            jobId: "manual:test-job",
            jobKind: "pr-index" as const,
            owner: "astandrik",
            phase: "embedding" as const,
            processedChunks: 4,
            processedFiles: 2,
            prNumber: 3,
            repo: "local-ydb-toolkit",
            repoId: "456",
            startedAt: new Date("2026-05-25T12:00:01.000Z"),
            status: "running" as const,
            totalChunks: 6,
            totalFiles: 3,
            updatedAt: new Date("2026-05-25T12:00:02.000Z"),
        };
        deps.listActiveJobsForInstallation.mockResolvedValue([
            progress,
            {
                ...progress,
                currentPath: undefined,
                jobId: "manual:queued-job",
                phase: "queued",
                processedChunks: 0,
                processedFiles: 0,
                startedAt: undefined,
                status: "pending",
                totalChunks: undefined,
                totalFiles: undefined,
                updatedAt: new Date("2026-05-25T12:00:01.000Z"),
            },
        ]);
        deps.getJobProgress.mockResolvedValue(progress);

        try {
            const repositories = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/repositories?installationId=777",
            });
            const job = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/jobs/manual:test-job",
            });

            expect(JSON.parse(repositories.body)).toMatchObject({
                repositories: [
                    {
                        activeJob: {
                            currentPath: "src/index.ts",
                            jobId: "manual:test-job",
                            phase: "embedding",
                            processedChunks: 4,
                            processedFiles: 2,
                            prNumber: 3,
                            status: "running",
                            totalChunks: 6,
                            totalFiles: 3,
                            updatedAt: "2026-05-25T12:00:02.000Z",
                        },
                        repoId: "456",
                    },
                ],
                status: "ok",
            });
            expect(JSON.parse(job.body)).toMatchObject({
                job: {
                    jobId: "manual:test-job",
                    phase: "embedding",
                    prNumber: 3,
                    repoId: "456",
                    status: "running",
                },
                status: "ok",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("returns every active job for a repository while preserving a primary active job", async () => {
        const { baseUrl, deps, server } = await startPublicApiServer();
        const runningPrJob = {
            createdAt: new Date("2026-05-25T12:00:00.000Z"),
            installationId: "777",
            jobId: "delivery:running-pr",
            jobKind: "pr-index" as const,
            owner: "astandrik",
            phase: "embedding" as const,
            processedChunks: 8,
            processedFiles: 4,
            prNumber: 3,
            repo: "local-ydb-toolkit",
            repoId: "456",
            startedAt: new Date("2026-05-25T12:00:01.000Z"),
            status: "running" as const,
            totalChunks: 10,
            totalFiles: 5,
            updatedAt: new Date("2026-05-25T12:00:03.000Z"),
        };
        const queuedPrJob = {
            ...runningPrJob,
            jobId: "delivery:queued-pr",
            phase: "queued" as const,
            processedChunks: 0,
            processedFiles: 0,
            prNumber: 4,
            startedAt: undefined,
            status: "pending" as const,
            totalChunks: undefined,
            totalFiles: undefined,
            updatedAt: new Date("2026-05-25T12:00:02.000Z"),
        };
        deps.listActiveJobsForInstallation.mockResolvedValue([
            queuedPrJob,
            runningPrJob,
        ]);

        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/repositories?installationId=777",
            });

            expect(JSON.parse(response.body)).toMatchObject({
                repositories: [
                    {
                        activeJob: {
                            jobId: "delivery:running-pr",
                            prNumber: 3,
                            status: "running",
                        },
                        activeJobs: [
                            {
                                jobId: "delivery:queued-pr",
                                prNumber: 4,
                                status: "pending",
                            },
                            {
                                jobId: "delivery:running-pr",
                                prNumber: 3,
                                status: "running",
                            },
                        ],
                        repoId: "456",
                    },
                ],
                status: "ok",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("rejects direct job progress for repositories outside the user's installations", async () => {
        const { baseUrl, deps, server } = await startPublicApiServer();
        deps.getJobProgress.mockResolvedValue({
            createdAt: new Date("2026-05-25T12:00:00.000Z"),
            installationId: "999",
            jobId: "job-for-other-repo",
            jobKind: "full-index",
            owner: "other",
            phase: "embedding",
            processedChunks: 0,
            processedFiles: 0,
            repo: "private",
            repoId: "999001",
            status: "running",
            updatedAt: new Date("2026-05-25T12:00:02.000Z"),
        });

        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/jobs/job-for-other-repo",
            });

            expect(response.statusCode).toBe(403);
        } finally {
            await closeServer(server);
        }
    });

    it("allows manual reindex when the installation is over the repository quota", async () => {
        const quota = createCodeIndexerQuota({
            limits: {
                chunksPerRepo: 50,
                filesPerRepo: 10,
                reposPerInstallation: 1,
                searchesPerUserPerDay: 5,
            },
            logger: { warn: vi.fn() },
        });
        const { baseUrl, deps, server } = await startPublicApiServer({
            extraRepositories: [
                {
                    defaultBranch: "main",
                    installationId: "777",
                    owner: "astandrik",
                    repo: "another-repo",
                    repoId: "457",
                    status: "ready",
                },
            ],
            quota,
        });
        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                method: "POST",
                path: "/api/repositories/456/reindex",
            });

            expect(response.statusCode).toBe(202);
            expect(JSON.parse(response.body)).toMatchObject({
                status: "ok",
                job: {
                    jobId: "manual:test-job",
                    phase: "queued",
                    status: "pending",
                },
            });
            expect(deps.enqueue).toHaveBeenCalledWith({
                installationId: 777,
                kind: "full-index",
                reason: "manual-reindex",
                ref: "main",
                repository: {
                    defaultBranch: "main",
                    owner: "astandrik",
                    repo: "local-ydb-toolkit",
                    repoId: 456,
                },
            });
        } finally {
            await closeServer(server);
        }
    });

    it("returns repositories even when the installation is over the repository quota", async () => {
        const quota = createCodeIndexerQuota({
            limits: {
                chunksPerRepo: 50,
                filesPerRepo: 10,
                reposPerInstallation: 1,
                searchesPerUserPerDay: 5,
            },
            logger: { warn: vi.fn() },
        });
        const { baseUrl, server } = await startPublicApiServer({
            extraRepositories: [
                {
                    defaultBranch: "main",
                    installationId: "777",
                    owner: "astandrik",
                    repo: "another-repo",
                    repoId: "457",
                    status: "ready",
                },
            ],
            quota,
        });
        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/repositories?installationId=777",
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toMatchObject({
                repositories: [
                    { repoId: "456" },
                    { repoId: "457" },
                ],
                status: "ok",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("creates, lists, and revokes API tokens without returning plaintext after creation", async () => {
        const { baseUrl, server, store } = await startPublicApiServer();
        try {
            const created = await request({
                baseUrl,
                body: { name: "Codex" },
                cookie: sessionCookie(),
                method: "POST",
                path: "/api/tokens",
            });
            const listed = await request({
                baseUrl,
                cookie: sessionCookie(),
                path: "/api/tokens",
            });
            const revoked = await request({
                baseUrl,
                cookie: sessionCookie(),
                method: "DELETE",
                path: "/api/tokens/token-id",
            });

            expect(created.statusCode).toBe(201);
            expect(JSON.parse(created.body)).toEqual({
                status: "ok",
                token: {
                    name: "Codex",
                    plaintextToken: "ydbqci_plaintext",
                    tokenId: "token-id",
                },
            });
            expect(store.createApiToken).toHaveBeenCalledWith({
                githubUserId: "123",
                name: "Codex",
                plaintextToken: "ydbqci_plaintext",
                tokenId: "token-id",
            });
            expect(JSON.parse(listed.body)).toEqual({
                status: "ok",
                tokens: [
                    {
                        githubUserId: "123",
                        name: "Codex",
                        revoked: false,
                        tokenId: "token-id",
                    },
                ],
            });
            expect(listed.body).not.toContain("ydbqci_plaintext");
            expect(revoked.statusCode).toBe(204);
            expect(store.revokeApiToken).toHaveBeenCalledWith({
                githubUserId: "123",
                tokenId: "token-id",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("deletes user data, owned repository rows, sessions, tokens, and indexed collections", async () => {
        const { baseUrl, deps, server, store } = await startPublicApiServer();
        deps.listCollectionsByPrefix.mockResolvedValue([
            "gh_repo_456_default",
            "gh_repo_456_pr_3",
        ]);
        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                method: "POST",
                path: "/api/privacy/delete-my-data",
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({
                deletedInstallations: 1,
                deletedRepositories: 1,
                status: "ok",
            });
            expect(deps.deleteCollection).toHaveBeenCalledWith({
                collection: "gh_repo_456_default",
                userUid: "gh_installation_777",
            });
            expect(deps.deleteCollection).toHaveBeenCalledWith({
                collection: "gh_repo_456_pr_3",
                userUid: "gh_installation_777",
            });
            expect(deps.deleteRepositoryJobs).toHaveBeenCalledWith({
                installationId: 777,
                repoId: 456,
            });
            expect(deps.enqueue).not.toHaveBeenCalled();
            expect(store.deleteInstallationUser).toHaveBeenCalledWith({
                githubUserId: "123",
                installationId: "777",
            });
            expect(store.deleteSessionsForUser).toHaveBeenCalledWith("123");
            expect(store.deleteApiTokensForUser).toHaveBeenCalledWith("123");
            expect(store.deleteRepositoriesForInstallation).toHaveBeenCalledWith(
                "777"
            );
            expect(store.deleteInstallation).toHaveBeenCalledWith("777");
            expect(store.deleteGitHubUser).toHaveBeenCalledWith("123");
        } finally {
            await closeServer(server);
        }
    });

    it("does not delete shared installations or repositories during privacy deletion", async () => {
        const { baseUrl, deps, server, store } = await startPublicApiServer();
        store.countInstallationUsers.mockResolvedValueOnce(1);
        try {
            const response = await request({
                baseUrl,
                cookie: sessionCookie(),
                method: "POST",
                path: "/api/privacy/delete-my-data",
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({
                deletedInstallations: 0,
                deletedRepositories: 0,
                status: "ok",
            });
            expect(store.deleteInstallationUser).toHaveBeenCalledWith({
                githubUserId: "123",
                installationId: "777",
            });
            expect(store.deleteRepositoriesForInstallation).not.toHaveBeenCalled();
            expect(store.deleteInstallation).not.toHaveBeenCalled();
            expect(deps.deleteCollection).not.toHaveBeenCalled();
            expect(deps.deleteRepositoryJobs).not.toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });
});
