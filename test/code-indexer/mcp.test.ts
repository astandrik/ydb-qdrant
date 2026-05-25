import { describe, expect, it, vi } from "vitest";

import { CodeIndexerMcpServer } from "../../src/code-indexer/mcp.js";
import type {
    CodeIndexStore,
    EmbeddingProvider,
} from "../../src/code-indexer/types.js";

function makeServer() {
    const search = vi.fn(() =>
        Promise.resolve([
            {
                id: "point-1",
                payload: {
                    endLine: 4,
                    path: "src/server.ts",
                    startLine: 2,
                    text: "function buildServer() {}",
                },
                score: 0.9,
            },
        ])
    );
    const embeddingProvider: EmbeddingProvider = {
        dimension: 2,
        embedDocuments: vi.fn(),
        embedQuery: vi.fn(() => Promise.resolve([0.1, 0.2])),
    };
    const store: CodeIndexStore = {
        deleteCollection: vi.fn(),
        deletePath: vi.fn(),
        ensureCollection: vi.fn(),
        resetCollection: vi.fn(),
        search,
        upsertChunks: vi.fn(),
    };
    return {
        embeddingProvider,
        search,
        server: new CodeIndexerMcpServer({ embeddingProvider, store }),
        store,
    };
}

describe("code-indexer MCP server", () => {
    it("responds to initialize and tools/list", async () => {
        const { server } = makeServer();

        const init = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "initialize",
            })
        );
        expect(init).toMatchObject({
            id: 1,
            jsonrpc: "2.0",
            result: {
                protocolVersion: "2025-11-25",
                serverInfo: {
                    name: "ydb-qdrant-code-indexer",
                },
            },
        });

        const tools = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: 2,
                jsonrpc: "2.0",
                method: "tools/list",
            })
        );
        expect(tools).toMatchObject({
            id: 2,
            jsonrpc: "2.0",
            result: {
                tools: [
                    {
                        name: "search_code",
                    },
                ],
            },
        });
    });

    it("calls the search_code tool and returns MCP content plus structuredContent", async () => {
        const { search, server } = makeServer();

        const result = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "call-1",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        installationId: 7,
                        query: "build server",
                        repoId: 42,
                        top: 5,
                    },
                    name: "search_code",
                },
            })
        );

        expect(search).toHaveBeenCalledWith({
            collection: "gh_repo_42_default",
            queryVector: [0.1, 0.2],
            top: 5,
            userUid: "gh_installation_7",
        });
        expect(result).toMatchObject({
            id: "call-1",
            jsonrpc: "2.0",
            result: {
                content: [
                    {
                        type: "text",
                    },
                ],
                structuredContent: {
                    collection: "gh_repo_42_default",
                    points: [
                        {
                            id: "point-1",
                        },
                    ],
                },
            },
        });
    });

    it("resolves owner and repo tool input through the access context", async () => {
        const { search, store, embeddingProvider } = makeServer();
        const resolveRepository = vi.fn(() =>
            Promise.resolve({
                installationId: 7,
                repoId: 42,
            })
        );
        const server = new CodeIndexerMcpServer({
            embeddingProvider,
            repositoryResolver: { resolveRepository },
            store,
        });

        const result = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "call-by-name",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        owner: "octo",
                        query: "build server",
                        repo: "demo",
                    },
                    name: "search_code",
                },
            }),
            { githubUserId: "123" }
        );

        expect(resolveRepository).toHaveBeenCalledWith({
            githubUserId: "123",
            owner: "octo",
            repo: "demo",
        });
        expect(search).toHaveBeenCalledWith({
            collection: "gh_repo_42_default",
            queryVector: [0.1, 0.2],
            top: 10,
            userUid: "gh_installation_7",
        });
        expect(result).toMatchObject({
            id: "call-by-name",
            jsonrpc: "2.0",
            result: {
                structuredContent: {
                    collection: "gh_repo_42_default",
                },
            },
        });
    });

    it("returns protocol errors for malformed JSON-RPC requests", async () => {
        const { server } = makeServer();

        await expect(server.handleJsonRpcMessage("{")).resolves.toMatchObject({
            error: {
                code: -32700,
            },
            id: null,
            jsonrpc: "2.0",
        });
        await expect(
            server.handleJsonRpcMessage(
                JSON.stringify({
                    id: 1,
                    jsonrpc: "2.0",
                    method: "unknown",
                })
            )
        ).resolves.toMatchObject({
            error: {
                code: -32601,
            },
            id: 1,
            jsonrpc: "2.0",
        });
        await expect(
            server.handleJsonRpcMessage(
                JSON.stringify({
                    id: 2,
                    jsonrpc: "2.0",
                    method: "tools/call",
                    params: {
                        arguments: {
                            repoId: 42,
                        },
                        name: "search_code",
                    },
                })
            )
        ).resolves.toMatchObject({
            error: {
                code: -32602,
            },
            id: 2,
            jsonrpc: "2.0",
        });
    });
});
