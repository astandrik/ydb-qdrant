import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createYdbQdrantMcpHttpRouter } from "../../src/mcp/http.js";
import type { YdbQdrantMcpDeps } from "../../src/mcp/types.js";
import { createYdbQdrantClient } from "../../src/package/api.js";
import { createMetaTableIfMissing } from "./helpers/bootstrap-meta-table.js";
import { forceLocalYdbEndpointForSdkDiscovery } from "./helpers/local-ydb-discovery.js";
import {
    closeHttpServer,
    requestJson,
    requestText,
    startExpressServer,
    type StartedHttpServer,
} from "./helpers/http-server.js";

type JsonRpcResponse<T = unknown> = {
    error?: unknown;
    id: string | number | null;
    jsonrpc: "2.0";
    result?: T;
};

type ListCollectionsStructuredContent = {
    collections?: Array<{
        name?: string;
        pointsCount?: number;
    }>;
};

const BEARER_TOKEN = "real-mcp-token";
const ALLOWED_ORIGIN = "https://agent.example";

function collectionName(): string {
    return `real_mcp_http_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2, 10)}`;
}

describe("YDB real hosted MCP HTTP integration", () => {
    let started: StartedHttpServer;
    let client: Awaited<ReturnType<typeof createYdbQdrantClient>>;
    let collection = "";

    beforeAll(async () => {
        forceLocalYdbEndpointForSdkDiscovery();
        await createMetaTableIfMissing();

        const userUid = `Real-Mcp-Http-${Date.now()}`;
        client = await createYdbQdrantClient({ userUid });
        const deps: YdbQdrantMcpDeps = {
            client,
            listCollections: async () => {
                const result = await client.listCollections();
                return result.collections.map((item) => ({
                    distance: item.vectors.distance,
                    lastAccessedAt: item.last_accessed_at,
                    name: item.name,
                    pointsCount: item.points_count,
                    vectorSize: item.vectors.size,
                    vectorType: item.vectors.data_type,
                }));
            },
            userUid,
        };

        const app = express();
        app.use(
            "/mcp",
            createYdbQdrantMcpHttpRouter({
                allowedOrigins: [ALLOWED_ORIGIN],
                bearerToken: BEARER_TOKEN,
                deps,
            })
        );
        started = await startExpressServer(app);
    });

    afterAll(async () => {
        if (collection) {
            await client.deleteCollection(collection).catch(() => undefined);
        }
        await closeHttpServer(started.server);
    });

    it("enforces bearer and CORS before serving JSON-RPC over real YDB-backed deps", async () => {
        const missingBearer = await requestJson({
            baseUrl: started.baseUrl,
            method: "GET",
            path: "/mcp",
        });
        expect(missingBearer.statusCode).toBe(401);

        const invalidOrigin = await requestJson({
            baseUrl: started.baseUrl,
            body: {
                id: 1,
                jsonrpc: "2.0",
                method: "initialize",
            },
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                Origin: "https://evil.example",
            },
            method: "POST",
            path: "/mcp",
        });
        expect(invalidOrigin.statusCode).toBe(403);

        const probe = await requestText({
            baseUrl: started.baseUrl,
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
            },
            method: "GET",
            path: "/mcp",
        });
        expect(probe.statusCode).toBe(200);
        expect(probe.headers["content-type"]).toContain("text/event-stream");
        expect(probe.body).toContain("ydb-qdrant");
    });

    it("serves list_collections structuredContent through hosted MCP HTTP and real YDB", async () => {
        collection = collectionName();
        await client.createCollection(collection, {
            vectors: {
                data_type: "float",
                distance: "Cosine",
                size: 4,
            },
        });
        await client.upsertPoints(collection, {
            points: [
                {
                    id: "mcp_http_point",
                    payload: { source: "hosted-mcp-http" },
                    vector: [1, 0, 0, 0],
                },
            ],
        });

        const response = await requestJson<
            JsonRpcResponse<{
                structuredContent?: ListCollectionsStructuredContent;
            }>
        >({
            baseUrl: started.baseUrl,
            body: {
                id: "list",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {},
                    name: "list_collections",
                },
            },
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                Origin: ALLOWED_ORIGIN,
            },
            method: "POST",
            path: "/mcp",
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers["access-control-allow-origin"]).toBe(
            ALLOWED_ORIGIN
        );
        expect(response.body).toMatchObject({
            id: "list",
            jsonrpc: "2.0",
        });
        expect(response.body.result?.structuredContent?.collections).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: collection,
                    pointsCount: 1,
                }),
            ])
        );
    });
});
