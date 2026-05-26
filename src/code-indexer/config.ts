import "dotenv/config";
import { readFileSync } from "node:fs";

import { parseBooleanEnv, parseIntegerEnv } from "../utils/EnvParsers.js";
import type { CodeIndexerChunkerMode } from "./chunker.js";

export type CodeIndexerEmbeddingProvider = "hash" | "http" | "openai";

export type CodeIndexerConfig = {
    adminGithubUserIds: string[];
    allowedMcpOrigins: string[];
    checksEnabled: boolean;
    chunkerMode: CodeIndexerChunkerMode;
    chunkLines: number;
    embedSnippetText: boolean;
    embeddingApiKey?: string;
    embeddingAuthHeader: string;
    embeddingAuthScheme?: string;
    embeddingBatchMaxChars: number;
    embeddingBatchSize: number;
    embeddingConcurrency: number;
    embeddingDimension: number;
    embeddingDimensionExplicit: boolean;
    embeddingModel?: string;
    embeddingProvider: CodeIndexerEmbeddingProvider;
    embeddingUrl?: string;
    encryptionSecret: string;
    githubApiBaseUrl: string;
    githubApiVersion: string;
    githubAppId: string;
    githubClientId: string;
    githubClientSecret: string;
    githubPrivateKey: string;
    fileConcurrency: number;
    jobConcurrency: number;
    jobMaxAttempts: number;
    jobRetryBackoffMs: number;
    maxChangedFilesForIncremental: number;
    maxChunkChars: number;
    maxFileBytes: number;
    oauthStateTtlSeconds: number;
    overlapLines: number;
    port: number;
    publicBaseUrl: string;
    quotaChunksPerRepo: number;
    quotaFilesPerRepo: number;
    quotaReposPerInstallation: number;
    quotaSearchesPerUserPerDay: number;
    searchApiKey?: string;
    sessionSecret: string;
    sessionTtlSeconds: number;
    stateStore: "memory" | "ydb";
    stateRetentionDays: number;
    tokenPepper: string;
    uiOrigin: string;
    webhookSecret: string;
};

export type CodeIndexerSearchConfig = Pick<
    CodeIndexerConfig,
    | "embedSnippetText"
    | "embeddingApiKey"
    | "embeddingAuthHeader"
    | "embeddingAuthScheme"
    | "embeddingDimension"
    | "embeddingDimensionExplicit"
    | "embeddingModel"
    | "embeddingProvider"
    | "embeddingUrl"
>;

function readRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required env var ${name}`);
    }
    return value;
}

function readPrivateKey(): string {
    const direct = process.env.GITHUB_PRIVATE_KEY?.trim();
    if (direct) {
        return direct.replace(/\\n/g, "\n");
    }
    const path = process.env.GITHUB_PRIVATE_KEY_FILE?.trim();
    if (path) {
        return readFileSync(path, "utf8");
    }
    throw new Error(
        "Missing required env var GITHUB_PRIVATE_KEY or GITHUB_PRIVATE_KEY_FILE"
    );
}

function readEmbeddingProvider(): CodeIndexerEmbeddingProvider {
    const raw =
        process.env.CODE_INDEXER_EMBEDDING_PROVIDER?.trim().toLowerCase() ??
        "hash";
    if (raw === "hash" || raw === "http" || raw === "openai") {
        return raw;
    }
    throw new Error(
        "CODE_INDEXER_EMBEDDING_PROVIDER must be one of: hash, http, openai"
    );
}

function readStateStore(): "memory" | "ydb" {
    const raw = process.env.CODE_INDEXER_STATE_STORE?.trim().toLowerCase() ?? "ydb";
    if (raw === "memory" || raw === "ydb") {
        return raw;
    }
    throw new Error("CODE_INDEXER_STATE_STORE must be one of: memory, ydb");
}

function readChunkerMode(): CodeIndexerChunkerMode {
    const raw = process.env.CODE_INDEXER_CHUNKER?.trim().toLowerCase() ?? "auto";
    if (raw === "auto" || raw === "line-window" || raw === "tree-sitter") {
        return raw;
    }
    throw new Error(
        "CODE_INDEXER_CHUNKER must be one of: auto, line-window, tree-sitter"
    );
}

function readEmbeddingAuthScheme(): string | undefined {
    if (process.env.CODE_INDEXER_EMBEDDING_AUTH_SCHEME === undefined) {
        return "Bearer";
    }
    return process.env.CODE_INDEXER_EMBEDDING_AUTH_SCHEME.trim() || undefined;
}

function readCommaSeparatedList(value: string | undefined, defaultValue: string): string[] {
    return (value ?? defaultValue)
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

export function loadCodeIndexerSearchConfig(): CodeIndexerSearchConfig {
    const embeddingProvider = readEmbeddingProvider();
    const embeddingUrl = process.env.CODE_INDEXER_EMBEDDING_URL?.trim();
    if (embeddingProvider === "http" && !embeddingUrl) {
        throw new Error(
            "CODE_INDEXER_EMBEDDING_URL is required when CODE_INDEXER_EMBEDDING_PROVIDER=http"
        );
    }

    return {
        embedSnippetText: parseBooleanEnv(
            process.env.CODE_INDEXER_EMBED_SNIPPET_TEXT,
            true
        ),
        embeddingApiKey:
            embeddingProvider === "openai"
                ? process.env.OPENAI_API_KEY?.trim() ||
                  process.env.CODE_INDEXER_EMBEDDING_API_KEY?.trim() ||
                  undefined
                : process.env.CODE_INDEXER_EMBEDDING_API_KEY?.trim() || undefined,
        embeddingAuthHeader:
            process.env.CODE_INDEXER_EMBEDDING_AUTH_HEADER?.trim() ||
            "Authorization",
        embeddingAuthScheme: readEmbeddingAuthScheme(),
        embeddingDimension: parseIntegerEnv(
            process.env.CODE_INDEXER_EMBEDDING_DIMENSION,
            embeddingProvider === "openai" ? 1536 : 384,
            { min: 1 }
        ),
        embeddingDimensionExplicit:
            process.env.CODE_INDEXER_EMBEDDING_DIMENSION !== undefined,
        embeddingModel:
            process.env.CODE_INDEXER_EMBEDDING_MODEL?.trim() ||
            (embeddingProvider === "openai" ? "text-embedding-3-small" : undefined),
        embeddingProvider,
        embeddingUrl,
    };
}

export function loadCodeIndexerConfig(): CodeIndexerConfig {
    const searchConfig = loadCodeIndexerSearchConfig();

    return {
        ...searchConfig,
        adminGithubUserIds: readCommaSeparatedList(
            process.env.CODE_INDEXER_ADMIN_GITHUB_USER_IDS,
            ""
        ),
        allowedMcpOrigins: readCommaSeparatedList(
            process.env.CODE_INDEXER_ALLOWED_MCP_ORIGINS,
            "https://ydb-qdrant.tech"
        ),
        checksEnabled: parseBooleanEnv(
            process.env.CODE_INDEXER_CHECKS_ENABLED,
            false
        ),
        chunkLines: parseIntegerEnv(process.env.CODE_INDEXER_CHUNK_LINES, 80, {
            min: 1,
        }),
        chunkerMode: readChunkerMode(),
        githubApiBaseUrl:
            process.env.GITHUB_API_BASE_URL?.trim() ?? "https://api.github.com",
        githubApiVersion:
            process.env.GITHUB_API_VERSION?.trim() ?? "2022-11-28",
        githubAppId: readRequiredEnv("GITHUB_APP_ID"),
        githubClientId: readRequiredEnv("GITHUB_CLIENT_ID"),
        githubClientSecret: readRequiredEnv("GITHUB_CLIENT_SECRET"),
        githubPrivateKey: readPrivateKey(),
        encryptionSecret: readRequiredEnv("CODE_INDEXER_ENCRYPTION_SECRET"),
        fileConcurrency: parseIntegerEnv(
            process.env.CODE_INDEXER_FILE_CONCURRENCY,
            4,
            { min: 1 }
        ),
        embeddingBatchSize: parseIntegerEnv(
            process.env.CODE_INDEXER_EMBEDDING_BATCH_SIZE,
            64,
            { min: 1 }
        ),
        embeddingBatchMaxChars: parseIntegerEnv(
            process.env.CODE_INDEXER_EMBEDDING_BATCH_MAX_CHARS,
            200_000,
            { min: 1 }
        ),
        embeddingConcurrency: parseIntegerEnv(
            process.env.CODE_INDEXER_EMBEDDING_CONCURRENCY,
            2,
            { min: 1 }
        ),
        jobConcurrency: parseIntegerEnv(
            process.env.CODE_INDEXER_JOB_CONCURRENCY,
            2,
            { min: 1 }
        ),
        jobMaxAttempts: parseIntegerEnv(
            process.env.CODE_INDEXER_JOB_MAX_ATTEMPTS,
            3,
            { min: 1 }
        ),
        jobRetryBackoffMs: parseIntegerEnv(
            process.env.CODE_INDEXER_JOB_RETRY_BACKOFF_MS,
            30_000,
            { min: 0 }
        ),
        maxChangedFilesForIncremental: parseIntegerEnv(
            process.env.CODE_INDEXER_MAX_CHANGED_FILES,
            300,
            { min: 1 }
        ),
        maxChunkChars: parseIntegerEnv(
            process.env.CODE_INDEXER_MAX_CHUNK_CHARS,
            8000,
            { min: 1 }
        ),
        maxFileBytes: parseIntegerEnv(
            process.env.CODE_INDEXER_MAX_FILE_BYTES,
            512 * 1024,
            { min: 1 }
        ),
        oauthStateTtlSeconds: parseIntegerEnv(
            process.env.CODE_INDEXER_OAUTH_STATE_TTL_SECONDS,
            600,
            { min: 1 }
        ),
        overlapLines: parseIntegerEnv(process.env.CODE_INDEXER_OVERLAP_LINES, 10, {
            min: 0,
        }),
        port: parseIntegerEnv(process.env.CODE_INDEXER_PORT, 8090, {
            max: 65535,
            min: 1,
        }),
        publicBaseUrl: readRequiredEnv("CODE_INDEXER_PUBLIC_BASE_URL"),
        quotaChunksPerRepo: parseIntegerEnv(
            process.env.CODE_INDEXER_QUOTA_CHUNKS_PER_REPO,
            5_000_000,
            { min: 1 }
        ),
        quotaFilesPerRepo: parseIntegerEnv(
            process.env.CODE_INDEXER_QUOTA_FILES_PER_REPO,
            1_000_000,
            { min: 1 }
        ),
        quotaReposPerInstallation: parseIntegerEnv(
            process.env.CODE_INDEXER_QUOTA_REPOS_PER_INSTALLATION,
            1_000,
            { min: 1 }
        ),
        quotaSearchesPerUserPerDay: parseIntegerEnv(
            process.env.CODE_INDEXER_QUOTA_SEARCHES_PER_USER_PER_DAY,
            100_000,
            { min: 1 }
        ),
        searchApiKey:
            process.env.CODE_INDEXER_SEARCH_API_KEY?.trim() || undefined,
        sessionSecret: readRequiredEnv("CODE_INDEXER_SESSION_SECRET"),
        sessionTtlSeconds: parseIntegerEnv(
            process.env.CODE_INDEXER_SESSION_TTL_SECONDS,
            2_592_000,
            { min: 1 }
        ),
        stateStore: readStateStore(),
        stateRetentionDays: parseIntegerEnv(
            process.env.CODE_INDEXER_STATE_RETENTION_DAYS,
            14,
            { min: 1 }
        ),
        tokenPepper: readRequiredEnv("CODE_INDEXER_TOKEN_PEPPER"),
        uiOrigin: readRequiredEnv("CODE_INDEXER_UI_ORIGIN"),
        webhookSecret: readRequiredEnv("GITHUB_WEBHOOK_SECRET"),
    };
}
