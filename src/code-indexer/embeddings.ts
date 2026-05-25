import { createHash } from "node:crypto";

import type { EmbeddingProvider } from "./types.js";

type FetchLike = typeof fetch;

function normalizeVector(vector: number[]): number[] {
    let magnitude = 0;
    for (const value of vector) {
        magnitude += value * value;
    }
    const norm = Math.sqrt(magnitude);
    if (norm === 0) {
        return vector;
    }
    return vector.map((value) => value / norm);
}

function tokensForText(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^a-z0-9_]+/g)
        .filter((token) => token.length > 0);
}

function hashToken(token: string): Buffer {
    return createHash("sha256").update(token).digest();
}

export class HashEmbeddingProvider implements EmbeddingProvider {
    readonly dimension: number;

    constructor(dimension = 384) {
        if (!Number.isInteger(dimension) || dimension <= 0) {
            throw new Error("HashEmbeddingProvider dimension must be positive");
        }
        this.dimension = dimension;
    }

    embedDocuments(texts: string[]): Promise<number[][]> {
        return Promise.resolve(texts.map((text) => this.embedText(text)));
    }

    embedQuery(text: string): Promise<number[]> {
        return Promise.resolve(this.embedText(text));
    }

    private embedText(text: string): number[] {
        const vector = Array.from({ length: this.dimension }, () => 0);
        const tokens = tokensForText(text);
        const effectiveTokens = tokens.length > 0 ? tokens : [text];

        for (const token of effectiveTokens) {
            const hash = hashToken(token);
            const index = hash.readUInt32BE(0) % this.dimension;
            const sign = (hash[4] & 1) === 0 ? 1 : -1;
            const weight = 1 + (hash[5] / 255);
            vector[index] += sign * weight;
        }

        return normalizeVector(vector);
    }
}

function isNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function isNumberArrayArray(value: unknown): value is number[][] {
    return Array.isArray(value) && value.every(isNumberArray);
}

function readEmbeddingsFromResponse(value: unknown): number[][] | null {
    if (isNumberArrayArray(value)) {
        return value;
    }
    if (!value || typeof value !== "object") {
        return null;
    }
    const obj = value as Record<string, unknown>;
    if (isNumberArrayArray(obj.embeddings)) {
        return obj.embeddings;
    }
    if (isNumberArrayArray(obj.vectors)) {
        return obj.vectors;
    }
    if (Array.isArray(obj.data)) {
        const embeddings = obj.data
            .map((item) => {
                if (!item || typeof item !== "object") {
                    return null;
                }
                const embedding = (item as Record<string, unknown>).embedding;
                return isNumberArray(embedding) ? embedding : null;
            })
            .filter((embedding): embedding is number[] => embedding !== null);
        if (embeddings.length === obj.data.length) {
            return embeddings;
        }
    }
    return null;
}

function validateEmbeddingBatch(params: {
    dimension: number;
    embeddings: number[][];
    expectedCount: number;
}): void {
    if (params.embeddings.length !== params.expectedCount) {
        throw new Error(
            `Embedding provider returned ${params.embeddings.length} vectors for ${params.expectedCount} inputs`
        );
    }
    for (const embedding of params.embeddings) {
        if (embedding.length !== params.dimension) {
            throw new Error(
                `Embedding dimension mismatch: got ${embedding.length}, expected ${params.dimension}`
            );
        }
    }
}

export class HttpJsonEmbeddingProvider implements EmbeddingProvider {
    readonly dimension: number;
    private readonly fetchImpl: FetchLike;
    private readonly headers: Record<string, string>;
    private readonly model: string | undefined;
    private readonly url: string;

