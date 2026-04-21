import { describe, expect, it } from "vitest";
import { expandPathPrefixes } from "../../src/utils/prefixExpansion.js";

describe("expandPathPrefixes", () => {
    it("returns empty list for empty prefix", () => {
        expect(expandPathPrefixes("")).toEqual([]);
    });

    it("returns one prefix for a single segment", () => {
        expect(expandPathPrefixes("README.md")).toEqual(["README.md"]);
    });

    it("returns all ancestor prefixes in order", () => {
        expect(expandPathPrefixes("src/components/Button.tsx")).toEqual([
            "src",
            "src/components",
            "src/components/Button.tsx",
        ]);
    });

    it("preserves encoded slashes inside a segment", () => {
        expect(expandPathPrefixes("src%2Fhooks/use.ts")).toEqual([
            "src%2Fhooks",
            "src%2Fhooks/use.ts",
        ]);
    });
});
