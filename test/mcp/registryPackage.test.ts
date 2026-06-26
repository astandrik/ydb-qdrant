import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readJson<T>(path: string): Promise<T> {
    return JSON.parse(await readFile(join(root, path), "utf8")) as T;
}

describe("YDB Qdrant MCP npm package and registry metadata", () => {
    it("declares an MCP package with a single CLI bin and root exports", async () => {
        const rootPackage = await readJson<{
            exports?: Record<string, string>;
            version?: string;
        }>("package.json");
        const mcpPackage = await readJson<{
            bin?: Record<string, string>;
            dependencies?: Record<string, string>;
            files?: string[];
            mcpName?: string;
            name?: string;
            scripts?: Record<string, string>;
            version?: string;
        }>("packages/ydb-qdrant-mcp/package.json");

        expect(rootPackage.exports).toMatchObject({
            "./code-indexer/mcp-package":
                "./dist/code-indexer/mcpPackageServer.js",
            "./mcp/config": "./dist/mcp/config.js",
            "./mcp/http-server": "./dist/mcp/httpServer.js",
            "./mcp/stdio": "./dist/mcp/stdio.js",
        });
        expect(mcpPackage.name).toBe("@astandrik/ydb-qdrant-mcp");
        expect(rootPackage.version).toBe("9.2.0");
        expect(mcpPackage.version).toBe("9.2.0");
        expect(mcpPackage.dependencies?.["ydb-qdrant"]).toBe("^9.2.0");
        expect(mcpPackage.mcpName).toBe("io.github.astandrik/ydb-qdrant-mcp");
        expect(mcpPackage.bin).toEqual({
            "ydb-qdrant-mcp": "./dist/index.js",
        });
        expect(mcpPackage.files).toEqual(["dist", "README.md"]);
        expect(mcpPackage.scripts?.prepack).toBe("npm run build");
    });

    it("describes npm stdio and hosted remote transports in server.json", async () => {
        const server = await readJson<{
            $schema?: string;
            name?: string;
            packages?: Array<{
                environmentVariables?: Array<{
                    isRequired?: boolean;
                    isSecret?: boolean;
                    name: string;
                }>;
                identifier?: string;
                registryType?: string;
                runtimeArguments?: Array<{ name?: string; type: string }>;
                runtimeHint?: string;
                transport?: { type?: string };
            }>;
            remotes?: Array<{
                headers?: Array<{ isRequired?: boolean; isSecret?: boolean; name: string }>;
                type?: string;
                url?: string;
            }>;
            version?: string;
        }>("registry/ydb-qdrant-mcp/server.json");

        expect(server.$schema).toBe(
            "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"
        );
        expect(server.name).toBe("io.github.astandrik/ydb-qdrant-mcp");
        expect(server.version).toBe("9.2.0");
        expect(server.packages?.[0]).toMatchObject({
            identifier: "@astandrik/ydb-qdrant-mcp",
            registryType: "npm",
            runtimeHint: "npx",
            transport: { type: "stdio" },
            version: "9.2.0",
        });
        expect(server.packages?.[0]?.runtimeArguments).toEqual([
            { name: "-y", type: "named" },
            { name: "--prefer-online", type: "named" },
        ]);
        expect(
            server.packages?.[0]?.environmentVariables?.map((item) => item.name)
        ).toEqual(
            expect.arrayContaining([
                "YDB_QDRANT_ENDPOINT",
                "YDB_QDRANT_DATABASE",
                "YDB_QDRANT_MCP_WORKSPACE_ROOT",
                "YDB_QDRANT_MCP_LOCAL_NAMESPACE",
                "CODE_INDEXER_EMBEDDING_PROVIDER",
            ])
        );
        expect(
            server.packages?.[0]?.environmentVariables?.find(
                (item) => item.name === "YDB_QDRANT_MCP_API_KEY"
            )
        ).toMatchObject({ isSecret: true });
        expect(server.remotes?.[0]).toMatchObject({
            type: "streamable-http",
            url: "https://code-indexer.ydb-qdrant.tech/mcp",
        });
        expect(server.remotes?.[0]?.headers).toEqual([
            expect.objectContaining({
                isRequired: true,
                isSecret: true,
                name: "Authorization",
            }),
        ]);
    });
});
