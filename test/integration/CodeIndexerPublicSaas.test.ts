import { createHmac } from "node:crypto";
import http from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { GitHubOAuthClient } from "../../src/code-indexer/auth.js";
import { OpenAiEmbeddingProvider } from "../../src/code-indexer/embeddings.js";
import { YdbQdrantIndexStore } from "../../src/code-indexer/indexStore.js";
import {
    defaultBranchCollectionForRepo,
    userUidForInstallation,
} from "../../src/code-indexer/naming.js";
import { RepoIndexer } from "../../src/code-indexer/repoIndexer.js";
import {
    CODE_INDEXER_REPOSITORIES_TABLE as SAAS_REPOSITORIES_TABLE,
    YdbCodeIndexerSaasStore,
} from "../../src/code-indexer/saasStore.js";
import { buildCodeIndexerServer } from "../../src/code-indexer/server.js";
import { YdbRepoManifestStore } from "../../src/code-indexer/stateStore.js";
import type {
    DeliveryStore,
    GitHubChangedFile,
    GitHubContentClient,
    GitHubFileEntry,
    GitHubRepositoryRef,
    IndexingJob,
    IndexingProgressStore,
    IndexingQueue,
} from "../../src/code-indexer/types.js";
import { withSession } from "../../src/ydb/client.js";
import { createMetaTableIfMissing } from "./helpers/bootstrap-meta-table.js";

const hasSdkCredentials = [
    "YDB_ACCESS_TOKEN_CREDENTIALS",
    "YDB_ANONYMOUS_CREDENTIALS",
    "YDB_METADATA_CREDENTIALS",
    "YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS",
].some((name) => process.env[name]);
if (!hasSdkCredentials && !process.env.YDB_STATIC_CREDENTIALS_USER) {
    process.env.YDB_ANONYMOUS_CREDENTIALS = "1";
}

const ydbQdrantEndpoint =
    process.env.YDB_QDRANT_ENDPOINT ?? "grpc://127.0.0.1:2136";
if (
    !process.env.YDB_ENDPOINT &&
    /^grpc:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|$)/.test(ydbQdrantEndpoint)
) {
    process.env.YDB_ENDPOINT = ydbQdrantEndpoint;
}

type TestResponse = {
    body: string;
    headers: http.IncomingHttpHeaders;
    statusCode: number;
};

class MemoryDeliveryStore implements DeliveryStore {
    private readonly seen = new Set<string>();

    has(deliveryId: string): Promise<boolean> {
        return Promise.resolve(this.seen.has(deliveryId));
    }

    mark(deliveryId: string): Promise<void> {
        this.seen.add(deliveryId);
        return Promise.resolve();
    }
}

class MemoryQueue implements IndexingQueue {
    readonly jobs: IndexingJob[] = [];

    enqueue(job: IndexingJob): Promise<{
        jobId: string;
        phase: "queued";
        status: "pending";
    }> {
        this.jobs.push(job);
        return Promise.resolve({
            jobId: `memory:${this.jobs.length}`,
            phase: "queued",
            status: "pending",
        });
    }
}

class MemoryProgressStore implements IndexingProgressStore {
    createJobProgress = () => Promise.reject(new Error("not used"));
    getJobProgress = () => Promise.resolve(null);
    listActiveJobsForInstallation = () => Promise.resolve([]);
    updateJobProgress = () => Promise.resolve();
}

class FixtureGitHubClient implements GitHubContentClient {
    readonly files: GitHubFileEntry[] = [
        { path: "src/bootstrapTenant.ts", sha: "blob-bootstrap", size: 260 },
        { path: "dist/generated.js", sha: "blob-dist", size: 80 },
    ];
    readonly contents = new Map<string, string>([
        [
            "src/bootstrapTenant.ts",
            [
                "export function bootstrapTenantFlow() {",
                '    const phrase = "tenant bootstrap flow";',
                "    return phrase;",
                "}",
            ].join("\n"),
        ],
    ]);

    compareCommits(): Promise<GitHubChangedFile[]> {
        return Promise.resolve([]);
    }

    getFileContent(params: { path: string }): Promise<string | null> {
        return Promise.resolve(this.contents.get(params.path) ?? null);
    }

    listRepositoryFiles(): Promise<GitHubFileEntry[]> {
        return Promise.resolve(this.files);
    }
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
        status,
        statusText: status === 200 ? "OK" : "Error",
    });
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

