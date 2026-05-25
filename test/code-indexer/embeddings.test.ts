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

        expect(provider.fingerprint).toBe("hash:v1:dimension=8");

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
        expect(provider.fingerprint).toContain("http-json:v1");
        expect(provider.fingerprint).toContain("dimension=2");
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

        expect(provider.fingerprint).toBe(
            "openai:v1:model=text-embedding-3-small:dimension=2:dimensions=default:url=https://api.openai.com/v1/embeddings"
        );
        expect(provider.fingerprint).not.toContain("openai-key");

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
            url: "https://user:pass@proxy.test/__openai/v1/embeddings?token=secret",
        });

        expect(provider.fingerprint).toBe(
            "openai:v1:model=text-embedding-3-small:dimension=2:dimensions=2:url=https://proxy.test/__openai/v1/embeddings"
        );
        expect(provider.fingerprint).not.toContain("openai-key");
        expect(provider.fingerprint).not.toContain("secret");
        expect(provider.fingerprint).not.toContain("user:pass");

        await expect(provider.embedQuery("alpha")).resolves.toEqual([1, 0]);
        expect(readJsonRequestBody(fetchCalls[0])).toEqual({
            dimensions: 2,
            input: ["alpha"],
            model: "text-embedding-3-small",
        });
    });

    it("aborts OpenAI embedding requests after the configured timeout", async () => {
        let signal: AbortSignal | undefined;
        const provider = new OpenAiEmbeddingProvider({
            apiKey: "openai-key",
            dimension: 2,
            fetchImpl: ((_url: unknown, init: RequestInit | undefined) => {
                signal = init?.signal as AbortSignal | undefined;
                return new Promise<Response>((_resolve, reject) => {
                    signal?.addEventListener("abort", () => {
                        reject(new DOMException("aborted", "AbortError"));
                    });
                });
            }) as typeof fetch,
            model: "text-embedding-3-small",
            timeoutMs: 10,
        });

        const request = provider.embedQuery("alpha");

        expect(signal).toBeInstanceOf(AbortSignal);
        await expect(request).rejects.toThrow(
            "OpenAI embedding request timed out after 10ms"
        );
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
