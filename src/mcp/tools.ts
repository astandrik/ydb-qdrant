import {
    collectionSchema,
    createCollectionSchema,
    deletePointsSchema,
    noArgsSchema,
    retrievePointsSchema,
    searchPointsSchema,
    searchTextSchema,
    upsertPointsSchema,
} from "./schemas.js";
import type { ToolDefinition } from "./types.js";

export const TOOL_NAMES = {
    createCollection: "create_collection",
    deleteCollection: "delete_collection",
    deletePoints: "delete_points",
    getCollection: "get_collection",
    listCollections: "list_collections",
    mcpStatus: "mcp_status",
    retrievePoints: "retrieve_points",
    searchPoints: "search_points",
    searchText: "search_text",
    upsertPoints: "upsert_points",
} as const;

export type ToolCatalogOptions = {
    allowDestructive?: boolean;
    allowWrites?: boolean;
    hasEmbedding?: boolean;
};

export function enabledTools(options: ToolCatalogOptions): ToolDefinition[] {
    const tools: ToolDefinition[] = [
        {
            annotations: {
                openWorldHint: false,
                readOnlyHint: true,
            },
            description:
                "Report the configured MCP namespace and enabled YDB Qdrant MCP capabilities. Does not expose secrets.",
            inputSchema: noArgsSchema(),
            name: TOOL_NAMES.mcpStatus,
            title: "MCP status",
        },
        {
            annotations: {
                openWorldHint: false,
                readOnlyHint: true,
            },
            description:
                "List collections visible in the configured YDB Qdrant MCP namespace.",
            inputSchema: noArgsSchema(),
            name: TOOL_NAMES.listCollections,
            title: "List collections",
        },
        {
            annotations: {
                openWorldHint: false,
                readOnlyHint: true,
            },
            description:
                "Get collection metadata, vector size, distance, type, and point count.",
            inputSchema: collectionSchema(),
            name: TOOL_NAMES.getCollection,
            title: "Get collection",
        },
        {
            annotations: {
                openWorldHint: false,
                readOnlyHint: true,
            },
            description: options.hasEmbedding
                ? "Search a collection with a raw vector. Use search_text when the user gives natural language."
                : "Search a collection with a raw vector.",
            inputSchema: searchPointsSchema(),
            name: TOOL_NAMES.searchPoints,
            title: "Search points",
        },
        {
            annotations: {
                openWorldHint: false,
                readOnlyHint: true,
            },
            description: "Retrieve points by id from a collection.",
            inputSchema: retrievePointsSchema(),
            name: TOOL_NAMES.retrievePoints,
            title: "Retrieve points",
        },
    ];

    if (options.hasEmbedding) {
        tools.push({
            annotations: {
                openWorldHint: false,
                readOnlyHint: true,
            },
            description:
                "Embed a text query with the configured MCP embedding provider, check it matches the collection vector size, and search points.",
            inputSchema: searchTextSchema(),
            name: TOOL_NAMES.searchText,
            title: "Search text",
        });
    }

    if (options.allowWrites) {
        tools.push(
            {
                annotations: {
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                    readOnlyHint: false,
                },
                description:
                    "Create a collection in the configured MCP namespace. Enabled only when YDB_QDRANT_MCP_ENABLE_WRITES=true.",
                inputSchema: createCollectionSchema(),
                name: TOOL_NAMES.createCollection,
                title: "Create collection",
            },
            {
                annotations: {
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                    readOnlyHint: false,
                },
                description:
                    "Upsert points into a collection. Enabled only when YDB_QDRANT_MCP_ENABLE_WRITES=true.",
                inputSchema: upsertPointsSchema(),
                name: TOOL_NAMES.upsertPoints,
                title: "Upsert points",
            }
        );
    }

    if (options.allowDestructive) {
        tools.push(
            {
                annotations: {
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: false,
                    readOnlyHint: false,
                },
                description:
                    "Delete points by ids or supported filter. Enabled only when YDB_QDRANT_MCP_ENABLE_DESTRUCTIVE=true.",
                inputSchema: deletePointsSchema(),
                name: TOOL_NAMES.deletePoints,
                title: "Delete points",
            },
            {
                annotations: {
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: false,
                    readOnlyHint: false,
                },
                description:
                    "Delete a collection in the configured MCP namespace. Enabled only when YDB_QDRANT_MCP_ENABLE_DESTRUCTIVE=true.",
                inputSchema: collectionSchema(),
                name: TOOL_NAMES.deleteCollection,
                title: "Delete collection",
            }
        );
    }

    return tools;
}

export function isToolEnabled(
    name: string,
    options: ToolCatalogOptions
): boolean {
    return enabledTools(options).some((tool) => tool.name === name);
}