function readRequestBody(init: RequestInit | undefined): unknown {
    const body = init?.body;
    if (typeof body === "string") {
        return JSON.parse(body) as unknown;
    }
    return {};
}

function vectorForText(text: string): number[] {
    return text.toLowerCase().includes("tenant bootstrap flow")
        ? [1, 0, 0, 0]
        : [0, 1, 0, 0];
}

const mockedFetch: typeof fetch = (input, init) => {
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
    if (url.origin === "https://api.github.example.test") {
        if (url.pathname === "/user") {
            return Promise.resolve(jsonResponse({ id: 12_345, login: "octo" }));
        }
        if (url.pathname === "/user/installations") {
            return Promise.resolve(jsonResponse({
                installations: [
                    {
                        account: { login: "octo", type: "User" },
                        id: 70_001,
                    },
                ],
                total_count: 1,
            }));
        }
    }
    if (url.origin === "https://openai.example.test") {
        const body = readRequestBody(init);
        const inputs =
            body &&
            typeof body === "object" &&
            Array.isArray((body as { input?: unknown }).input)
                ? ((body as { input: string[] }).input)
                : [];
        return Promise.resolve(jsonResponse({
            data: inputs.map((text) => ({ embedding: vectorForText(text) })),
        }));
    }
    return Promise.resolve(jsonResponse({ error: "unexpected test request" }, 500));
};

function repositoryPayload(repository: GitHubRepositoryRef) {
    return {
        default_branch: repository.defaultBranch,
        full_name: `${repository.owner}/${repository.repo}`,
        id: repository.repoId,
        name: repository.repo,
        owner: { login: repository.owner },
    };
}

function signedWebhookHeaders(params: {
    body: Buffer;
    deliveryId: string;
    event: string;
    secret: string;
}): Record<string, string> {
    return {
        "Content-Type": "application/json",
        "X-GitHub-Delivery": params.deliveryId,
        "X-GitHub-Event": params.event,
        "X-Hub-Signature-256": `sha256=${createHmac("sha256", params.secret)
            .update(params.body)
            .digest("hex")}`,
    };
}

async function request(params: {
    baseUrl: string;
    body?: Buffer | string;
    headers?: Record<string, string>;
    method?: "DELETE" | "GET" | "POST";
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
        if (params.body) {
            req.write(params.body);
        }
        req.end();
    });
}

function parseJson<T>(response: TestResponse): T {
    return JSON.parse(response.body) as T;
}

function firstSetCookie(headers: http.IncomingHttpHeaders): string {
    const value = headers["set-cookie"];
    if (!Array.isArray(value) || !value[0]) {
        throw new Error("response did not include Set-Cookie");
    }
    return value[0];
}

async function closeServer(server: http.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
}

async function recreateLegacySaasRepositoryTableIfNeeded(): Promise<void> {
    let shouldRecreate = false;
    await withSession(async (session) => {
        try {
            const desc = await session.describeTable(SAAS_REPOSITORIES_TABLE);
            const columns = (desc.columns ?? []).map((column) => column.name);
            shouldRecreate =
                !columns.includes("last_indexed_at") ||
                !columns.includes("chunk_count") ||
                !columns.includes("last_error");
        } catch {
            shouldRecreate = false;
        }
    });
    if (!shouldRecreate) {
        return;
    }
    await withSession(async (session) => {
        await session.dropTable(SAAS_REPOSITORIES_TABLE);
    });
}

