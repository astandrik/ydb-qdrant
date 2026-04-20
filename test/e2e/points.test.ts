import { beforeAll, describe, expect, it } from "vitest";
import {
    DEFAULT_API_KEY,
    type JsonObject,
    resolveBaseUrl,
    assertOkResponse,
    createCollectionName,
    deleteCollectionReq,
    headersWithApiKey,
    putCollection,
    getCollection,
    upsertPointsReq,
    searchPointsReq,
    deletePointsReq,
    retrievePointsReq,
    cleanupCollection,
} from "./helpers.js";
import { listLookupRowsForPoint } from "./pathsegments.helpers.js";

describe("e2e: points CRUD", () => {
    let baseUrl = "";
    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("deletes points by IDs", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                { id: "p1", vector: [1, 0, 0, 0], payload: { label: "p1" } },
                { id: "p2", vector: [0, 1, 0, 0], payload: { label: "p2" } },
                { id: "p3", vector: [0, 0, 1, 0], payload: { label: "p3" } },
            ]);

            const del = await deletePointsReq(baseUrl, collection, {
                points: ["p1", "p2"],
            });
            assertOkResponse(del.response, del.body, "delete");

            const s = await searchPointsReq(baseUrl, collection, {
                vector: [0, 0, 1, 0],
                top: 10,
                with_payload: true,
            });
            assertOkResponse(s.response, s.body, "search after delete");
            const pts = s.body.result as JsonObject[];
            expect(pts).toHaveLength(1);
            expect(pts[0].id).toBe("p3");
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("clears all points with empty filter", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                { id: "p1", vector: [1, 0, 0, 0], payload: { a: 1 } },
                { id: "p2", vector: [0, 1, 0, 0], payload: { a: 2 } },
                { id: "p3", vector: [0, 0, 1, 0], payload: { a: 3 } },
            ]);

            const del = await deletePointsReq(baseUrl, collection, {
                filter: { must: [] },
            });
            assertOkResponse(del.response, del.body, "clear all");

            const g = await getCollection(baseUrl, collection);
            assertOkResponse(g.response, g.body, "get after clear");
            const info = g.body.result as JsonObject;
            expect(info.points_count).toBe(0);
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("clears lookup rows with empty filter", async () => {
        const collection = createCollectionName();
        const userAgent = "lookup-table-clear-e2e";
        const headers = {
            ...headersWithApiKey(DEFAULT_API_KEY),
            "user-agent": userAgent,
        };

        try {
            await putCollection(
                baseUrl,
                collection,
                {
                    size: 4,
                    distance: "Cosine",
                },
                headers
            );
            await upsertPointsReq(
                baseUrl,
                collection,
                [
                    {
                        id: "p1",
                        vector: [1, 0, 0, 0],
                        payload: {
                            label: "p1",
                            pathSegments: ["src", "components", "Button.tsx"],
                        },
                    },
                    {
                        id: "p2",
                        vector: [0, 1, 0, 0],
                        payload: {
                            label: "p2",
                            pathSegments: ["src", "utils", "helpers.ts"],
                        },
                    },
                ],
                headers
            );

            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "p1",
                    userAgent,
                })
            ).toEqual(["src", "src/components", "src/components/Button.tsx"]);
            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "p2",
                    userAgent,
                })
            ).toEqual(["src", "src/utils", "src/utils/helpers.ts"]);

            const del = await deletePointsReq(
                baseUrl,
                collection,
                {
                    filter: { must: [] },
                },
                headers
            );
            assertOkResponse(del.response, del.body, "clear all with lookup cleanup");

            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "p1",
                    userAgent,
                })
            ).toEqual([]);
            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "p2",
                    userAgent,
                })
            ).toEqual([]);
        } finally {
            await deleteCollectionReq(baseUrl, collection, headers);
        }
    });

    it("retrieves points by IDs with payload control", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                { id: "p1", vector: [1, 0, 0, 0], payload: { x: 1 } },
                { id: "p2", vector: [0, 1, 0, 0], payload: { x: 2 } },
                { id: "p3", vector: [0, 0, 1, 0], payload: { x: 3 } },
            ]);

            const r1 = await retrievePointsReq(baseUrl, collection, {
                ids: ["p1", "p3"],
            });
            assertOkResponse(r1.response, r1.body, "retrieve with payload");
            const pts1 = r1.body.result as JsonObject[];
            expect(pts1).toHaveLength(2);
            const ids = pts1.map((p) => p.id).sort();
            expect(ids).toEqual(["p1", "p3"]);
            const p1 = pts1.find((p) => p.id === "p1");
            expect(p1).toBeDefined();
            expect(p1?.payload).toEqual({ x: 1 });

            const r2 = await retrievePointsReq(baseUrl, collection, {
                ids: ["p1"],
                with_payload: false,
            });
            assertOkResponse(r2.response, r2.body, "retrieve no payload");
            const pts2 = r2.body.result as JsonObject[];
            expect(pts2).toHaveLength(1);
            expect(pts2[0].payload).toBeNull();
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });
});
