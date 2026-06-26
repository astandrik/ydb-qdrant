import { describe, expect, it } from "vitest";

import packageJson from "../../package.json" with { type: "json" };

describe("YDB Qdrant MCP package scripts", () => {
    it("exposes stdio and hosted HTTP entrypoints", () => {
        expect(packageJson.scripts).toMatchObject({
            "mcp:ydb-qdrant":
                "node --experimental-specifier-resolution=node --enable-source-maps dist/mcp/stdioServer.js",
            "start:mcp:ydb-qdrant":
                "node --experimental-specifier-resolution=node --enable-source-maps dist/mcp/httpServerCli.js",
        });
    });

    it("keeps the hosted HTTP package export side-effect free", async () => {
        await expect(import("../../src/mcp/httpServer.js")).resolves.toHaveProperty(
            "startYdbQdrantMcpHttpServer"
        );
    });
});
