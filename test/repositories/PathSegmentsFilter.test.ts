import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/ydb/client.js", () => ({
    TypedValues: {
        utf8: vi.fn((v: string) => ({ type: "utf8", v })),
    },
}));

import {
    buildExactPathSegmentsFilter,
    buildPrefixPathSegmentsFilter,
    buildPathSegmentsWhereClause,
} from "../../src/repositories/pointsRepo.one-table/PathSegmentsFilter.js";

describe("PathSegmentsFilter", () => {
    it("builds path_prefix-only where clause for a single path", () => {
        const result = buildPathSegmentsWhereClause([["src", "hooks"]]);

        expect(result.whereSql).toBe(
            "(path_prefix = $ppfx0 OR StartsWith(path_prefix, $ppfxd0))"
        );
        expect(result.whereSql).not.toContain("JSON_VALUE(");
        expect(result.whereSql).not.toContain("path_prefix IS NULL");
        expect(result.params).toEqual({
            $ppfx0: { type: "utf8", v: "src/hooks" },
            $ppfxd0: { type: "utf8", v: "src/hooks/" },
        });
    });

    it("builds only path_prefix params and declarations for multiple paths", () => {
        const result = buildPrefixPathSegmentsFilter([
            ["src/hooks"],
            ["src", "hooks"],
        ]);

        expect(result).toBeDefined();
        expect(result?.whereSql).toContain("path_prefix = $ppfx0");
        expect(result?.whereSql).toContain("StartsWith(path_prefix, $ppfxd0)");
        expect(result?.whereSql).toContain("path_prefix = $ppfx1");
        expect(result?.whereSql).toContain("StartsWith(path_prefix, $ppfxd1)");
        expect(result?.whereSql).not.toContain("JSON_VALUE(");
        expect(result?.whereSql).not.toContain("path_prefix IS NULL");
        expect(result?.whereParamDeclarations).toContain(
            "DECLARE $ppfx0 AS Utf8;"
        );
        expect(result?.whereParamDeclarations).toContain(
            "DECLARE $ppfxd0 AS Utf8;"
        );
        expect(result?.whereParamDeclarations).toContain(
            "DECLARE $ppfx1 AS Utf8;"
        );
        expect(result?.whereParamDeclarations).toContain(
            "DECLARE $ppfxd1 AS Utf8;"
        );
        expect(result?.whereParamDeclarations).not.toContain(
            "DECLARE $p0_0 AS Utf8;"
        );
        expect(Object.keys(result?.whereParams ?? {}).sort()).toEqual([
            "$ppfx0",
            "$ppfx1",
            "$ppfxd0",
            "$ppfxd1",
        ]);
    });

    it("builds exact-only file_path filters without descendant params", () => {
        const result = buildExactPathSegmentsFilter(
            [
                ["src", "components", "Button.tsx"],
                ["docs", "README.md"],
            ],
            "file_path"
        );

        expect(result).toBeDefined();
        expect(result?.whereSql).toContain("file_path = $ppfx0");
        expect(result?.whereSql).toContain("file_path = $ppfx1");
        expect(result?.whereSql).not.toContain("StartsWith(");
        expect(result?.whereParamDeclarations).toContain(
            "DECLARE $ppfx0 AS Utf8;"
        );
        expect(result?.whereParamDeclarations).toContain(
            "DECLARE $ppfx1 AS Utf8;"
        );
        expect(result?.whereParamDeclarations).not.toContain(
            "DECLARE $ppfxd0 AS Utf8;"
        );
        expect(result?.whereParamDeclarations).not.toContain(
            "DECLARE $ppfxd1 AS Utf8;"
        );
        expect(Object.keys(result?.whereParams ?? {}).sort()).toEqual([
            "$ppfx0",
            "$ppfx1",
        ]);
    });
});
