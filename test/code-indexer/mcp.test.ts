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
        countCollection: vi.fn(),
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
        });
        const toolNames = (
            tools.result as { tools: Array<{ name: string }> }
        ).tools.map((tool) => tool.name);
        expect(toolNames).toEqual(["search_code"]);
    });

    it("lists repositories available to the authenticated MCP token", async () => {
        const { embeddingProvider, store } = makeServer();
        const repositoryCatalog = {
            listRepositories: vi.fn(() =>
                Promise.resolve([
                    {
                        chunkCount: 909,
                        defaultBranch: "main",
                        installationId: 777,
                        lastIndexedAt: "2026-05-25T13:58:00.000Z",
                        lastIndexedSha: "abc123",
                        owner: "astandrik",
                        repo: "local-ydb-toolkit",
                        repoId: 456,
                        status: "ready",
                    },
                ])
            ),
            listRepositoryIndexes: vi.fn(),
        };
        const server = new CodeIndexerMcpServer({
            embeddingProvider,
            repositoryCatalog,
            store,
        } as never);

        const init = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "init",
                jsonrpc: "2.0",
                method: "initialize",
            }),
            { githubUserId: "123" }
        );
        const instructions = (
            init?.result as { instructions?: string } | undefined
        )?.instructions;
        expect(instructions).toContain("git remote");
        expect(instructions).toContain("default branch");
        expect(instructions).toContain("prNumber");

        const result = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "repos",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {},
                    name: "list_repositories",
                },
            }),
            { githubUserId: "123" }
        );

        expect(repositoryCatalog.listRepositories).toHaveBeenCalledWith({
            githubUserId: "123",
        });
        expect(result).toMatchObject({
            id: "repos",
            jsonrpc: "2.0",
            result: {
                content: [
                    {
                        type: "text",
                    },
                ],
                structuredContent: {
                    repositories: [
                        {
                            defaultBranch: "main",
                            owner: "astandrik",
                            repo: "local-ydb-toolkit",
                            status: "ready",
                        },
                    ],
                },
            },
        });
        expect(JSON.stringify(result)).toContain("astandrik/local-ydb-toolkit");
    });

    it("lists branch and pull request indexes for an accessible repository", async () => {
        const { embeddingProvider, store } = makeServer();
        const repositoryCatalog = {
            listRepositories: vi.fn(),
            listRepositoryIndexes: vi.fn(() =>
                Promise.resolve({
                    defaultBranch: {
                        branch: "main",
                        chunkCount: 909,
                        collection: "gh_repo_456_default",
                        lastIndexedAt: "2026-05-25T13:58:00.000Z",
                        lastIndexedSha: "abc123",
                        status: "ready",
                    },
                    installationId: 777,
                    owner: "astandrik",
                    pullRequests: [
                        {
                            collection: "gh_repo_456_pr_71",
                            jobId: "delivery:job",
                            phase: "completed",
                            prNumber: 71,
                            status: "ready",
                            updatedAt: "2026-05-25T14:01:00.000Z",
                        },
                    ],
                    repo: "local-ydb-toolkit",
                    repoId: 456,
                })
            ),
        };
        const server = new CodeIndexerMcpServer({
            embeddingProvider,
            repositoryCatalog,
            store,
        } as never);

        const result = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "indexes",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        owner: "astandrik",
                        repo: "local-ydb-toolkit",
                    },
                    name: "list_repository_indexes",
                },
            }),
            { githubUserId: "123" }
        );

        expect(repositoryCatalog.listRepositoryIndexes).toHaveBeenCalledWith({
            githubUserId: "123",
            owner: "astandrik",
            repo: "local-ydb-toolkit",
        });
        expect(result).toMatchObject({
            id: "indexes",
            jsonrpc: "2.0",
            result: {
                content: [
                    {
                        type: "text",
                    },
                ],
                structuredContent: {
                    repository: {
                        defaultBranch: {
                            collection: "gh_repo_456_default",
                        },
                        pullRequests: [
                            {
                                collection: "gh_repo_456_pr_71",
                                prNumber: 71,
                                status: "ready",
                            },
                        ],
                    },
                },
            },
        });
        expect(JSON.stringify(result)).toContain("Pull request #71");
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

    it("exposes local repository indexing tools when local indexing is configured", async () => {
        const { embeddingProvider, store } = makeServer();
        const localIndexer = {
            getIndexStatus: vi.fn(() =>
                Promise.resolve({
                    indexes: [
                        {
                            collection: "gh_repo_4242_default",
                            installationId: 9001,
                            owner: "local",
                            repo: "demo",
                            repoId: 4242,
                            root: "/workspace/demo",
                            status: "ready",
                        },
                    ],
                })
            ),
            indexRepository: vi.fn(() =>
                Promise.resolve({
                    chunkCount: 3,
                    collection: "gh_repo_4242_default",
                    installationId: 9001,
                    owner: "local",
                    repo: "demo",
                    repoId: 4242,
                    root: "/workspace/demo",
                    status: "ready",
                })
            ),
            listRepositoryIndexes: vi.fn(() =>
                Promise.resolve({
                    defaultBranch: {
                        branch: "local",
                        chunkCount: 3,
                        collection: "gh_repo_4242_default",
                        status: "ready",
                    },
                    installationId: 9001,
                    owner: "local",
                    pullRequests: [],
                    repo: "demo",
                    repoId: 4242,
                })
            ),
        };
        const server = new CodeIndexerMcpServer({
            embeddingProvider,
            localIndexer,
            store,
        } as never);

        const tools = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "tools",
                jsonrpc: "2.0",
                method: "tools/list",
            })
        );

        expect(
            (tools?.result as { tools: Array<{ name: string }> }).tools.map(
                (tool) => tool.name
            )
        ).toEqual([
            "index_repository",
            "get_index_status",
            "list_repository_indexes",
            "search_code",
        ]);

        const indexed = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "index",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        root: "/workspace/demo",
                    },
                    name: "index_repository",
                },
            })
        );

        expect(localIndexer.indexRepository).toHaveBeenCalledWith({
            root: "/workspace/demo",
        });
        expect(indexed).toMatchObject({
            id: "index",
            result: {
                structuredContent: {
                    index: {
                        collection: "gh_repo_4242_default",
                        status: "ready",
                    },
                },
            },
        });

        const status = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "status",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        root: "/workspace/demo",
                    },
                    name: "get_index_status",
                },
            })
        );

        expect(localIndexer.getIndexStatus).toHaveBeenCalledWith({
            root: "/workspace/demo",
        });
        expect(status).toMatchObject({
            id: "status",
            result: {
                structuredContent: {
                    indexes: [
                        {
                            collection: "gh_repo_4242_default",
                            status: "ready",
                        },
                    ],
                },
            },
        });
    });

    it("describes the hosted MCP agent workflow in tools/list", async () => {
        const { embeddingProvider, store } = makeServer();
        const server = new CodeIndexerMcpServer({
            embeddingProvider,
            repositoryCatalog: {
                listRepositories: vi.fn(),
                listRepositoryIndexes: vi.fn(),
            },
            store,
        } as never);

        const tools = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "tools",
                jsonrpc: "2.0",
                method: "tools/list",
            }),
            { githubUserId: "123" }
        );

        const descriptions = (
            tools?.result as {
                tools: Array<{ description: string; name: string }>;
            }
        ).tools.reduce<Record<string, string>>((acc, tool) => {
            acc[tool.name] = tool.description;
            return acc;
        }, {});
        expect(descriptions.list_repositories).toContain("token can search");
        expect(descriptions.list_repository_indexes).toContain("PR-scoped");
        expect(descriptions.search_code).toContain("git remote");
        expect(descriptions.search_code).toContain("prNumber");
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

    it("rejects invalid owner and repo search bounds before resolving", async () => {
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

        const badPrNumber = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "bad-pr",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        owner: "octo",
                        prNumber: -7,
                        query: "build server",
                        repo: "demo",
                    },
                    name: "search_code",
                },
            }),
            { githubUserId: "123" }
        );
        const badTop = await server.handleJsonRpcMessage(
            JSON.stringify({
                id: "bad-top",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        owner: "octo",
                        query: "build server",
                        repo: "demo",
                        top: 1001,
                    },
                    name: "search_code",
                },
            }),
            { githubUserId: "123" }
        );

        expect(badPrNumber).toMatchObject({
            error: { message: "prNumber must be a positive integer" },
            id: "bad-pr",
        });
        expect(badTop).toMatchObject({
            error: {
                message: "top must be a positive integer no greater than 1000",
            },
            id: "bad-top",
        });
        expect(resolveRepository).not.toHaveBeenCalled();
        expect(search).not.toHaveBeenCalled();
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
