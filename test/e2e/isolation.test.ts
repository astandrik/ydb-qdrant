import { beforeAll, describe, expect, it } from "vitest";
import {
    type JsonObject,
    resolveBaseUrl,
    assertOkResponse,
    createCollectionName,
    headersWithApiKey,
    putCollection,
    upsertPointsReq,
    searchPointsReq,
    cleanupCollection,
} from "./helpers.js";

describe("e2e: per-token isolation", () => {
    let baseUrl = "";
    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("isolates search results by api-key via payload signing", async () => {
        const collection = createCollectionName();
        const hdrsA = headersWithApiKey("isolation-key-aaa");
        const hdrsB = headersWithApiKey("isolation-key-bbb");

        try {
            await putCollection(
                baseUrl,
                collection,
                { size: 4, distance: "Cosine" },
                hdrsA
            );

            await upsertPointsReq(
                baseUrl,
                collection,
                [
                    { id: "a1", vector: [1, 0, 0, 0], payload: { owner: "A" } },
                    { id: "a2", vector: [0, 1, 0, 0], payload: { owner: "A" } },
                ],
                hdrsA
            );
            await upsertPointsReq(
                baseUrl,
                collection,
                [
                    { id: "b1", vector: [0, 0, 1, 0], payload: { owner: "B" } },
                ],
                hdrsB
            );

            const sA = await searchPointsReq(
                baseUrl,
                collection,
                { vector: [0.25, 0.25, 0.25, 0.25], top: 10, with_payload: true },
                hdrsA
            );
            assertOkResponse(sA.response, sA.body, "search key A");
            const ptsA = sA.body.result as JsonObject[];
            expect(ptsA).toHaveLength(2);
            for (const p of ptsA) {
                expect((p.payload as JsonObject).owner).toBe("A");
            }

            const sB = await searchPointsReq(
                baseUrl,
                collection,
                { vector: [0.25, 0.25, 0.25, 0.25], top: 10, with_payload: true },
                hdrsB
            );
            assertOkResponse(sB.response, sB.body, "search key B");
            const ptsB = sB.body.result as JsonObject[];
            expect(ptsB).toHaveLength(1);
            expect((ptsB[0].payload as JsonObject).owner).toBe("B");
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });
});
