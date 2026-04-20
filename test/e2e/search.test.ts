import { beforeAll, describe, expect, it } from "vitest";
import {
    type JsonObject,
    DEFAULT_HEADERS,
    resolveBaseUrl,
    assertOkResponse,
    createCollectionName,
    fetchJson,
    putCollection,
    upsertPointsReq,
    searchPointsReq,
    queryPointsReq,
    cleanupCollection,
} from "./helpers.js";

describe("e2e: search", () => {
    let baseUrl = "";
    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("creates a collection, upserts points and searches them", async () => {
        const collection = createCollectionName();
        let collectionCreated = false;

        try {
            const createResult = await fetchJson(
                baseUrl,
                `/collections/${collection}`,
                {
                    method: "PUT",
                    headers: DEFAULT_HEADERS,
                    body: JSON.stringify({
                        vectors: {
                            size: 4,
                            distance: "Cosine",
                            data_type: "float",
                        },
                    }),
                }
            );

            assertOkResponse(
                createResult.response,
                createResult.body,
                "collection creation should succeed"
            );
            expect(createResult.body.result).toBe(true);
            collectionCreated = true;

            const upsertResult = await fetchJson(
                baseUrl,
                `/collections/${collection}/points`,
                {
                    method: "PUT",
                    headers: DEFAULT_HEADERS,
                    body: JSON.stringify({
                        points: [
                            {
                                id: "p1",
                                vector: [0, 0, 0, 1],
                                payload: { label: "p1" },
                            },
                            {
                                id: "p2",
                                vector: [0, 0, 1, 0],
                                payload: { label: "p2" },
                            },
                        ],
                    }),
                }
            );

            assertOkResponse(
                upsertResult.response,
                upsertResult.body,
                "point upsert should succeed"
            );
            expect(upsertResult.body.result).toEqual({
                operation_id: 0,
                status: "completed",
            });

            const searchResult = await fetchJson(
                baseUrl,
                `/collections/${collection}/points/search`,
                {
                    method: "POST",
                    headers: DEFAULT_HEADERS,
                    body: JSON.stringify({
                        vector: [0, 0, 0, 1],
                        top: 2,
                        with_payload: true,
                    }),
                }
            );

            assertOkResponse(
                searchResult.response,
                searchResult.body,
                "point search should succeed"
            );

            const points = searchResult.body.result;
            expect(Array.isArray(points)).toBe(true);
            const scoredPoints = points as JsonObject[];
            expect(scoredPoints.length).toBeGreaterThan(0);
            expect(scoredPoints[0]?.id).toBe("p1");
            expect(scoredPoints[0]?.payload).toEqual({ label: "p1" });
        } finally {
            if (collectionCreated) {
                const deleteResult = await fetchJson(
                    baseUrl,
                    `/collections/${collection}`,
                    {
                        method: "DELETE",
                        headers: DEFAULT_HEADERS,
                    }
                );
                expect(deleteResult.response.status).toBe(200);
                expect(deleteResult.body.status).toBe("ok");
            }
        }
    });

    it("filters results by score_threshold for Cosine", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            // close: identical to query → similarity ≈ 1.0
            // medium: [0.7, 0.7, 0, 0] → similarity ≈ 0.707
            // far: orthogonal → similarity ≈ 0.0
            await upsertPointsReq(baseUrl, collection, [
                { id: "close", vector: [1, 0, 0, 0], payload: { label: "close" } },
                { id: "medium", vector: [0.7, 0.7, 0, 0], payload: { label: "medium" } },
                { id: "far", vector: [0, 0, 0, 1], payload: { label: "far" } },
            ]);

            const s = await searchPointsReq(baseUrl, collection, {
                vector: [1, 0, 0, 0],
                top: 10,
                with_payload: true,
                score_threshold: 0.9,
            });
            assertOkResponse(s.response, s.body, "search with threshold");
            const pts = s.body.result as JsonObject[];
            expect(pts).toHaveLength(1);
            expect(pts[0].id).toBe("close");
            expect(pts[0].score as number).toBeGreaterThanOrEqual(0.9);
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("returns nested result shape from query endpoint", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                { id: "p1", vector: [1, 0, 0, 0], payload: { label: "p1" } },
                { id: "p2", vector: [0, 1, 0, 0], payload: { label: "p2" } },
            ]);

            const q = await queryPointsReq(baseUrl, collection, {
                query: { nearest: { vector: [1, 0, 0, 0] } },
                limit: 2,
                with_payload: true,
            });
            assertOkResponse(q.response, q.body, "query");

            const result = q.body.result as JsonObject;
            expect(result.points).toBeDefined();
            const pts = result.points as JsonObject[];
            expect(pts.length).toBeGreaterThan(0);
            expect(pts[0].id).toBe("p1");
            expect(pts[0].payload).toEqual({ label: "p1" });
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });
});
