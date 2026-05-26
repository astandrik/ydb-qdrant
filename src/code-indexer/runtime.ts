import type { CodeIndexerSearchConfig } from "./config.js";
import {
    HashEmbeddingProvider,
    HttpJsonEmbeddingProvider,
    OpenAiEmbeddingProvider,
} from "./embeddings.js";
import type { EmbeddingProvider } from "./types.js";

export function createEmbeddingProviderFromConfig(
    config: CodeIndexerSearchConfig
): EmbeddingProvider {
    const authHeaders =
        config.embeddingApiKey === undefined
            ? {}
            : {
                  [config.embeddingAuthHeader]: config.embeddingAuthScheme
                      ? `${config.embeddingAuthScheme} ${config.embeddingApiKey}`
                      : config.embeddingApiKey,
              };
    switch (config.embeddingProvider) {
        case "http":
            return new HttpJsonEmbeddingProvider({
                dimension: config.embeddingDimension,
                headers: authHeaders,
                model: config.embeddingModel,
                url: config.embeddingUrl ?? "",
            });
        case "openai":
            return new OpenAiEmbeddingProvider({
                apiKey: config.embeddingApiKey ?? "",
                dimension: config.embeddingDimension,
                dimensions: config.embeddingDimensionExplicit
                    ? config.embeddingDimension
                    : undefined,
                model: config.embeddingModel ?? "text-embedding-3-small",
                url: config.embeddingUrl,
            });
        case "hash":
            return new HashEmbeddingProvider(config.embeddingDimension);
    }
}
