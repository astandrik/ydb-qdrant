import { describe, expect, it } from "vitest";

import {
    createYdbQdrantMcpEmbeddingProviderFromConfig,
    loadYdbQdrantMcpConfig,
} from "../../src/mcp/config.js";
import { deriveUserUidFromApiKey } from "../../src/utils/tenant.js";

describe("YDB Qdrant MCP config", () => {
    it("requires exactly one MCP API identity", () => {
        expect(() => loadYdbQdrantMcpConfig({})).toThrow(
            "requires exactly one of YDB_QDRANT_MCP_API_KEY or YDB_QDRANT_MCP_USER_UID"
        );
        expect(() =>
            loadYdbQdrantMcpConfig({
                YDB_QDRANT_MCP_API_KEY: "key",
                YDB_QDRANT_MCP_USER_UID: "user",
            })
        ).toThrow(
            "requires exactly one of YDB_QDRANT_MCP_API_KEY or YDB_QDRANT_MCP_USER_UID"
        );
    });

    it("derives single-tenant identity and feature flags from YDB_QDRANT_MCP env", () => {
        const config = loadYdbQdrantMcpConfig(
            {
                YDB_QDRANT_MCP_ALLOWED_ORIGINS:
                    "https://agent.example, https://codex.example",
                YDB_QDRANT_MCP_API_KEY: "test-api-key",
                YDB_QDRANT_MCP_BEARER_TOKEN: "hosted-token",
                YDB_QDRANT_MCP_ENABLE_DESTRUCTIVE: "true",
                YDB_QDRANT_MCP_ENABLE_WRITES: "yes",
                YDB_QDRANT_MCP_EMBEDDING_DIMENSION: "16",
                YDB_QDRANT_MCP_EMBEDDING_PROVIDER: "hash",
                YDB_QDRANT_MCP_PORT: "9099",
            },
            { requireBearerToken: true }
        );

        expect(config).toMatchObject({
            allowDestructive: true,
            allowWrites: true,
            allowedOrigins: ["https://agent.example", "https://codex.example"],
            bearerToken: "hosted-token",
            embedding: {
                dimension: 16,
                provider: "hash",
            },
            identity: {
                apiKey: "test-api-key",
                userUid: deriveUserUidFromApiKey("test-api-key"),
            },
            port: 9099,
        });
    });

    it("validates hosted bearer token and ignores CODE_INDEXER embedding env", () => {
        expect(() =>
            loadYdbQdrantMcpConfig(
                {
                    YDB_QDRANT_MCP_USER_UID: "tenant_a",
                },
                { requireBearerToken: true }
            )
        ).toThrow("YDB_QDRANT_MCP_BEARER_TOKEN is required");

        const config = loadYdbQdrantMcpConfig({
            CODE_INDEXER_EMBEDDING_PROVIDER: "hash",
            CODE_INDEXER_EMBEDDING_DIMENSION: "8",
            YDB_QDRANT_MCP_USER_UID: "tenant_a",
        });

        expect(config.embedding).toBeUndefined();
    });

    it("creates configured MCP embedding providers", async () => {
        const provider = createYdbQdrantMcpEmbeddingProviderFromConfig({
            dimension: 8,
            provider: "hash",
        });

        const embedding = await provider.embedQuery("hello world");

        expect(provider.dimension).toBe(8);
        expect(embedding).toHaveLength(8);
    });
});
