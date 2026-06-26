import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildServer } from "../../src/server.js";
import { createMetaTableIfMissing } from "./helpers/bootstrap-meta-table.js";
import { forceLocalYdbEndpointForSdkDiscovery } from "./helpers/local-ydb-discovery.js";
import {
    closeHttpServer,
    requestJson,
    startExpressServer,
    type StartedHttpServer,
} from "./helpers/http-server.js";

type QdrantResponse<T = unknown> = {
    error?: unknown;
    result?: T;
    status: "error" | "ok";
    time?: number;
    usage?: unknown;
};

type ScoredPoint = {
    id: string;
    payload?: Record<string, unknown> | null;
};

const DEFAULT_HEADERS = {
    "api-key": "real-http-api-key",
};

function collectionName(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2, 10)}`;
}

function hasPayloadField(
    points: ScoredPoint[] | undefined,
    key: string,
    value: unknown
): boolean {
    return (points ?? []).some((point) => point.payload?.[key] === value);
}

async function deleteCollection(
    baseUrl: string,
    collection: string,
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<void> {
    try {
        await requestJson({
            baseUrl,
            headers,
            method: "DELETE",
            path: `/collections/${collection}`,
        });
    } catch {
        // best-effort cleanup
    }
}

describe("YDB real HTTP API integration", () => {
    let started: StartedHttpServer;

    beforeAll(async () => {
        forceLocalYdbEndpointForSdkDiscovery();
        await createMetaTableIfMissing();
        started = await startExpressServer(buildServer());
    });

    afterAll(async () => {
        await closeHttpServer(started.server);
    });

    it("serves collection and points lifecycle through the real HTTP route stack", async () => {
        const collection = collectionName("real_http_lifecycle");

        try {
            const health = await requestJson<{ status: string }>({
                baseUrl: started.baseUrl,
                path: "/health",
            });
            expect(health.statusCode).toBe(200);
            expect(health.body).toEqual({ status: "ok" });

            const create = await requestJson<QdrantResponse<boolean>>({
                baseUrl: started.baseUrl,
                body: {
                    vectors: {
                        data_type: "float",
                        distance: "Cosine",
                        size: 4,
                    },
                },
                headers: DEFAULT_HEADERS,
                method: "PUT",
                path: `/collections/${collection}`,
            });
            expect(create.statusCode).toBe(200);
            expect(create.body.status).toBe("ok");
            expect(create.body.result).toBe(true);

            const upsert = await requestJson<QdrantResponse<{ status: string }>>({
                baseUrl: started.baseUrl,
                body: {
                    points: [
                        {
                            id: "p1",
                            payload: { owner: "http", rank: 1 },
                            vector: [1, 0, 0, 0],
                        },
                        {
                            id: "p2",
                            payload: { owner: "http", rank: 2 },
                            vector: [0, 1, 0, 0],
                        },
                    ],
                },
                headers: DEFAULT_HEADERS,
                method: "PUT",
                path: `/collections/${collection}/points`,
            });
            expect(upsert.statusCode).toBe(200);
            expect(upsert.body.status).toBe("ok");
            expect(upsert.body.result).toMatchObject({ status: "completed" });

            const search = await requestJson<QdrantResponse<ScoredPoint[]>>({
                baseUrl: started.baseUrl,
                body: {
                    top: 2,
                    vector: [1, 0, 0, 0],
                    with_payload: true,
                },
                headers: DEFAULT_HEADERS,
                method: "POST",
                path: `/collections/${collection}/points/search`,
            });
            expect(search.statusCode).toBe(200);
            expect(search.body.status).toBe("ok");
            expect(search.body.result?.map((point) => point.id)).toContain("p1");
            expect(
                search.body.result?.find((point) => point.id === "p1")?.payload
            ).toMatchObject({ owner: "http" });

            const retrieve = await requestJson<QdrantResponse<ScoredPoint[]>>({
                baseUrl: started.baseUrl,
                body: {
                    ids: ["p1"],
                    with_payload: true,
                },
                headers: DEFAULT_HEADERS,
                method: "POST",
                path: `/collections/${collection}/points`,
            });
            expect(retrieve.statusCode).toBe(200);
            expect(retrieve.body.status).toBe("ok");
            expect(retrieve.body.result?.[0]?.id).toBe("p1");
            expect(retrieve.body.result?.[0]?.payload?.owner).toBe("http");

            const remove = await requestJson<QdrantResponse<boolean>>({
                baseUrl: started.baseUrl,
                headers: DEFAULT_HEADERS,
                method: "DELETE",
                path: `/collections/${collection}`,
            });
            expect(remove.statusCode).toBe(200);
            expect(remove.body.status).toBe("ok");
            expect(remove.body.result).toBe(true);

            const missing = await requestJson<QdrantResponse>({
                baseUrl: started.baseUrl,
                headers: DEFAULT_HEADERS,
                path: `/collections/${collection}`,
            });
            expect(missing.statusCode).toBe(404);
            expect(missing.body.status).toBe("error");
        } finally {
            await deleteCollection(started.baseUrl, collection);
        }
    });

    it("isolates same API key across HTTP tenant namespaces against real YDB", async () => {
        const collection = collectionName("real_http_tenant");
        const apiKey = "real-http-shared-key";
        const tenantAHeaders = {
            "api-key": apiKey,
            "x-tenant-id": "tenant_a",
        };
        const tenantBHeaders = {
            "api-key": apiKey,
            "x-tenant-id": "tenant_b",
        };

        try {
            for (const headers of [tenantAHeaders, tenantBHeaders]) {
                const create = await requestJson<QdrantResponse<boolean>>({
                    baseUrl: started.baseUrl,
                    body: {
                        vectors: {
                            data_type: "float",
                            distance: "Cosine",
                            size: 4,
                        },
                    },
                    headers,
                    method: "PUT",
                    path: `/collections/${collection}`,
                });
                expect(create.statusCode).toBe(200);
                expect(create.body.status).toBe("ok");
                expect(create.body.result).toBe(true);
            }

            await requestJson<QdrantResponse>({
                baseUrl: started.baseUrl,
                body: {
                    points: [
                        {
                            id: "shared",
                            payload: { tenant: "a" },
                            vector: [1, 0, 0, 0],
                        },
                    ],
                },
                headers: tenantAHeaders,
                method: "PUT",
                path: `/collections/${collection}/points`,
            });
            await requestJson<QdrantResponse>({
                baseUrl: started.baseUrl,
                body: {
                    points: [
                        {
                            id: "shared",
                            payload: { tenant: "b" },
                            vector: [0, 1, 0, 0],
                        },
                    ],
                },
                headers: tenantBHeaders,
                method: "PUT",
                path: `/collections/${collection}/points`,
            });

            const searchA = await requestJson<QdrantResponse<ScoredPoint[]>>({
                baseUrl: started.baseUrl,
                body: {
                    top: 5,
                    vector: [1, 0, 0, 0],
                    with_payload: true,
                },
                headers: tenantAHeaders,
                method: "POST",
                path: `/collections/${collection}/points/search`,
            });
            const searchB = await requestJson<QdrantResponse<ScoredPoint[]>>({
                baseUrl: started.baseUrl,
                body: {
                    top: 5,
                    vector: [0, 1, 0, 0],
                    with_payload: true,
                },
                headers: tenantBHeaders,
                method: "POST",
                path: `/collections/${collection}/points/search`,
            });

            expect(searchA.statusCode).toBe(200);
            expect(searchA.body.status).toBe("ok");
            expect(hasPayloadField(searchA.body.result, "tenant", "a")).toBe(true);
            expect(hasPayloadField(searchA.body.result, "tenant", "b")).toBe(false);

            expect(searchB.statusCode).toBe(200);
            expect(searchB.body.status).toBe("ok");
            expect(hasPayloadField(searchB.body.result, "tenant", "b")).toBe(true);
            expect(hasPayloadField(searchB.body.result, "tenant", "a")).toBe(false);
        } finally {
            await deleteCollection(started.baseUrl, collection, tenantAHeaders);
            await deleteCollection(started.baseUrl, collection, tenantBHeaders);
        }
    });
});