    constructor(params: {
        dimension: number;
        fetchImpl?: FetchLike;
        headers?: Record<string, string>;
        model?: string;
        url: string;
    }) {
        if (!Number.isInteger(params.dimension) || params.dimension <= 0) {
            throw new Error("HttpJsonEmbeddingProvider dimension must be positive");
        }
        if (!params.url.trim()) {
            throw new Error("HttpJsonEmbeddingProvider url is required");
        }
        this.dimension = params.dimension;
        this.fetchImpl = params.fetchImpl ?? fetch;
        this.headers = params.headers ?? {};
        this.model = params.model?.trim() || undefined;
        this.url = params.url;
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        return await this.requestEmbeddings(texts);
    }

    async embedQuery(text: string): Promise<number[]> {
        const [embedding] = await this.requestEmbeddings([text]);
        if (!embedding) {
            throw new Error("Embedding provider returned no query embedding");
        }
        return embedding;
    }

    private async requestEmbeddings(texts: string[]): Promise<number[][]> {
        const response = await this.fetchImpl(this.url, {
            body: JSON.stringify({
                input: texts,
                ...(this.model ? { model: this.model } : {}),
            }),
            headers: {
                "Content-Type": "application/json",
                ...this.headers,
            },
            method: "POST",
        });
        if (!response.ok) {
            throw new Error(
                `Embedding provider request failed: ${response.status} ${response.statusText}`
            );
        }
        const json = (await response.json()) as unknown;
        const embeddings = readEmbeddingsFromResponse(json);
        if (!embeddings) {
            throw new Error("Embedding provider response did not contain vectors");
        }
        validateEmbeddingBatch({
            dimension: this.dimension,
            embeddings,
            expectedCount: texts.length,
        });
        return embeddings;
    }
}

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
    readonly dimension: number;
    private readonly apiKey: string;
    private readonly dimensions: number | undefined;
    private readonly fetchImpl: FetchLike;
    private readonly model: string;
    private readonly url: string;

    constructor(params: {
        apiKey: string;
        dimension: number;
        dimensions?: number;
        fetchImpl?: FetchLike;
        model: string;
        url?: string;
    }) {
        if (!params.apiKey.trim()) {
            throw new Error("OpenAiEmbeddingProvider api key is required");
        }
        if (!Number.isInteger(params.dimension) || params.dimension <= 0) {
            throw new Error("OpenAiEmbeddingProvider dimension must be positive");
        }
        if (params.dimensions !== undefined) {
            if (!Number.isInteger(params.dimensions) || params.dimensions <= 0) {
                throw new Error(
                    "OpenAiEmbeddingProvider dimensions must be positive"
                );
            }
        }
        if (!params.model.trim()) {
            throw new Error("OpenAiEmbeddingProvider model is required");
        }
        this.apiKey = params.apiKey;
        this.dimension = params.dimension;
        this.dimensions = params.dimensions;
        this.fetchImpl = params.fetchImpl ?? fetch;
        this.model = params.model;
        this.url = params.url?.trim() || "https://api.openai.com/v1/embeddings";
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        return await this.requestEmbeddings(texts);
    }

    async embedQuery(text: string): Promise<number[]> {
        const [embedding] = await this.requestEmbeddings([text]);
        if (!embedding) {
            throw new Error("OpenAI returned no query embedding");
        }
        return embedding;
    }

    private async requestEmbeddings(texts: string[]): Promise<number[][]> {
        const response = await this.fetchImpl(this.url, {
            body: JSON.stringify({
                ...(this.dimensions === undefined
                    ? {}
                    : { dimensions: this.dimensions }),
                input: texts,
                model: this.model,
            }),
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            method: "POST",
        });
        if (!response.ok) {
            throw new Error(
                `OpenAI embedding request failed: ${response.status} ${response.statusText}`
            );
        }
        const json = (await response.json()) as unknown;
        const embeddings = readEmbeddingsFromResponse(json);
        if (!embeddings) {
            throw new Error("OpenAI embedding response did not contain vectors");
        }
        validateEmbeddingBatch({
            dimension: this.dimension,
            embeddings,
            expectedCount: texts.length,
        });
        return embeddings;
    }
}
