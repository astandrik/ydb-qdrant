import http from "node:http";

import { describe, expect, it, vi } from "vitest";

import { buildCodeIndexerServer } from "../../src/code-indexer/server.js";
import type {
    CodeIndexStore,
    DeliveryStore,
    EmbeddingProvider,
    IndexingQueue,
} from "../../src/code-indexer/types.js";

type TestRepository = {
    chunkCount?: number;
    defaultBranch: string;
    installationId: string;
    lastIndexedAt?: Date;
    lastIndexedSha?: string;
    owner: string;
    repo: string;
    repoId: string;
    status: "queued" | "indexing" | "ready" | "failed" | "deleted";
};

type TestResponse = {
    body: string;
    headers: http.IncomingHttpHeaders;
    statusCode: number;
};

function createMcpStore() {
    const repository: TestRepository = {
        defaultBranch: "main",
        installationId: "777",
        lastIndexedAt: new Date("2026-05-25T13:58:00.000Z"),
        lastIndexedSha: "abc123",
        owner: "astandrik",
        repo: "local-ydb-toolkit",
        repoId: "456",
        chunkCount: 909,
        status: "ready",
    };
    return {
        findApiTokenByPlaintextToken: vi.fn((token: string) =>
            Promise.resolve(
                token === "valid-token"
                    ? {
                          githubUserId: "123",
                          name: "Codex",
                          revoked: false,
                          tokenId: "tok_1",
                      }
                    : null
            )
        ),
        getRepository: vi.fn((repoId: number | string) =>
            Promise.resolve(repoId === "456" || repoId === 456 ? repository : null)
        ),
        listInstallationsForUser: vi.fn((githubUserId: number | string) =>
            Promise.resolve(
                String(githubUserId) === "123"
                    ? [
                          {
                              accountLogin: "astandrik",
                              accountType: "User",
                              createdByGithubUserId: "123",
                              installationId: "777",
                              status: "active",
                          },
                      ]
                    : []
            )
        ),
        listRepositoriesForInstallation: vi.fn((installationId: number | string) =>
            Promise.resolve(String(installationId) === "777" ? [repository] : [])
        ),
    };
}

function createBaseDeps() {
    const search = vi.fn(() =>
        Promise.resolve([
            {
                id: "point-1",
                payload: {
                    endLine: 4,
                    path: "src/server.ts",
                    startLine: 2,
                    text: "function buildServer() {}",
                },
                score: 0.9,
            },
        ])
    );
    const embeddingProvider: EmbeddingProvider = {
        dimension: 2,
        embedDocuments: vi.fn(),
        embedQuery: vi.fn(() => Promise.resolve([0.1, 0.2])),
    };
    const indexStore: CodeIndexStore = {
        countCollection: vi.fn(),
        countExistingPointIds: vi.fn(),
        deleteCollection: vi.fn(),
        deletePath: vi.fn(),
        ensureCollection: vi.fn(),
        resetCollection: vi.fn(),
        search,
        upsertChunks: vi.fn(),
    };
    const deliveryStore: DeliveryStore = {
        has: vi.fn(),
        mark: vi.fn(),
    };
    const queue: IndexingQueue = {
        enqueue: vi.fn(() =>
            Promise.resolve({
                jobId: "job-1",
                phase: "queued",
                status: "pending",
            })
        ),
    };
    const progressStore = {
        listJobsForRepository: vi.fn(() =>
            Promise.resolve([
                {
                    createdAt: new Date("2026-05-25T14:00:00.000Z"),
                    installationId: "777",
                    jobId: "delivery-pr:job",
                    jobKind: "pr-index",
                    owner: "astandrik",
                    phase: "completed",
                    prNumber: 71,
                    processedChunks: 12,
                    processedFiles: 3,
                    repo: "local-ydb-toolkit",
                    repoId: "456",
                    status: "completed",
                    updatedAt: new Date("2026-05-25T14:01:00.000Z"),
                },
            ])
        ),
    };
    return {
        deliveryStore,
        embeddingProvider,
        indexStore,
        progressStore,
        queue,
        search,
    };
}

