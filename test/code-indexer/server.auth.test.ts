import http from "node:http";

import { describe, expect, it, vi } from "vitest";

import {
    CODE_INDEXER_SESSION_COOKIE,
    type CodeIndexerAuthStore,
    GitHubOAuthClient,
} from "../../src/code-indexer/auth.js";
import { buildCodeIndexerServer } from "../../src/code-indexer/server.js";
import type {
    CodeIndexStore,
    DeliveryStore,
    EmbeddingProvider,
    IndexingQueue,
} from "../../src/code-indexer/types.js";

type TestResponse = {
    body: string;
    headers: http.IncomingHttpHeaders;
    statusCode: number;
};

type AuthStoreMocks = {
    createSession: ReturnType<typeof vi.fn>;
    deleteSession: ReturnType<typeof vi.fn>;
    store: CodeIndexerAuthStore;
    upsertGitHubUser: ReturnType<typeof vi.fn>;
    upsertInstallation: ReturnType<typeof vi.fn>;
};

function createBaseDeps() {
    const embeddingProvider: EmbeddingProvider = {
        dimension: 2,
        embedDocuments: vi.fn(),
        embedQuery: vi.fn(),
    };
    const store: CodeIndexStore = {
        deleteCollection: vi.fn(),
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
        enqueue: vi.fn(),
    };
    return { deliveryStore, embeddingProvider, queue, store };
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
        status,
        statusText: status === 200 ? "OK" : "Bad Gateway",
    });
}

function createAuthStoreMocks(): AuthStoreMocks {
    const createSession = vi.fn(() => Promise.resolve());
    const deleteSession = vi.fn(() => Promise.resolve());
    const upsertGitHubUser = vi.fn(() => Promise.resolve());
    const upsertInstallation = vi.fn(() => Promise.resolve());
    return {
        createSession,
        deleteSession,
        store: {
            createSession,
            deleteSession,
            upsertGitHubUser,
            upsertInstallation,
        },
        upsertGitHubUser,
        upsertInstallation,
    };
}

function fetchInputUrl(input: Parameters<typeof fetch>[0]): URL {
    if (typeof input === "string") {
        return new URL(input);
    }
    if (input instanceof URL) {
        return new URL(input.href);
    }
    return new URL(input.url);
}

