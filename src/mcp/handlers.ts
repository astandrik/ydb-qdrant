import {
    argumentsObject,
    readIdArray,
    readNumberArray,
    readOptionalBoolean,
    readString,
    readTop,
} from "./args.js";
import { McpProtocolError, isRecord } from "./protocol.js";
import {
    collectionSummaryText,
    pointsText,
    toolErrorResult,
    toolResult,
} from "./results.js";
import {
    TOOL_NAMES,
    enabledTools,
    isToolEnabled,
    type ToolCatalogOptions,
} from "./tools.js";
import type { YdbQdrantMcpDeps } from "./types.js";

function catalogOptions(deps: YdbQdrantMcpDeps): ToolCatalogOptions {
    return {
        allowDestructive: deps.allowDestructive,
        allowWrites: deps.allowWrites,
        hasEmbedding: deps.embeddingProvider !== undefined,
    };
}

export async function callYdbQdrantTool(
    deps: YdbQdrantMcpDeps,
    params: unknown
): Promise<unknown> {
    if (!isRecord(params) || typeof params.name !== "string") {
        throw new McpProtocolError(
            -32602,
            `Unknown tool: ${isRecord(params) ? String(params.name) : ""}`
        );
    }
    if (!isToolEnabled(params.name, catalogOptions(deps))) {
        throw new McpProtocolError(-32602, `Unknown tool: ${params.name}`);
    }

    try {
        switch (params.name) {
            case TOOL_NAMES.mcpStatus:
                return mcpStatusResult(deps);
            case TOOL_NAMES.listCollections:
                return await listCollectionsResult(deps);
            case TOOL_NAMES.getCollection:
                return await getCollectionResult(deps, params.arguments);
            case TOOL_NAMES.searchPoints:
                return await searchPointsResult(deps, params.arguments);
            case TOOL_NAMES.retrievePoints:
                return await retrievePointsResult(deps, params.arguments);
            case TOOL_NAMES.searchText:
                return await searchTextResult(deps, params.arguments);
            case TOOL_NAMES.createCollection:
                return await createCollectionResult(deps, params.arguments);
            case TOOL_NAMES.upsertPoints:
                return await upsertPointsResult(deps, params.arguments);
            case TOOL_NAMES.deletePoints:
                return await deletePointsResult(deps, params.arguments);
            case TOOL_NAMES.deleteCollection:
                return await deleteCollectionResult(deps, params.arguments);
            default:
                throw new McpProtocolError(
                    -32602,
                    `Unknown tool: ${params.name}`
                );
        }
    } catch (err: unknown) {
        if (err instanceof McpProtocolError) {
            throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        return toolErrorResult(message);
    }
}

function mcpStatusResult(deps: YdbQdrantMcpDeps): unknown {
    const structuredContent = {
        allowDestructive: deps.allowDestructive === true,
        allowWrites: deps.allowWrites === true,
        textSearchAvailable: deps.embeddingProvider !== undefined,
        toolCount: enabledTools(catalogOptions(deps)).length,
        userUid: deps.userUid,
    };
    return toolResult(
        `YDB Qdrant MCP namespace ${deps.userUid}; tools=${structuredContent.toolCount}`,
        structuredContent
    );
}

async function listCollectionsResult(
    deps: YdbQdrantMcpDeps
): Promise<unknown> {
    const collections = await deps.listCollections({
        userUid: deps.userUid,
    });
    return toolResult(collectionSummaryText(collections), { collections });
}

async function getCollectionResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const result = await deps.client.getCollection(collection);
    return toolResult(`${collection}: ${result.points_count} points`, {
        collection,
        result,
    });
}

async function searchPointsResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const vector = readNumberArray(input, "vector");
    const top = readTop(input);
    const withPayload = readOptionalBoolean(input, "with_payload");
    const body = {
        top,
        vector,
        ...(withPayload === undefined ? {} : { with_payload: withPayload }),
    };
    const result = await deps.client.searchPoints(collection, body);
    return toolResult(pointsText(collection, result.points), {
        collection,
        points: result.points,
    });
}

async function searchTextResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const embeddingProvider = deps.embeddingProvider;
    if (!embeddingProvider) {
        throw new McpProtocolError(-32602, "Unknown tool: search_text");
    }

    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const query = readString(input, "query");
    const top = readTop(input);
    const withPayload = readOptionalBoolean(input, "with_payload");
    const collectionMeta = await deps.client.getCollection(collection);
    const vectorSize = collectionMeta.vectors.size;
    if (embeddingProvider.dimension !== vectorSize) {
        throw new Error(
            `embedding dimension ${embeddingProvider.dimension} does not match collection vector size ${vectorSize}`
        );
    }
    const vector = await embeddingProvider.embedQuery(query);
    if (vector.length !== vectorSize) {
        throw new Error(
            `embedded query vector length ${vector.length} does not match collection vector size ${vectorSize}`
        );
    }
    const body = {
        top,
        vector,
        ...(withPayload === undefined ? {} : { with_payload: withPayload }),
    };
    const result = await deps.client.searchPoints(collection, body);
    return toolResult(pointsText(collection, result.points), {
        collection,
        points: result.points,
        query,
    });
}

async function retrievePointsResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const ids = readIdArray(input, "ids");
    const withPayload = readOptionalBoolean(input, "with_payload");
    const withVector = readOptionalBoolean(input, "with_vector");
    const result = await deps.client.retrievePoints(collection, {
        ids,
        ...(withPayload === undefined ? {} : { with_payload: withPayload }),
        ...(withVector === undefined ? {} : { with_vector: withVector }),
    });
    return toolResult(pointsText(collection, result.points), {
        collection,
        points: result.points,
    });
}

async function createCollectionResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const vectors = input.vectors;
    if (!isRecord(vectors)) {
        throw new Error("vectors is required");
    }
    const result = await deps.client.createCollection(collection, {
        vectors,
    });
    return toolResult(`${collection}: collection created`, {
        collection,
        result,
    });
}

async function upsertPointsResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const points = input.points;
    if (!Array.isArray(points) || points.length === 0) {
        throw new Error("points must be a non-empty array");
    }
    const result = await deps.client.upsertPoints(collection, {
        points,
    });
    return toolResult(`${collection}: upserted ${result.upserted} points`, {
        collection,
        result,
    });
}

async function deletePointsResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const body: Record<string, unknown> = {};
    if (input.points !== undefined) {
        body.points = readIdArray(input, "points");
    } else if (input.filter !== undefined) {
        body.filter = input.filter;
    } else {
        throw new Error("points or filter is required");
    }
    const result = await deps.client.deletePoints(collection, body);
    return toolResult(`${collection}: deleted ${result.deleted} points`, {
        collection,
        result,
    });
}

async function deleteCollectionResult(
    deps: YdbQdrantMcpDeps,
    args: unknown
): Promise<unknown> {
    const input = argumentsObject(args);
    const collection = readString(input, "collection");
    const result = await deps.client.deleteCollection(collection);
    return toolResult(`${collection}: collection deleted`, {
        collection,
        result,
    });
}
