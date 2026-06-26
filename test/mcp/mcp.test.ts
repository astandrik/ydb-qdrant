import { describe, expect, it, vi } from "vitest";

import { YdbQdrantMcpServer } from "../../src/mcp/mcp.js";
import type { YdbQdrantClient } from "../../src/package/api.js";

function makeClient() {
    const createCollection = vi.fn(() => Promise.resolve({ name: "docs" }));
    const deleteCollection = vi.fn(() => Promise.resolve(undefined));
    const deletePoints = vi.fn(() => Promise.resolve({ deleted: 1 }));
    const getCollection = vi.fn(() =>
        Promise.resolve({
            config: {
                params: {
                    vectors: {
                        data_type: "float",
                        distance: "Cosine",
                        size: 2,
                    },
                },
            },
            name: "docs",
            points_count: 3,
            status: "green",
            vectors: {
                data_type: "float",
                distance: "Cosine",
                size: 2,
            },
        })
    );
    const putCollectionIndex = vi.fn(() =>
        Promise.resolve({ operation_id: 0, status: "completed" })
    );
    const retrievePoints = vi.fn(() =>
        Promise.resolve({
            points: [
                {
                    id: "p1",
                    payload: { title: "Doc 1" },
                },
            ],
        })
    );
    const searchPoints = vi.fn(() =>
        Promise.resolve({
            points: [
                {
                    id: "p1",
                    payload: { title: "Doc 1" },
                    score: 0.9,
                },
            ],
        })
    );
    const upsertPoints = vi.fn(() => Promise.resolve({ upserted: 1 }));
    const client: YdbQdrantClient = {
        createCollection,
        deleteCollection,
        deletePoints,
        getCollection,
        putCollectionIndex,
        retrievePoints,
        searchPoints,
        upsertPoints,
    };
    return {
        client,
        createCollection,
        deleteCollection,
        deletePoints,
        getCollection,
        putCollectionIndex,
        retrievePoints,
        searchPoints,
        upsertPoints,
    };
}

function makeServer(options?: {
    allowDestructive?: boolean;
    allowWrites?: boolean;
    embedding?: boolean;
}) {
    const clientMocks = makeClient();
    const { client } = clientMocks;
    const listCollections = vi.fn(() =>
        Promise.resolve([
            {
                distance: "Cosine",
                name: "docs",
                pointsCount: 3,
                vectorSize: 2,
                vectorType: "float",
            },
        ])
    );
    const embedQuery = vi.fn(() => Promise.resolve([0.1, 0.2]));
    const server = new YdbQdrantMcpServer({
        allowDestructive: options?.allowDestructive ?? false,
        allowWrites: options?.allowWrites ?? false,
        client,
        embeddingProvider: options?.embedding
            ? {
                  dimension: 2,
                  embedQuery,
              }
            : undefined,
        listCollections,
        userUid: "tenant_a",
    });
    return { ...clientMocks, embedQuery, listCollections, server };
}

async function call(server: YdbQdrantMcpServer, params: unknown) {
    return await server.handleJsonRpcMessage(JSON.stringify(params));
}

