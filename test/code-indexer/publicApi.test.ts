import http from "node:http";

import { describe, expect, it, vi } from "vitest";

import { CODE_INDEXER_SESSION_COOKIE } from "../../src/code-indexer/auth.js";
import { buildCodeIndexerServer } from "../../src/code-indexer/server.js";
import type {
    CodeIndexStore,
    DeliveryStore,
    EmbeddingProvider,
    IndexingQueue,
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
    defaultBranch: string;
    installationId: string;
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

function createBaseDeps() {
    const deleteCollection = vi.fn(() => Promise.resolve());
    const enqueue = vi.fn(() => Promise.resolve());
    const embeddingProvider: EmbeddingProvider = {
        dimension: 2,
        embedDocuments: vi.fn(),
        embedQuery: vi.fn(),
    };
    const indexStore: CodeIndexStore = {
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
    const queue: IndexingQueue = {
        enqueue,
    };
    return {
        deleteCollection,
        deliveryStore,
        embeddingProvider,
        enqueue,
        indexStore,
        queue,
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
            defaultBranch: "main",
            installationId: "777",
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

async function startPublicApiServer(): Promise<{
    baseUrl: string;
    deps: ReturnType<typeof createBaseDeps>;
    server: http.Server;
    store: ReturnType<typeof createPublicApiStore>["store"];
}> {
    const deps = createBaseDeps();
    const { store } = createPublicApiStore();
    const app = buildCodeIndexerServer({
        deliveryStore: deps.deliveryStore,
        embeddingProvider: deps.embeddingProvider,
        publicApi: {
            createPlaintextToken: () => "ydbqci_plaintext",
            createTokenId: () => "token-id",
            indexStore: deps.indexStore,
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
            expect(JSON.parse(response.body)).toMatchObject({ status: "ok" });
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
            expect(deps.enqueue).toHaveBeenCalledWith({
                installationId: 777,
                kind: "delete-repo-index",
                reason: "privacy-delete",
                repository: {
                    defaultBranch: "main",
                    owner: "astandrik",
                    repo: "local-ydb-toolkit",
                    repoId: 456,
                },
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
});