async function startAuthServer(params?: {
    fetchImpl?: typeof fetch;
    installationId?: string;
}): Promise<{
    baseUrl: string;
    server: http.Server;
    store: AuthStoreMocks;
}> {
    const authStore = createAuthStoreMocks();
    const client = new GitHubOAuthClient({
        apiBaseUrl: "https://api.github.example.test",
        clientId: "client-id",
        clientSecret: "client-secret",
        fetchImpl: params?.fetchImpl,
        githubBaseUrl: "https://github.example.test",
        redirectUri: "https://code-indexer.example.test/github/oauth/callback",
    });
    const app = buildCodeIndexerServer({
        ...createBaseDeps(),
        auth: {
            client,
            createSessionId: () => "session-id",
            now: () => new Date("2026-05-25T00:00:00.000Z"),
            oauthStateTtlSeconds: 600,
            sessionSecret: "session-secret",
            sessionTtlSeconds: 3_600,
            store: authStore.store,
            uiOrigin: "https://ydb-qdrant.tech",
        },
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
        server,
        store: authStore,
    };
}

async function closeServer(server: http.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
}

async function request(params: {
    baseUrl: string;
    headers?: Record<string, string>;
    method?: "GET" | "POST";
    path: string;
}): Promise<TestResponse> {
    const url = new URL(params.path, params.baseUrl);
    return await new Promise((resolve, reject) => {
        const req = http.request(
            url,
            {
                headers: params.headers,
                method: params.method ?? "GET",
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
        req.end();
    });
}

async function createState(baseUrl: string, installationId = "777"): Promise<string> {
    const response = await request({
        baseUrl,
        path:
            `/github/oauth/start?installation_id=${installationId}` +
            "&return_to=/code-indexer/dashboard/",
    });
    const location = response.headers.location;
    if (!location) {
        throw new Error("OAuth start response did not include Location");
    }
    const state = new URL(location).searchParams.get("state");
    if (!state) {
        throw new Error("OAuth start redirect did not include state");
    }
    return state;
}

function firstSetCookie(headers: http.IncomingHttpHeaders): string {
    const value = headers["set-cookie"];
    if (!Array.isArray(value) || !value[0]) {
        throw new Error("response did not include Set-Cookie");
    }
    return value[0];
}

describe("code-indexer auth routes", () => {
    it("redirects OAuth starts to GitHub with a signed state", async () => {
        const { baseUrl, server } = await startAuthServer();
        try {
            const response = await request({
                baseUrl,
                path:
                    "/github/oauth/start?installation_id=777" +
                    "&return_to=/code-indexer/dashboard/",
            });

            expect(response.statusCode).toBe(302);
            const location = response.headers.location;
            expect(location).toBeTruthy();
            const redirectUrl = new URL(location as string);
            expect(redirectUrl.origin).toBe("https://github.example.test");
            expect(redirectUrl.pathname).toBe("/login/oauth/authorize");
            expect(redirectUrl.searchParams.get("client_id")).toBe("client-id");
            expect(redirectUrl.searchParams.get("redirect_uri")).toBe(
                "https://code-indexer.example.test/github/oauth/callback"
            );
            expect(redirectUrl.searchParams.get("state")).toMatch(/^v1\./u);
        } finally {
            await closeServer(server);
        }
    });

    it("rejects callbacks without a code", async () => {
        const { baseUrl, server } = await startAuthServer();
        try {
            const state = await createState(baseUrl);
            const response = await request({
                baseUrl,
                path: `/github/oauth/callback?state=${encodeURIComponent(state)}`,
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({
                error: "missing GitHub OAuth code",
                status: "error",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("creates a user session after a successful callback", async () => {
        const fetchImpl: typeof fetch = (input) => {
            const url = fetchInputUrl(input);
            if (url.origin === "https://github.example.test") {
                return Promise.resolve(jsonResponse({
                    access_token: "ghu-user",
                    expires_in: 28_800,
                    refresh_token: "ghr-refresh",
                    refresh_token_expires_in: 15_897_600,
                    token_type: "bearer",
                }));
            }
            if (url.pathname === "/user") {
                return Promise.resolve(jsonResponse({ id: 123, login: "octocat" }));
            }
            if (url.pathname === "/user/installations") {
                return Promise.resolve(jsonResponse({
                    installations: [
                        {
                            account: { login: "astandrik", type: "User" },
                            id: 777,
                        },
                    ],
                    total_count: 1,
                }));
            }
            throw new Error(`unexpected GitHub URL ${url.toString()}`);
        };
        const { baseUrl, server, store } = await startAuthServer({ fetchImpl });
        try {
            const state = await createState(baseUrl);
            const response = await request({
                baseUrl,
                path:
                    "/github/oauth/callback?code=oauth-code&state=" +
                    encodeURIComponent(state),
            });

            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toBe(
                "https://ydb-qdrant.tech/code-indexer/dashboard/"
            );
            expect(firstSetCookie(response.headers)).toContain(
                `${CODE_INDEXER_SESSION_COOKIE}=session-id`
            );
            expect(firstSetCookie(response.headers)).toContain("HttpOnly");
            expect(firstSetCookie(response.headers)).toContain("Secure");
            expect(firstSetCookie(response.headers)).toContain("SameSite=Lax");
            expect(firstSetCookie(response.headers)).toContain("Path=/");
            expect(firstSetCookie(response.headers)).not.toContain("Domain=");
            expect(store.upsertGitHubUser).toHaveBeenCalledWith({
                accessToken: "ghu-user",
                githubUserId: "123",
                login: "octocat",
                refreshToken: "ghr-refresh",
            });
            expect(store.upsertInstallation).toHaveBeenCalledWith({
                accountLogin: "astandrik",
                accountType: "User",
                createdByGithubUserId: "123",
                installationId: "777",
                status: "active",
            });
            expect(store.createSession).toHaveBeenCalledWith({
                expiresAt: new Date("2026-05-25T01:00:00.000Z"),
                githubUserId: "123",
                sessionId: "session-id",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("creates a user session for GitHub install OAuth callbacks without state", async () => {
        const fetchImpl: typeof fetch = (input) => {
            const url = fetchInputUrl(input);
            if (url.origin === "https://github.example.test") {
                return Promise.resolve(jsonResponse({
                    access_token: "ghu-user",
                    expires_in: 28_800,
                    refresh_token: "ghr-refresh",
                    refresh_token_expires_in: 15_897_600,
                    token_type: "bearer",
                }));
            }
            if (url.pathname === "/user") {
                return Promise.resolve(jsonResponse({ id: 123, login: "octocat" }));
            }
            if (url.pathname === "/user/installations") {
                return Promise.resolve(jsonResponse({
                    installations: [
                        {
                            account: { login: "astandrik", type: "User" },
                            id: 777,
                        },
                        {
                            account: { login: "ydb-platform", type: "Organization" },
                            id: 778,
                        },
                    ],
                    total_count: 2,
                }));
            }
            throw new Error(`unexpected GitHub URL ${url.toString()}`);
        };
        const { baseUrl, server, store } = await startAuthServer({ fetchImpl });
        try {
            const response = await request({
                baseUrl,
                path: "/github/oauth/callback?code=oauth-code",
            });

            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toBe(
                "https://ydb-qdrant.tech/code-indexer/dashboard/"
            );
            expect(firstSetCookie(response.headers)).toContain(
                `${CODE_INDEXER_SESSION_COOKIE}=session-id`
            );
            expect(store.upsertGitHubUser).toHaveBeenCalledWith({
                accessToken: "ghu-user",
                githubUserId: "123",
                login: "octocat",
                refreshToken: "ghr-refresh",
            });
            expect(store.upsertInstallation).toHaveBeenCalledTimes(2);
            expect(store.upsertInstallation).toHaveBeenNthCalledWith(1, {
                accountLogin: "astandrik",
                accountType: "User",
                createdByGithubUserId: "123",
                installationId: "777",
                status: "active",
            });
            expect(store.upsertInstallation).toHaveBeenNthCalledWith(2, {
                accountLogin: "ydb-platform",
                accountType: "Organization",
                createdByGithubUserId: "123",
                installationId: "778",
                status: "active",
            });
            expect(store.createSession).toHaveBeenCalledWith({
                expiresAt: new Date("2026-05-25T01:00:00.000Z"),
                githubUserId: "123",
                sessionId: "session-id",
            });
        } finally {
            await closeServer(server);
        }
    });

    it("rejects spoofed installation ids before creating a session", async () => {
        const fetchImpl: typeof fetch = (input) => {
            const url = fetchInputUrl(input);
            if (url.origin === "https://github.example.test") {
                return Promise.resolve(jsonResponse({
                    access_token: "ghu-user",
                    token_type: "bearer",
                }));
            }
            if (url.pathname === "/user") {
                return Promise.resolve(jsonResponse({ id: 123, login: "octocat" }));
            }
            if (url.pathname === "/user/installations") {
                return Promise.resolve(jsonResponse({
                    installations: [
                        {
                            account: { login: "astandrik", type: "User" },
                            id: 777,
                        },
                    ],
                    total_count: 1,
                }));
            }
            throw new Error(`unexpected GitHub URL ${url.toString()}`);
        };
        const { baseUrl, server, store } = await startAuthServer({ fetchImpl });
        try {
            const state = await createState(baseUrl, "888");
            const response = await request({
                baseUrl,
                path:
                    "/github/oauth/callback?code=oauth-code&state=" +
                    encodeURIComponent(state),
            });

            expect(response.statusCode).toBe(403);
            expect(JSON.parse(response.body)).toMatchObject({
                error:
                    "installation is not accessible to the authorized GitHub user",
                status: "error",
            });
            expect(store.createSession).not.toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });

    it("deletes sessions and clears cookies on logout", async () => {
        const { baseUrl, server, store } = await startAuthServer();
        try {
            const response = await request({
                baseUrl,
                headers: {
                    Cookie: `${CODE_INDEXER_SESSION_COOKIE}=session-id`,
                },
                method: "POST",
                path: "/api/logout",
            });

            expect(response.statusCode).toBe(204);
            expect(store.deleteSession).toHaveBeenCalledWith("session-id");
            expect(firstSetCookie(response.headers)).toContain("Max-Age=0");
        } finally {
            await closeServer(server);
        }
    });
});