describe("YDB Qdrant MCP server", () => {
    it("responds to initialize and lists only enabled tools", async () => {
        const { server } = makeServer();

        const init = await call(server, {
            id: 1,
            jsonrpc: "2.0",
            method: "initialize",
        });
        expect(init).toMatchObject({
            id: 1,
            jsonrpc: "2.0",
            result: {
                capabilities: { tools: {} },
                protocolVersion: "2025-11-25",
                serverInfo: {
                    name: "ydb-qdrant",
                },
            },
        });

        const tools = await call(server, {
            id: 2,
            jsonrpc: "2.0",
            method: "tools/list",
        });
        expect(
            (tools?.result as { tools: Array<{ name: string }> }).tools.map(
                (tool) => tool.name
            )
        ).toEqual([
            "mcp_status",
            "list_collections",
            "get_collection",
            "search_points",
            "retrieve_points",
        ]);
        expect(JSON.stringify(tools)).not.toContain("search_text");
        expect(JSON.stringify(tools)).not.toContain("delete_collection");
    });

    it("adds text search and gated write tools only when configured", async () => {
        const { server } = makeServer({
            allowDestructive: true,
            allowWrites: true,
            embedding: true,
        });

        const tools = await call(server, {
            id: "tools",
            jsonrpc: "2.0",
            method: "tools/list",
        });

        expect(
            (tools?.result as { tools: Array<{ name: string }> }).tools.map(
                (tool) => tool.name
            )
        ).toEqual([
            "mcp_status",
            "list_collections",
            "get_collection",
            "search_points",
            "retrieve_points",
            "search_text",
            "create_collection",
            "upsert_points",
            "delete_points",
            "delete_collection",
        ]);
        const deleteTool = (
            tools?.result as {
                tools: Array<{
                    annotations?: { destructiveHint?: boolean };
                    inputSchema?: {
                        properties?: Record<string, unknown>;
                    };
                    name: string;
                }>;
            }
        ).tools.find((tool) => tool.name === "delete_collection");
        expect(deleteTool?.annotations?.destructiveHint).toBe(true);
        const toolSchemas = (
            tools?.result as {
                tools: Array<{
                    inputSchema?: {
                        properties?: Record<string, unknown>;
                    };
                    name: string;
                }>;
            }
        ).tools;
        expect(
            (
                toolSchemas.find((tool) => tool.name === "search_points")
                    ?.inputSchema?.properties?.top as { type?: string }
            ).type
        ).toBe("integer");
        expect(
            (
                toolSchemas.find((tool) => tool.name === "search_text")
                    ?.inputSchema?.properties?.top as { type?: string }
            ).type
        ).toBe("integer");
        expect(
            (
                (
                    toolSchemas.find((tool) => tool.name === "create_collection")
                        ?.inputSchema?.properties?.vectors as {
                        properties?: Record<string, unknown>;
                    }
                ).properties?.size as { type?: string }
            ).type
        ).toBe("integer");
    });

    it("searches by raw vector and returns MCP content plus structuredContent", async () => {
        const { searchPoints, server } = makeServer();

        const result = await call(server, {
            id: "search",
            jsonrpc: "2.0",
            method: "tools/call",
            params: {
                arguments: {
                    collection: "docs",
                    top: 5,
                    vector: [0.1, 0.2],
                    with_payload: true,
                },
                name: "search_points",
            },
        });

        expect(searchPoints).toHaveBeenCalledWith("docs", {
            top: 5,
            vector: [0.1, 0.2],
            with_payload: true,
        });
        expect(result).toMatchObject({
            id: "search",
            jsonrpc: "2.0",
            result: {
                content: [{ type: "text" }],
                structuredContent: {
                    collection: "docs",
                    points: [{ id: "p1", score: 0.9 }],
                },
            },
        });
    });

    it("embeds text queries after checking collection dimension", async () => {
        const { embedQuery, getCollection, searchPoints, server } = makeServer({
            embedding: true,
        });

        const result = await call(server, {
            id: "text",
            jsonrpc: "2.0",
            method: "tools/call",
            params: {
                arguments: {
                    collection: "docs",
                    query: "find docs",
                    top: 3,
                    with_payload: true,
                },
                name: "search_text",
            },
        });

        expect(getCollection).toHaveBeenCalledWith("docs");
        expect(embedQuery).toHaveBeenCalledWith("find docs");
        expect(searchPoints).toHaveBeenCalledWith("docs", {
            top: 3,
            vector: [0.1, 0.2],
            with_payload: true,
        });
        expect(result).toMatchObject({
            result: {
                structuredContent: {
                    collection: "docs",
                    query: "find docs",
                },
            },
        });
    });

    it("returns protocol errors for malformed requests and disabled tools", async () => {
        const { server } = makeServer();

        await expect(server.handleJsonRpcMessage("{")).resolves.toMatchObject({
            error: { code: -32700 },
            id: null,
        });
        await expect(
            call(server, {
                id: 1,
                jsonrpc: "2.0",
                method: "unknown",
            })
        ).resolves.toMatchObject({
            error: { code: -32601 },
            id: 1,
        });
        await expect(
            call(server, {
                id: "disabled",
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    arguments: {
                        collection: "docs",
                    },
                    name: "delete_collection",
                },
            })
        ).resolves.toMatchObject({
            error: {
                code: -32602,
                message: "Unknown tool: delete_collection",
            },
            id: "disabled",
        });
    });
});
