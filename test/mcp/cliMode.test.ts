import { describe, expect, it } from "vitest";

import { readMode } from "../../packages/ydb-qdrant-mcp/src/cli.js";

describe("ydb-qdrant-mcp CLI mode parsing", () => {
    it("defaults to code-indexer mode", () => {
        expect(readMode([])).toBe("code-indexer");
    });

    it("accepts core and core-http modes", () => {
        expect(readMode(["--mode", "core"])).toBe("core");
        expect(readMode(["--mode=core"])).toBe("core");
        expect(readMode(["--mode", "core-http"])).toBe("core-http");
        expect(readMode(["--mode=core-http"])).toBe("core-http");
    });

    it("rejects unsupported modes", () => {
        expect(() => readMode(["--mode", "unknown"])).toThrow(
            /Unsupported mode/
        );
    });
});
