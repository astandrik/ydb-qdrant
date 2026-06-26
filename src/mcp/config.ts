import { createYdbQdrantClient } from "../package/api.js";
import type { YdbQdrantClientOptions } from "../package/api.js";
import {
    HashEmbeddingProvider,
    HttpJsonEmbeddingProvider,
    OpenAiEmbeddingProvider,
} from "../embeddings/providers.js";
import { parseBooleanEnv, parseIntegerEnv } from "../utils/EnvParsers.js";
import { deriveUserUidFromApiKey } from "../utils/tenant.js";
import type { YdbQdrantMcpDeps, YdbQdrantMcpEmbeddingProvider } from "./types.js";

export type YdbQdrantMcpEmbeddingProviderName = "hash" | "http" | "openai";

export type YdbQdrantMcpEmbeddingConfig = {
    apiKey?: string;
    authHeader: string;
    authScheme?: string;
    dimension: number;
    dimensionExplicit: boolean;
    model?: string;
    provider: YdbQdrantMcpEmbeddingProviderName;
    url?: string;
};

export type YdbQdrantMcpIdentity =
    | {
          apiKey: string;
          clientOptions: YdbQdrantClientOptions;
          userUid: string;
      }
    | {
          apiKey?: never;
          clientOptions: YdbQdrantClientOptions;
          userUid: string;
      };

export type YdbQdrantMcpConfig = {
    allowDestructive: boolean;
    allowedOrigins: string[];
    allowWrites: boolean;
    bearerToken?: string;
    embedding?: YdbQdrantMcpEmbeddingConfig;
    identity: YdbQdrantMcpIdentity;
    port: number;
};

type EnvLike = Record<string, string | undefined>;

function readMcpEmbeddingProvider(
    env: EnvLike
): YdbQdrantMcpEmbeddingProviderName | undefined {
    const raw = env.YDB_QDRANT_MCP_EMBEDDING_PROVIDER?.trim().toLowerCase();
    if (!raw) {
        return undefined;
    }
    if (raw === "hash" || raw === "http" || raw === "openai") {
        return raw;
    }
    throw new Error(
        "YDB_QDRANT_MCP_EMBEDDING_PROVIDER must be one of: hash, http, openai"
    );
}