async function startMcpServer(): Promise<{
    baseUrl: string;
    deps: ReturnType<typeof createBaseDeps>;
    server: http.Server;
    store: ReturnType<typeof createMcpStore>;
}> {
    const deps = createBaseDeps();
    const store = createMcpStore();
    const app = buildCodeIndexerServer({
        deliveryStore: deps.deliveryStore,
        embeddingProvider: deps.embeddingProvider,
        mcp: {
            accessStore: store,
            allowedOrigins: ["https://ydb-qdrant.tech"],
            embeddingProvider: deps.embeddingProvider,
            progressStore: deps.progressStore,
            store: deps.indexStore,
        } as never,
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
    method?: "GET" | "OPTIONS" | "POST";
    origin?: string;
    requestHeaders?: string;
    token?: string;
}): Promise<TestResponse> {
    const body =
        params.body === undefined ? undefined : JSON.stringify(params.body);
    return await new Promise((resolve, reject) => {
        const req = http.request(
            new URL("/mcp", params.baseUrl),
            {
                headers: {
                    ...(params.requestHeaders
                        ? {
                              "Access-Control-Request-Headers":
                                  params.requestHeaders,
                          }
                        : {}),
                    ...(params.origin ? { Origin: params.origin } : {}),
                    ...(params.token
                        ? { Authorization: `Bearer ${params.token}` }
                        : {}),
                    ...(body
                        ? {
                              "Content-Length": String(Buffer.byteLength(body)),
                              "Content-Type": "application/json",
                          }
                        : {}),
                },
                method: params.method ?? "POST",
            },
            (res) => {
                const chunks: string[] = [];
                res.setEncoding("utf8");
                res.on("data", (chunk: string) => chunks.push(chunk));
                res.on("end", () => {
                    resolve({
                        body: chunks.join(""),
                        headers: res.headers,
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

describe("code-indexer hosted MCP HTTP endpoint", () => {
    it("rejects missing, invalid, and revoked bearer tokens", async () => {
        const { baseUrl, server, store } = await startMcpServer();
        try {
            const missing = await request({ baseUrl });
            const invalid = await request({ baseUrl, token: "bad-token" });
            const revoked = await request({ baseUrl, token: "revoked-token" });

            expect(missing.statusCode).toBe(401);
            expect(invalid.statusCode).toBe(401);
            expect(revoked.statusCode).toBe(401);
            expect(store.findApiTokenByPlaintextToken).toHaveBeenCalledWith(
                "bad-token"
            );
            expect(store.findApiTokenByPlaintextToken).toHaveBeenCalledWith(
                "revoked-token"
            );
        } finally {
            await closeServer(server);
        }
    });

    it("rejects disallowed browser origins before running MCP methods", async () => {
        const { baseUrl, deps, server } = await startMcpServer();
        try {
            const response = await request({
                baseUrl,
                body: { id: 1, jsonrpc: "2.0", method: "initialize" },
                origin: "https://evil.example",
                token: "valid-token",
            });

            expect(response.statusCode).toBe(403);
            expect(deps.search).not.toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });

    it("emits CORS headers for allowed browser origins and preflight", async () => {
        const { baseUrl, server } = await startMcpServer();
        try {
            const preflight = await request({
                baseUrl,
                method: "OPTIONS",
                origin: "https://ydb-qdrant.tech",
                requestHeaders: "authorization, content-type",
            });
            const initialized = await request({
                baseUrl,
                body: { id: 1, jsonrpc: "2.0", method: "initialize" },
                origin: "https://ydb-qdrant.tech",
                token: "valid-token",
            });

            expect(preflight.statusCode).toBe(204);
            expect(preflight.headers["access-control-allow-origin"]).toBe(
                "https://ydb-qdrant.tech"
            );
            expect(preflight.headers["access-control-allow-methods"]).toContain(
                "POST"
            );
            expect(preflight.headers["access-control-allow-headers"]).toContain(
                "Authorization"
            );
            expect(initialized.statusCode).toBe(200);
            expect(initialized.headers["access-control-allow-origin"]).toBe(
                "https://ydb-qdrant.tech"
            );
            expect(initialized.headers.vary).toContain("Origin");
        } finally {
            await closeServer(server);
        }
    });

    it("serves an authenticated SSE-compatible GET probe", async () => {
        const { baseUrl, server } = await startMcpServer();
        try {
            const response = await request({
                baseUrl,
                method: "GET",
                token: "valid-token",
            });

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toContain(
                "text/event-stream"
            );
            expect(response.body).toContain("ydb-qdrant-code-indexer");
        } finally {
            await closeServer(server);
        }
    });

    it("handles initialize and tools/list over POST as JSON-RPC", async () => {
        const { baseUrl, server } = await startMcpServer();
        try {
            const initialized = await request({
                baseUrl,
                body: { id: 1, jsonrpc: "2.0", method: "initialize" },
                token: "valid-token",
            });
            const tools = await request({
                baseUrl,
                body: { id: 2, jsonrpc: "2.0", method: "tools/list" },
                token: "valid-token",
            });

            expect(initialized.statusCode).toBe(200);
            expect(initialized.headers["content-type"]).toContain(
                "application/json"
            );
            expect(JSON.parse(initialized.body)).toMatchObject({
                id: 1,
                result: {
                    serverInfo: { name: "ydb-qdrant-code-indexer" },
                },
            });
            const toolsBody = JSON.parse(tools.body) as {
                id: number;
                result: { tools: Array<{ name: string }> };
            };
            expect(toolsBody).toMatchObject({
                id: 2,
            });
            expect(toolsBody.result.tools.map((tool) => tool.name)).toEqual([
                "list_repositories",
                "list_repository_indexes",
                "search_code",
            ]);
        } finally {
            await closeServer(server);
        }
    });

    it("lists accessible repositories over hosted MCP", async () => {
        const { baseUrl, server, store } = await startMcpServer();
        try {
            const response = await request({
                baseUrl,
                body: {
                    id: "repos",
                    jsonrpc: "2.0",
                    method: "tools/call",
                    params: {
                        arguments: {},
                        name: "list_repositories",
                    },
                },
                token: "valid-token",
            });

            expect(response.statusCode).toBe(200);
            expect(store.listInstallationsForUser).toHaveBeenCalledWith("123");
            expect(store.listRepositoriesForInstallation).toHaveBeenCalledWith(
                "777"
            );
            expect(JSON.parse(response.body)).toMatchObject({
                id: "repos",
                result: {
                    structuredContent: {
                        repositories: [
                            {
                                chunkCount: 909,
                                defaultBranch: "main",
                                installationId: 777,
                                owner: "astandrik",
                                repo: "local-ydb-toolkit",
                                repoId: 456,
                                status: "ready",
                            },
                        ],
                    },
                },
            });
        } finally {
            await closeServer(server);
        }
    });

    it("lists branch and pull request indexes over hosted MCP", async () => {
        const { baseUrl, deps, server } = await startMcpServer();
        try {
            const response = await request({
                baseUrl,
                body: {
                    id: "indexes",
                    jsonrpc: "2.0",
                    method: "tools/call",
                    params: {
                        arguments: {
                            owner: "astandrik",
                            repo: "local-ydb-toolkit",
                        },
                        name: "list_repository_indexes",
                    },
                },
                token: "valid-token",
            });

            expect(response.statusCode).toBe(200);
            expect(deps.progressStore.listJobsForRepository).toHaveBeenCalledWith({
                installationId: "777",
                limit: 25,
                repoId: "456",
            });
            expect(JSON.parse(response.body)).toMatchObject({
                id: "indexes",
                result: {
                    structuredContent: {
                        repository: {
                            defaultBranch: {
                                branch: "main",
                                collection: "gh_repo_456_default",
                                status: "ready",
                            },
                            pullRequests: [
                                {
                                    collection: "gh_repo_456_pr_71",
                                    prNumber: 71,
                                    status: "ready",
                                },
                            ],
                        },
                    },
                },
            });
        } finally {
            await closeServer(server);
        }
    });

    it("rejects owner/repo searches for repositories outside the token owner access", async () => {
        const { baseUrl, deps, server } = await startMcpServer();
        try {
            const response = await request({
                baseUrl,
                body: {
                    id: "missing",
                    jsonrpc: "2.0",
                    method: "tools/call",
                    params: {
                        arguments: {
                            owner: "astandrik",
                            query: "build server",
                            repo: "missing",
                        },
                        name: "search_code",
                    },
                },
                token: "valid-token",
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toMatchObject({
                error: {
                    code: -32602,
                    message: "repository is not accessible to the authenticated token",
                },
                id: "missing",
            });
            expect(deps.search).not.toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });

    it("searches by owner/repo for an authorized token", async () => {
        const { baseUrl, deps, server } = await startMcpServer();
        try {
            const response = await request({
                baseUrl,
                body: {
                    id: "search",
                    jsonrpc: "2.0",
                    method: "tools/call",
                    params: {
                        arguments: {
                            owner: "astandrik",
                            query: "build server",
                            repo: "local-ydb-toolkit",
                            top: 5,
                        },
                        name: "search_code",
                    },
                },
                origin: "https://ydb-qdrant.tech",
                token: "valid-token",
            });

            expect(response.statusCode).toBe(200);
            expect(deps.search).toHaveBeenCalledWith({
                collection: "gh_repo_456_default",
                queryVector: [0.1, 0.2],
                top: 5,
                userUid: "gh_installation_777",
            });
            expect(JSON.parse(response.body)).toMatchObject({
                id: "search",
                result: {
                    structuredContent: {
                        collection: "gh_repo_456_default",
                    },
                },
            });
        } finally {
            await closeServer(server);
        }
    });
});
