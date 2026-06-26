import type { YdbQdrantClient } from "../package/api.js";

export type ToolDefinition = {
    annotations?: {
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
        readOnlyHint?: boolean;
    };
    description: string;
    inputSchema: Record<string, unknown>;
    name: string;
    title: string;
};

export type YdbQdrantMcpEmbeddingProvider = {
    readonly dimension: number;
    embedQuery(query: string): Promise<number[]>;
};

export type YdbQdrantMcpCollectionSummary = {
    distance: string;
    lastAccessedAt?: string;
    name: string;
    pointsCount?: number;
    vectorSize: number;
    vectorType: string;
};

export type YdbQdrantMcpDeps = {
    allowDestructive?: boolean;
    allowWrites?: boolean;
    client: YdbQdrantClient;
    embeddingProvider?: YdbQdrantMcpEmbeddingProvider;
    listCollections(params: {
        userUid: string;
    }): Promise<YdbQdrantMcpCollectionSummary[]>;
    userUid: string;
};
