import { describe, it, expect } from "vitest";
import { qdrantResponse } from "../../src/utils/qdrantResponse.js";

describe("qdrantResponse", () => {
    it("wraps result with status, time and usage fields", () => {
        const start = process.hrtime();
        const resp = qdrantResponse({ foo: "bar" }, start);

        expect(resp.status).toBe("ok");
        expect(resp.result).toEqual({ foo: "bar" });
        expect(resp.usage).toBeNull();
        expect(typeof resp.time).toBe("number");
        expect(resp.time).toBeGreaterThanOrEqual(0);
    });

    it("passes through boolean result", () => {
        const start = process.hrtime();
        const resp = qdrantResponse(true, start);

        expect(resp.result).toBe(true);
    });

    it("passes through array result", () => {
        const start = process.hrtime();
        const items = [{ id: "a" }, { id: "b" }];
        const resp = qdrantResponse(items, start);

        expect(resp.result).toEqual(items);
    });
});
