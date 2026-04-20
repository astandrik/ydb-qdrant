import { describe, it, expect } from "vitest";
import { isCompilationTimeoutError } from "../../src/ydb/client.js";

describe("isCompilationTimeoutError", () => {
    it("returns true for explicit Query compilation timed out message", () => {
        const err = new Error("Query compilation timed out after 10000ms");
        expect(isCompilationTimeoutError(err)).toBe(true);
    });

    it("returns true for Timeout (code 400090) with compilation-related issue", () => {
        const err = new Error(
            'Timeout (code 400090): [{"message":"Query compilation timed out","severity":1}]'
        );
        expect(isCompilationTimeoutError(err)).toBe(true);
    });

    it("returns false for Timeout (code 400090) with Bulk upsert issue", () => {
        const err = new Error(
            `Timeout (code 400090): [\n  {\n    "message": "Bulk upsert to table '/eu/qdrant_as_a_service/prod/db/qdrant_all_points' longTx ydb://long-tx/read-only timed out, duration: 8 sec",\n    "severity": 1\n  }\n]`
        );
        expect(isCompilationTimeoutError(err)).toBe(false);
    });

    it("returns false for Timeout (code 400090) with generic operation timeout", () => {
        const err = new Error(
            'Timeout (code 400090): [{"message":"Operation timed out","severity":1}]'
        );
        expect(isCompilationTimeoutError(err)).toBe(false);
    });

    it("returns true for Cancelled (code 400160) with during compilation", () => {
        const err = new Error(
            'Cancelled (code 400160): [{"message":"Cancelling after 3000ms during compilation","severity":1}]'
        );
        expect(isCompilationTimeoutError(err)).toBe(true);
    });

    it("returns false for Cancelled (code 400160) without during compilation", () => {
        const err = new Error(
            'Cancelled (code 400160): [{"message":"Request cancelled","severity":1}]'
        );
        expect(isCompilationTimeoutError(err)).toBe(false);
    });

    it("returns false for non-Error values", () => {
        expect(isCompilationTimeoutError("Timeout (code 400090)")).toBe(false);
        expect(isCompilationTimeoutError(null)).toBe(false);
        expect(isCompilationTimeoutError(undefined)).toBe(false);
        expect(isCompilationTimeoutError(42)).toBe(false);
    });
});