function readCommaSeparatedList(value: string | undefined): string[] {
    return (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function readEmbeddingAuthScheme(env: EnvLike): string | undefined {
    if (env.YDB_QDRANT_MCP_EMBEDDING_AUTH_SCHEME === undefined) {
        return "Bearer";
    }
    return env.YDB_QDRANT_MCP_EMBEDDING_AUTH_SCHEME.trim() || undefined;
}

function openAiDefaultDimension(model: string): number {
    switch (model) {
        case "text-embedding-3-small":
        case "text-embedding-ada-002":
            return 1536;
        case "text-embedding-3-large":
            return 3072;
        default:
            throw new Error(
                `YDB_QDRANT_MCP_EMBEDDING_DIMENSION is required for unknown OpenAI embedding model ${model}`
            );
    }
}

function readExplicitEmbeddingDimension(env: EnvLike): number | undefined {
    const raw = env.YDB_QDRANT_MCP_EMBEDDING_DIMENSION;
    if (raw === undefined) {
        return undefined;
    }
    const value = raw.trim();
    if (!/^\d+$/.test(value)) {
        throw new Error(
            "YDB_QDRANT_MCP_EMBEDDING_DIMENSION must be a positive integer"
        );
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new Error(
            "YDB_QDRANT_MCP_EMBEDDING_DIMENSION must be a positive integer"
        );
    }
    return parsed;
}

function readIdentity(env: EnvLike): YdbQdrantMcpIdentity {
    const apiKey = env.YDB_QDRANT_MCP_API_KEY?.trim();
    const userUid = env.YDB_QDRANT_MCP_USER_UID?.trim();
    if ((apiKey ? 1 : 0) + (userUid ? 1 : 0) !== 1) {
        throw new Error(
            "YDB Qdrant MCP requires exactly one of YDB_QDRANT_MCP_API_KEY or YDB_QDRANT_MCP_USER_UID"
        );
    }
    if (apiKey) {
        return {
            apiKey,
            clientOptions: { apiKey },
            userUid: deriveUserUidFromApiKey(apiKey),
        };
    }
    const resolvedUserUid = userUid as string;
    return {
        clientOptions: { userUid: resolvedUserUid },
        userUid: resolvedUserUid,
    };
}

function readEmbeddingConfig(
    env: EnvLike
): YdbQdrantMcpEmbeddingConfig | undefined {
    const provider = readMcpEmbeddingProvider(env);
    if (!provider) {
        return undefined;
    }
    const embeddingUrl = env.YDB_QDRANT_MCP_EMBEDDING_URL?.trim();
    if (provider === "http" && !embeddingUrl) {
        throw new Error(
            "YDB_QDRANT_MCP_EMBEDDING_URL is required when YDB_QDRANT_MCP_EMBEDDING_PROVIDER=http"
        );
    }
    const explicitDimension = readExplicitEmbeddingDimension(env);
    const dimensionExplicit = explicitDimension !== undefined;
    const model =
        env.YDB_QDRANT_MCP_EMBEDDING_MODEL?.trim() ||
        (provider === "openai" ? "text-embedding-3-small" : undefined);
    const defaultDimension =
        provider === "openai" && model && !dimensionExplicit
            ? openAiDefaultDimension(model)
            : provider === "openai"
              ? 1536
              : 384;
    return {
        apiKey:
            provider === "openai"
                ? env.YDB_QDRANT_MCP_EMBEDDING_API_KEY?.trim() ||
                  env.OPENAI_API_KEY?.trim() ||
                  undefined
                : env.YDB_QDRANT_MCP_EMBEDDING_API_KEY?.trim() || undefined,
        authHeader:
            env.YDB_QDRANT_MCP_EMBEDDING_AUTH_HEADER?.trim() ||
            "Authorization",
        authScheme: readEmbeddingAuthScheme(env),
        dimension: explicitDimension ?? defaultDimension,
        dimensionExplicit,
        model,
        provider,
        url: embeddingUrl || undefined,
    };
}

export function loadYdbQdrantMcpConfig(
    env: EnvLike = process.env,
    opts?: { requireBearerToken?: boolean }
): YdbQdrantMcpConfig {
    const bearerToken = env.YDB_QDRANT_MCP_BEARER_TOKEN?.trim() || undefined;
    if (opts?.requireBearerToken === true && !bearerToken) {
        throw new Error("YDB_QDRANT_MCP_BEARER_TOKEN is required");
    }
    return {
        allowDestructive: parseBooleanEnv(
            env.YDB_QDRANT_MCP_ENABLE_DESTRUCTIVE,
            false
        ),
        allowedOrigins: readCommaSeparatedList(
            env.YDB_QDRANT_MCP_ALLOWED_ORIGINS
        ),
        allowWrites: parseBooleanEnv(env.YDB_QDRANT_MCP_ENABLE_WRITES, false),
        ...(bearerToken === undefined ? {} : { bearerToken }),
        embedding: readEmbeddingConfig(env),
        identity: readIdentity(env),
        port: parseIntegerEnv(env.YDB_QDRANT_MCP_PORT, 8091, {
            max: 65535,
            min: 1,
        }),
    };
}

export function createYdbQdrantMcpEmbeddingProviderFromConfig(
    config: YdbQdrantMcpEmbeddingConfig
): YdbQdrantMcpEmbeddingProvider {
    const authHeaders =
        config.apiKey === undefined
            ? {}
            : {
                  [config.authHeader]: config.authScheme
                      ? `${config.authScheme} ${config.apiKey}`
                      : config.apiKey,
              };
    switch (config.provider) {
        case "http":
            return new HttpJsonEmbeddingProvider({
                dimension: config.dimension,
                headers: authHeaders,
                model: config.model,
                url: config.url ?? "",
            });
        case "openai":
            return new OpenAiEmbeddingProvider({
                apiKey: config.apiKey ?? "",
                dimension: config.dimension,
                dimensions: config.dimensionExplicit
                    ? config.dimension
                    : undefined,
                model: config.model ?? "text-embedding-3-small",
                url: config.url,
            });
        case "hash":
            return new HashEmbeddingProvider(config.dimension);
    }
}

export async function createYdbQdrantMcpDepsFromConfig(
    config: YdbQdrantMcpConfig
): Promise<YdbQdrantMcpDeps> {
    const client = await createYdbQdrantClient(config.identity.clientOptions);
    return {
        allowDestructive: config.allowDestructive,
        allowWrites: config.allowWrites,
        client,
        embeddingProvider:
            config.embedding === undefined
                ? undefined
                : createYdbQdrantMcpEmbeddingProviderFromConfig(config.embedding),
        listCollections: async () => {
            const result = await client.listCollections();
            return result.collections.map((collection) => ({
                distance: collection.vectors.distance,
                lastAccessedAt: collection.last_accessed_at,
                name: collection.name,
                pointsCount: collection.points_count,
                vectorSize: collection.vectors.size,
                vectorType: collection.vectors.data_type,
            }));
        },
        userUid: config.identity.userUid,
    };
}