describe("code-indexer public SaaS integration", () => {
    const githubUserId = "12345";
    const installationId = 70_001;
    const repoId = Number(`${Date.now()}`.slice(-9));
    const repository: GitHubRepositoryRef = {
        defaultBranch: "main",
        owner: "octo",
        repo: `public-saas-${repoId}`,
        repoId,
    };
    const collection = defaultBranchCollectionForRepo(repoId);
    const userUid = userUidForInstallation(installationId);
    const webhookSecret = "integration-webhook-secret";
    const saasStore = new YdbCodeIndexerSaasStore({
        encryptionSecret: `integration-encryption-${repoId}`,
        tokenPepper: `integration-pepper-${repoId}`,
    });
    const deliveryStore = new MemoryDeliveryStore();
    const embeddingProvider = new OpenAiEmbeddingProvider({
        apiKey: "test-openai-key",
        dimension: 4,
        fetchImpl: mockedFetch,
        model: "text-embedding-3-small",
        url: "https://openai.example.test/v1/embeddings",
    });
    const indexStore = new YdbQdrantIndexStore({ includeTextInPayload: true });
    const manifestStore = new YdbRepoManifestStore();
    const queue = new MemoryQueue();
    let server: http.Server | null = null;
    let baseUrl = "";

    beforeAll(async () => {
        await createMetaTableIfMissing();
        await recreateLegacySaasRepositoryTableIfNeeded();
        const client = new GitHubOAuthClient({
            apiBaseUrl: "https://api.github.example.test",
            clientId: "client-id",
            clientSecret: "client-secret",
            fetchImpl: mockedFetch,
            githubBaseUrl: "https://github.example.test",
            redirectUri:
                "https://code-indexer.example.test/github/oauth/callback",
        });
        const app = buildCodeIndexerServer({
            auth: {
                client,
                createSessionId: () => `session-${repoId}`,
                now: () => new Date("2030-01-01T00:00:00Z"),
                oauthStateTtlSeconds: 600,
                sessionSecret: "integration-session-secret",
                sessionTtlSeconds: 3_600,
                store: saasStore,
                uiOrigin: "https://ydb-qdrant.tech",
            },
            deliveryStore,
            embeddingProvider,
            lifecycleStore: saasStore,
            mcp: {
                accessStore: saasStore,
                allowedOrigins: ["https://ydb-qdrant.tech"],
                embeddingProvider,
                store: indexStore,
            },
            publicApi: {
                indexStore,
                progressStore: new MemoryProgressStore(),
                queue,
                store: saasStore,
            },
            queue,
            store: indexStore,
            webhookSecret,
        });
        server = http.createServer(app);
        await new Promise<void>((resolve) => {
            server?.listen(0, "127.0.0.1", () => resolve());
        });
        const address = server.address();
        if (!address || typeof address === "string") {
            throw new Error("unexpected server address");
        }
        baseUrl = `http://127.0.0.1:${address.port}`;
    }, 60_000);

    afterAll(async () => {
        await Promise.allSettled([
            indexStore.deleteCollection({ collection, userUid }),
            manifestStore.delete({ collection, userUid }),
            saasStore.deleteRepositoriesForInstallation(installationId),
            saasStore.deleteInstallation(installationId),
            saasStore.deleteApiTokensForUser(githubUserId),
            saasStore.deleteSessionsForUser(githubUserId),
            saasStore.deleteGitHubUser(githubUserId),
        ]);
        if (server) {
            await closeServer(server);
        }
    }, 60_000);

    it("covers OAuth, webhook indexing, MCP search, revocation, and uninstall deletion", async () => {
        const startResponse = await request({
            baseUrl,
            path:
                `/github/oauth/start?installation_id=${installationId}` +
                "&return_to=/code-indexer/dashboard/",
        });
        expect(startResponse.statusCode).toBe(302);
        const state = new URL(startResponse.headers.location ?? "").searchParams.get(
            "state"
        );
        expect(state).toMatch(/^v1\./u);

        const callbackResponse = await request({
            baseUrl,
            path: `/github/oauth/callback?code=oauth-code&state=${encodeURIComponent(
                state ?? ""
            )}`,
        });
        expect(callbackResponse.statusCode).toBe(302);
        const sessionCookie = firstSetCookie(callbackResponse.headers);
        await expect(saasStore.getGitHubUser(githubUserId)).resolves.toMatchObject({
            githubUserId,
            login: "octo",
        });
        await expect(saasStore.getSession(`session-${repoId}`)).resolves.toEqual({
            githubUserId,
            sessionId: `session-${repoId}`,
        });

        const installationBody = Buffer.from(
            JSON.stringify({
                action: "created",
                installation: {
                    account: { login: "octo", type: "User" },
                    id: installationId,
                },
                repositories: [repositoryPayload(repository)],
            })
        );
        const webhookResponse = await request({
            baseUrl,
            body: installationBody,
            headers: signedWebhookHeaders({
                body: installationBody,
                deliveryId: `delivery-install-${repoId}`,
                event: "installation",
                secret: webhookSecret,
            }),
            method: "POST",
            path: "/github/webhook",
        });
        expect(webhookResponse.statusCode, webhookResponse.body).toBe(200);
        expect(parseJson<{ enqueued: number; status: string }>(webhookResponse)).toEqual({
            enqueued: 1,
            status: "accepted",
        });
        await expect(
            saasStore.listInstallationsForUser(githubUserId)
        ).resolves.toMatchObject([
            {
                accountLogin: "octo",
                installationId: String(installationId),
                status: "active",
            },
        ]);
        await expect(
            saasStore.listRepositoriesForInstallation(installationId)
        ).resolves.toMatchObject([
            {
                owner: repository.owner,
                repo: repository.repo,
                repoId: String(repoId),
                status: "queued",
            },
        ]);

        const indexer = new RepoIndexer({
            clientFactory: {
                forInstallation: () => Promise.resolve(new FixtureGitHubClient()),
            },
            embeddingProvider,
            manifestStore,
            options: { chunkLines: 10, overlapLines: 0 },
            statusStore: saasStore,
            store: indexStore,
        });
        expect(queue.jobs).toHaveLength(1);
        await indexer.processJob(queue.jobs[0]);
        const indexedRepository = await saasStore.getRepository(repoId);
        expect(indexedRepository).toMatchObject({
            repoId: String(repoId),
            status: "ready",
        });
        expect(typeof indexedRepository?.chunkCount).toBe("number");

        const tokenResponse = await request({
            baseUrl,
            body: JSON.stringify({ name: "Integration MCP" }),
            headers: {
                "Content-Type": "application/json",
                Cookie: sessionCookie,
            },
            method: "POST",
            path: "/api/tokens",
        });
        expect(tokenResponse.statusCode).toBe(201);
        const tokenBody = parseJson<{
            token: { plaintextToken: string; tokenId: string };
        }>(tokenResponse);

        const mcpSearchResponse = await request({
            baseUrl,
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        owner: repository.owner,
                        query: "tenant bootstrap flow",
                        repo: repository.repo,
                        top: 3,
                    },
                    name: "search_code",
                },
            }),
            headers: {
                Authorization: `Bearer ${tokenBody.token.plaintextToken}`,
                "Content-Type": "application/json",
                Origin: "https://ydb-qdrant.tech",
            },
            method: "POST",
            path: "/mcp",
        });
        expect(mcpSearchResponse.statusCode).toBe(200);
        const mcpSearchBody = parseJson<{
            result: { structuredContent: { points: Array<{ payload?: { path?: string } }> } };
        }>(mcpSearchResponse);
        expect(
            mcpSearchBody.result.structuredContent.points.map(
                (point) => point.payload?.path
            )
        ).toContain("src/bootstrapTenant.ts");

        const revokeResponse = await request({
            baseUrl,
            headers: { Cookie: sessionCookie },
            method: "DELETE",
            path: `/api/tokens/${tokenBody.token.tokenId}`,
        });
        expect(revokeResponse.statusCode).toBe(204);
        const revokedMcpResponse = await request({
            baseUrl,
            body: JSON.stringify({
                id: 2,
                jsonrpc: "2.0",
                method: "tools/list",
            }),
            headers: {
                Authorization: `Bearer ${tokenBody.token.plaintextToken}`,
                "Content-Type": "application/json",
                Origin: "https://ydb-qdrant.tech",
            },
            method: "POST",
            path: "/mcp",
        });
        expect(revokedMcpResponse.statusCode).toBe(401);

        const uninstallBody = Buffer.from(
            JSON.stringify({
                action: "deleted",
                installation: {
                    account: { login: "octo", type: "User" },
                    id: installationId,
                },
                repositories: [repositoryPayload(repository)],
            })
        );
        const uninstallResponse = await request({
            baseUrl,
            body: uninstallBody,
            headers: signedWebhookHeaders({
                body: uninstallBody,
                deliveryId: `delivery-uninstall-${repoId}`,
                event: "installation",
                secret: webhookSecret,
            }),
            method: "POST",
            path: "/github/webhook",
        });
        expect(uninstallResponse.statusCode).toBe(200);
        expect(queue.jobs.at(-1)).toMatchObject({
            kind: "delete-repo-index",
            repository: { repoId },
        });
        await indexer.processJob(queue.jobs.at(-1) as IndexingJob);
        await expect(saasStore.getRepository(repoId)).resolves.toMatchObject({
            repoId: String(repoId),
            status: "deleted",
        });
        await expect(
            indexStore.search({
                collection,
                queryVector: vectorForText("tenant bootstrap flow"),
                top: 1,
                userUid,
            })
        ).rejects.toThrow();
    }, 120_000);
});
