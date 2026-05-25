import { describe, expect, it } from "vitest";

import {
    HashEmbeddingProvider,
    HttpJsonEmbeddingProvider,
    OpenAiEmbeddingProvider,
} from "../../src/code-indexer/embeddings.js";

function readJsonRequestBody(call: unknown[] | undefined): unknown {
    const init = call?.[1] as RequestInit | undefined;
    expect(typeof init?.body).toBe("string");
    return JSON.parse(init.body as string) as unknown;
}

describe("code-indexer embeddings", () => {
    it("creates deterministic normalized hash embeddings", async () => {
        const provider = new HashEmbeddingProvider(8);

        const first = await provider.embedQuery("hello world");
        const second = await provider.embedQuery("hello world");

        expect(first).toEqual(second);
        expect(first).toHaveLength(8);
        const magnitude = Math.sqrt(
            first.reduce((sum, value) => sum + value * value, 0)
        );
        expect(magnitude).toBeCloseTo(1);
    });

    it("parses common HTTP embedding response shapes and validates dimensions", async () => {
        const fetchCalls: unknown[][] = [];
        const provider = new HttpJsonEmbeddingProvider({
            dimension: 2,
            fetchImpl: ((...args: unknown[]) => {
                fetchCalls.push(args);
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            data: [
                                { embedding: [1, 0] },
                                { embedding: [0, 1] },
                            ],
                        }),
                        { status: 200 }
                    )
                );
            }) as typeof fetch,
            headers: {
                Authorization: "Bearer test-key",
            },
            url: "http://embedding.test",
        });

        await expect(provider.embedDocuments(["a", "b"])).resolves.toEqual([
            [1, 0],
            [0, 1],
        ]);
        expect(fetchCalls[0]?.[1]).toMatchObject({
            headers: {
                Authorization: "Bearer test-key",
                "Content-Type": "application/json",
            },
        });
    });

    it("parses alternate HTTP embedding response shapes", async () => {
        const provider = new HttpJsonEmbeddingProvider({
            dimension: 2,
            fetchImpl: (() =>
                Promise.resolve(
                    new Response(
                        JSON.stringify({
                            embeddings: [
                                [1, 0],
                                [0, 1],
                            ],
                        }),
                        { status: 200 }
                    )
                )) as typeof fetch,
            url: "http://embedding.test",
        });

        await expect(provider.embedDocuments(["a", "b"])).resolves.toEqual([
            [1, 0],
            [0, 1],
        ]);
    });

    it("requests OpenAI embeddings without dimensions unless explicitly configured", async () => {
        const fetchCalls: unknown[][] = [];
        const provider = new OpenAiEmbeddingProvider({
            apiKey: "openai-key",
            dimension: 2,
            fetchImpl: ((...args: unknown[]) => {
                fetchCalls.push(args);
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            data: [
                                { embedding: [1, 0] },
                                { embedding: [0, 1] },
                            ],
                        }),
                        { status: 200 }
                    )
                );
            }) as typeof fetch,
            model: "text-embedding-3-small",
        });

        await expect(provider.embedDocuments(["alpha", "beta"])).resolves.toEqual([
            [1, 0],
            [0, 1],
        ]);

        expect(fetchCalls[0]?.[0]).toBe("https://api.openai.com/v1/embeddings");
        expect(fetchCalls[0]?.[1]).toMatchObject({
            headers: {
                Authorization: "Bearer openai-key",
                "Content-Type": "application/json",
            },
            method: "POST",
        });
        expect(readJsonRequestBody(fetchCalls[0])).toEqual({
            input: ["alpha", "beta"],
            model: "text-embedding-3-small",
        });
    });

    it("requests explicit OpenAI embedding dimensions when configured", async () => {
        const fetchCalls: unknown[][] = [];
        const provider = new OpenAiEmbeddingProvider({
            apiKey: "openai-key",
            dimension: 2,
            dimensions: 2,
            fetchImpl: ((...args: unknown[]) => {
                fetchCalls.push(args);
                return Promise.resolve(
                    new Response(
                        JSON.stringify({ data: [{ embedding: [1, 0] }] }),
                        { status: 200 }
                    )
                );
            }) as typeof fetch,
            model: "text-embedding-3-small",
        });

        await expect(provider.embedQuery("alpha")).resolves.toEqual([1, 0]);
        expect(readJsonRequestBody(fetchCalls[0])).toEqual({
            dimensions: 2,
            input: ["alpha"],
            model: "text-embedding-3-small",
        });
    });

    it("rejects OpenAI HTTP failures and dimension mismatches", async () => {
        const failingProvider = new OpenAiEmbeddingProvider({
            apiKey: "openai-key",
            dimension: 2,
            fetchImpl: (() =>
                Promise.resolve(new Response("bad", { status: 500 }))) as typeof fetch,
            model: "text-embedding-3-small",
        });
        await expect(failingProvider.embedQuery("alpha")).rejects.toThrow(
            "OpenAI embedding request failed: 500"
        );

        const mismatchedProvider = new OpenAiEmbeddingProvider({
            apiKey: "openai-key",
            dimension: 3,
            fetchImpl: (() =>
                Promise.resolve(
                    new Response(
                        JSON.stringify({ data: [{ embedding: [1, 0] }] }),
                        { status: 200 }
                    )
                )) as typeof fetch,
            model: "text-embedding-3-small",
        });
        await expect(mismatchedProvider.embedQuery("alpha")).rejects.toThrow(
            "Embedding dimension mismatch: got 2, expected 3"
        );
    });
});
