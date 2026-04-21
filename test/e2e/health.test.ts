import { beforeAll, describe, expect, it } from "vitest";
import {
    type JsonObject,
    resolveBaseUrl,
    fetchJson,
    getCollection,
    searchPointsReq,
} from "./helpers.js";

describe("e2e: error paths and health", () => {
    let baseUrl = "";
    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("returns service info and health, 404 for missing collection", async () => {
        const root = await fetchJson(baseUrl, "/");
        expect(root.response.ok).toBe(true);
        const rootBody = root.body as unknown as JsonObject;
        expect(rootBody.title).toBe("ydb-qdrant");
        expect(typeof rootBody.version).toBe("string");

        const health = await fetchJson(baseUrl, "/health");
        // In e2e tvmtool is typically not running, so /health may return
        // 503 "tvmtool unavailable". Both 200 and 503-tvmtool are acceptable;
        // what matters is that YDB itself is reachable (no scheduleExit).
        if (health.response.ok) {
            expect(health.body.status).toBe("ok");
        } else {
            expect(health.response.status).toBe(503);
            expect(health.body.error).toBe("tvmtool unavailable");
        }

        const notFound = await getCollection(
            baseUrl,
            "nonexistent_e2e_xxx"
        );
        expect(notFound.response.status).toBe(404);
        expect(notFound.body.status).toBe("error");

        const searchNotFound = await searchPointsReq(
            baseUrl,
            "nonexistent_e2e_xxx",
            { vector: [1, 0, 0, 0], top: 1 }
        );
        expect(searchNotFound.response.status).toBe(404);
        expect(searchNotFound.body.status).toBe("error");
    });
});
