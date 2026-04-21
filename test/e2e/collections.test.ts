import { beforeAll, describe, expect, it } from "vitest";
import {
    type JsonObject,
    resolveBaseUrl,
    assertOkResponse,
    createCollectionName,
    putCollection,
    getCollection,
    upsertPointsReq,
    cleanupCollection,
} from "./helpers.js";

describe("e2e: collection lifecycle", () => {
    let baseUrl = "";
    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("returns collection info with points_count", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });

            const get1 = await getCollection(baseUrl, collection);
            assertOkResponse(get1.response, get1.body, "get empty");
            const info1 = get1.body.result as JsonObject;
            expect(info1.status).toBe("green");
            expect(info1.points_count).toBe(0);
            expect((info1.vectors as JsonObject).size).toBe(4);
            expect((info1.vectors as JsonObject).distance).toBe("Cosine");

            const upsert = await upsertPointsReq(baseUrl, collection, [
                { id: "p1", vector: [1, 0, 0, 0], payload: { a: 1 } },
                { id: "p2", vector: [0, 1, 0, 0], payload: { a: 2 } },
            ]);
            assertOkResponse(upsert.response, upsert.body, "upsert");

            const get2 = await getCollection(baseUrl, collection);
            assertOkResponse(get2.response, get2.body, "get with points");
            const info2 = get2.body.result as JsonObject;
            expect(info2.points_count).toBe(2);
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("creates the same collection idempotently", async () => {
        const collection = createCollectionName();
        try {
            const config = { size: 4, distance: "Cosine" };

            const r1 = await putCollection(baseUrl, collection, config);
            assertOkResponse(r1.response, r1.body, "first create");
            expect(r1.body.result).toBe(true);

            const r2 = await putCollection(baseUrl, collection, config);
            assertOkResponse(r2.response, r2.body, "second create");
            expect(r2.body.result).toBe(true);
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("rejects create with conflicting config", async () => {
        const collection = createCollectionName();
        try {
            const r1 = await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            assertOkResponse(r1.response, r1.body, "first create");

            const r2 = await putCollection(baseUrl, collection, {
                size: 8,
                distance: "Cosine",
            });
            expect(r2.response.status).toBe(400);
            expect(r2.body.status).toBe("error");
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });
});
