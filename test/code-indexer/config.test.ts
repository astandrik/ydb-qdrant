import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setRequiredEnv(): void {
    process.env.GITHUB_APP_ID = "123";
    process.env.GITHUB_PRIVATE_KEY = "private\\nkey";
    process.env.GITHUB_WEBHOOK_SECRET = "secret";
}

async function loadConfigModule() {
    vi.resetModules();
    return await import("../../src/code-indexer/config.js");
}

describe("code-indexer config", () => {
    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
        vi.resetModules();
    });

    it("parses chunker mode and max chunk chars", async () => {
        process.env = { ...ORIGINAL_ENV };
        setRequiredEnv();
        process.env.CODE_INDEXER_CHUNKER = "tree-sitter";
        process.env.CODE_INDEXER_MAX_CHUNK_CHARS = "4096";
        const { loadCodeIndexerConfig } = await loadConfigModule();

        expect(loadCodeIndexerConfig()).toMatchObject({
            chunkerMode: "tree-sitter",
            maxChunkChars: 4096,
        });
    });

    it("defaults to auto chunking and rejects invalid chunker mode", async () => {
        process.env = { ...ORIGINAL_ENV };
        setRequiredEnv();
        const { loadCodeIndexerConfig } = await loadConfigModule();
        expect(loadCodeIndexerConfig()).toMatchObject({
            chunkerMode: "auto",
            maxChunkChars: 8000,
        });

        process.env.CODE_INDEXER_CHUNKER = "semantic";
        expect(() => loadCodeIndexerConfig()).toThrow(
            "CODE_INDEXER_CHUNKER must be one of: auto, line-window, tree-sitter"
        );
    });

    it("parses OpenAI embedding defaults and API key precedence", async () => {
        process.env = { ...ORIGINAL_ENV };
        setRequiredEnv();
        process.env.CODE_INDEXER_EMBEDDING_PROVIDER = "openai";
        process.env.CODE_INDEXER_EMBEDDING_API_KEY = "fallback-key";
        process.env.OPENAI_API_KEY = "openai-key";
        const { loadCodeIndexerConfig } = await loadConfigModule();

        expect(loadCodeIndexerConfig()).toMatchObject({
            embeddingApiKey: "openai-key",
            embeddingDimension: 1536,
            embeddingDimensionExplicit: false,
            embeddingModel: "text-embedding-3-small",
            embeddingProvider: "openai",
        });
    });

    it("uses CODE_INDEXER_EMBEDDING_API_KEY as the OpenAI fallback key", async () => {
        process.env = { ...ORIGINAL_ENV };
        setRequiredEnv();
        process.env.CODE_INDEXER_EMBEDDING_PROVIDER = "openai";
        process.env.CODE_INDEXER_EMBEDDING_API_KEY = "fallback-key";
        delete process.env.OPENAI_API_KEY;
        const { loadCodeIndexerConfig } = await loadConfigModule();

        expect(loadCodeIndexerConfig()).toMatchObject({
            embeddingApiKey: "fallback-key",
            embeddingProvider: "openai",
        });
    });

    it("allows overriding the OpenAI embedding model and dimension", async () => {
        process.env = { ...ORIGINAL_ENV };
        setRequiredEnv();
        process.env.CODE_INDEXER_EMBEDDING_PROVIDER = "openai";
        process.env.CODE_INDEXER_EMBEDDING_MODEL = "text-embedding-3-large";
        process.env.CODE_INDEXER_EMBEDDING_DIMENSION = "1024";
        const { loadCodeIndexerConfig } = await loadConfigModule();

        expect(loadCodeIndexerConfig()).toMatchObject({
            embeddingDimension: 1024,
            embeddingDimensionExplicit: true,
            embeddingModel: "text-embedding-3-large",
            embeddingProvider: "openai",
        });
    });

    it("parses the optional search API key", async () => {
        process.env = { ...ORIGINAL_ENV };
        setRequiredEnv();
        process.env.CODE_INDEXER_SEARCH_API_KEY = "search-secret";
        const { loadCodeIndexerConfig } = await loadConfigModule();

        expect(loadCodeIndexerConfig()).toMatchObject({
            searchApiKey: "search-secret",
        });
    });

    it("keeps HTTP provider URL validation and rejects invalid providers", async () => {
        process.env = { ...ORIGINAL_ENV };
        setRequiredEnv();
        process.env.CODE_INDEXER_EMBEDDING_PROVIDER = "http";
        const { loadCodeIndexerConfig } = await loadConfigModule();

        expect(() => loadCodeIndexerConfig()).toThrow(
            "CODE_INDEXER_EMBEDDING_URL is required when CODE_INDEXER_EMBEDDING_PROVIDER=http"
        );

        process.env.CODE_INDEXER_EMBEDDING_PROVIDER = "semantic";
        expect(() => loadCodeIndexerConfig()).toThrow(
            "CODE_INDEXER_EMBEDDING_PROVIDER must be one of: hash, http, openai"
        );
    });
});
