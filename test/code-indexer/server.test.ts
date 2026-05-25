import http from "node:http";

import { describe, expect, it, vi } from "vitest";

import { buildCodeIndexerServer } from "../../src/code-indexer/server.js";
import type {
    CodeIndexStore,
    DeliveryStore,
    EmbeddingProvider,
    IndexingQueue,
} from "../../src/code-indexer/types.js";

function createDeps() {
    const search = vi.fn(() =>
        Promise.resolve([
            {
                id: "point-1",
                payload: { path: "src/index.ts" },
                score: 0.9,
            },
        ])
    );
    const embeddingProvider: EmbeddingProvider = {
        dimension: 2,
        embedDocuments: vi.fn(),
        embedQuery: vi.fn(() => Promise.resolve([1, 0])),
    };
    const store: CodeIndexStore = {
        countCollection: vi.fn(),
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
        enqueue: vi.fn(),
    };
    return { deliveryStore, embeddingProvider, queue, search, store };
}

async function startCodeIndexerServer(searchApiKey?: string): Promise<{
    baseUrl: string;
    search: ReturnType<typeof vi.fn>;
    server: http.Server;
}> {
    const deps = createDeps();
    const app = buildCodeIndexerServer({
        ...deps,
        searchApiKey,
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
        search: deps.search,
        server,
    };
}

async function closeServer(server: http.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
}

async function postSearch(params: {
    baseUrl: string;
    token?: string;
}): Promise<{ body: string; statusCode: number }> {
    const url = new URL("/search", params.baseUrl);
    const body = JSON.stringify({
        installationId: 123,
        query: "build server",
        repoId: 456,
    });
    return await new Promise((resolve, reject) => {
        const req = http.request(
            url,
            {
                headers: {
                    ...(params.token ? { Authorization: params.token } : {}),
                    "Content-Length": String(Buffer.byteLength(body)),
                    "Content-Type": "application/json",
                },
                method: "POST",
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
        req.write(body);
        req.end();
    });
}

describe("code-indexer server", () => {
    it("keeps search open when no search API key is configured", async () => {
        const { baseUrl, search, server } = await startCodeIndexerServer();
        try {
            const response = await postSearch({ baseUrl });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toMatchObject({
                collection: "gh_repo_456_default",
                status: "ok",
            });
            expect(search).toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });

    it("rejects search without a bearer token when search API key is configured", async () => {
        const { baseUrl, search, server } = await startCodeIndexerServer("search-key");
        try {
            const response = await postSearch({ baseUrl });

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toEqual({
                error: "unauthorized",
                status: "error",
            });
            expect(search).not.toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });

    it("rejects search with a wrong bearer token", async () => {
        const { baseUrl, search, server } = await startCodeIndexerServer("search-key");
        try {
            const response = await postSearch({
                baseUrl,
                token: "Bearer wrong",
            });

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toEqual({
                error: "unauthorized",
                status: "error",
            });
            expect(search).not.toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });

    it("allows search with the configured bearer token", async () => {
        const { baseUrl, search, server } = await startCodeIndexerServer("search-key");
        try {
            const response = await postSearch({
                baseUrl,
                token: "Bearer search-key",
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toMatchObject({
                collection: "gh_repo_456_default",
                status: "ok",
            });
            expect(search).toHaveBeenCalled();
        } finally {
            await closeServer(server);
        }
    });
});
