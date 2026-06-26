import http from "node:http";

import express from "express";
import { describe, expect, it, vi } from "vitest";

import { createYdbQdrantMcpHttpRouter } from "../../src/mcp/http.js";
import type { YdbQdrantMcpDeps } from "../../src/mcp/types.js";
import type { YdbQdrantClient } from "../../src/package/api.js";

type TestResponse = {
    body: string;
    headers: http.IncomingHttpHeaders;
    statusCode: number;
};

function makeClient(): YdbQdrantClient {
    return {
        createCollection: vi.fn(() => Promise.resolve({ name: "docs" })),
        deleteCollection: vi.fn(() => Promise.resolve({ acknowledged: true })),
        deletePoints: vi.fn(() => Promise.resolve({ deleted: 1 })),
        getCollection: vi.fn(() =>
            Promise.resolve({
                config: {
                    params: {
                        vectors: {
                            data_type: "float",
                            distance: "Cosine",
                            size: 2,
                        },
                    },
                },
                name: "docs",
                points_count: 3,
                status: "green",
                vectors: {
                    data_type: "float",
                    distance: "Cosine",
                    size: 2,
                },
            })
        ),
        listCollections: vi.fn(() => Promise.resolve({ collections: [] })),
        putCollectionIndex: vi.fn(() =>
            Promise.resolve({ operation_id: 0, status: "completed" })
        ),
        retrievePoints: vi.fn(() => Promise.resolve({ points: [] })),
        searchPoints: vi.fn(() => Promise.resolve({ points: [] })),
        upsertPoints: vi.fn(() => Promise.resolve({ upserted: 1 })),
    };
}

function makeDeps(): YdbQdrantMcpDeps {
    return {
        client: makeClient(),
        listCollections: vi.fn(() =>
            Promise.resolve([
                {
                    distance: "Cosine",
                    name: "docs",
                    pointsCount: 3,
                    vectorSize: 2,
                    vectorType: "float",
                },
            ])
        ),
        userUid: "tenant_a",
    };
}

async function startServer(): Promise<{
    baseUrl: string;
    deps: YdbQdrantMcpDeps;
    server: http.Server;
}> {
    const deps = makeDeps();
    const app = express();
    app.use(
        "/mcp",
        createYdbQdrantMcpHttpRouter({
            allowedOrigins: ["https://agent.example"],
            bearerToken: "valid-token",
            deps,
        })
    );
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

describe("YDB Qdrant hosted MCP HTTP endpoint", () => {
    it("handles CORS preflight and rejects invalid origins", async () => {
        const { baseUrl, deps, server } = await startServer();
        try {
            const preflight = await request({
                baseUrl,
                method: "OPTIONS",
                origin: "https://agent.example",
                requestHeaders: "authorization, content-type",
            });
            const invalidOrigin = await request({
                baseUrl,
                body: { id: 1, jsonrpc: "2.0", method: "initialize" },
                origin: "https://evil.example",
                token: "valid-token",
            });

            expect(preflight.statusCode).toBe(204);
            expect(preflight.headers["access-control-allow-origin"]).toBe(
                "https://agent.example"
            );
            expect(preflight.headers["access-control-allow-methods"]).toContain(
                "POST"
            );
            expect(preflight.headers["access-control-allow-headers"]).toContain(
                "Authorization"
            );
            expect(invalidOrigin.statusCode).toBe(403);
            expect(
                (
                    deps.client.searchPoints as unknown as {
                        mock: { calls: unknown[] };
                    }
                ).mock.calls
            ).toHaveLength(0);
        } finally {
            await closeServer(server);
        }
    });

    it("requires a static bearer token for POST and GET", async () => {
        const { baseUrl, server } = await startServer();
        try {
            const missing = await request({
                baseUrl,
                body: { id: 1, jsonrpc: "2.0", method: "initialize" },
            });
            const invalid = await request({
                baseUrl,
                body: { id: 1, jsonrpc: "2.0", method: "initialize" },
                token: "bad-token",
            });
            const missingGet = await request({ baseUrl, method: "GET" });

            expect(missing.statusCode).toBe(401);
            expect(invalid.statusCode).toBe(401);
            expect(missingGet.statusCode).toBe(401);
        } finally {
            await closeServer(server);
        }
    });

    it("serves authenticated SSE probe and POST JSON-RPC", async () => {
        const { baseUrl, server } = await startServer();
        try {
            const probe = await request({
                baseUrl,
                method: "GET",
                token: "valid-token",
            });
            const initialized = await request({
                baseUrl,
                body: { id: 1, jsonrpc: "2.0", method: "initialize" },
                origin: "https://agent.example",
                token: "valid-token",
            });
            const tools = await request({
                baseUrl,
                body: { id: 2, jsonrpc: "2.0", method: "tools/list" },
                token: "valid-token",
            });

            expect(probe.statusCode).toBe(200);
            expect(probe.headers["content-type"]).toContain("text/event-stream");
            expect(probe.body).toContain("ydb-qdrant");
            expect(initialized.statusCode).toBe(200);
            expect(initialized.headers["access-control-allow-origin"]).toBe(
                "https://agent.example"
            );
            expect(JSON.parse(initialized.body)).toMatchObject({
                id: 1,
                result: {
                    serverInfo: { name: "ydb-qdrant" },
                },
            });
            expect(
                (
                    JSON.parse(tools.body) as {
                        result: { tools: Array<{ name: string }> };
                    }
                ).result.tools.map((tool) => tool.name)
            ).toEqual([
                "mcp_status",
                "list_collections",
                "get_collection",
                "search_points",
                "retrieve_points",
            ]);
        } finally {
            await closeServer(server);
        }
    });
});
