import { describe, expect, it } from "vitest";

import packageJson from "../../package.json" with { type: "json" };

describe("YDB Qdrant MCP package scripts", () => {
    it("exposes stdio and hosted HTTP entrypoints", () => {
        expect(packageJson.scripts).toMatchObject({
            "mcp:ydb-qdrant":
                "node --experimental-specifier-resolution=node --enable-source-maps dist/mcp/stdioServer.js",
            "start:mcp:ydb-qdrant":
                "node --experimental-specifier-resolution=node --enable-source-maps dist/mcp/httpServer.js",
        });
    });
});
