import { describe, expect, it, vi } from "vitest";

import {
    formatCodeSearchResponse,
    parseCodeSearchRequest,
    searchCode,
} from "../../src/code-indexer/searchAdapter.js";
import { createCodeIndexerQuota } from "../../src/code-indexer/quota.js";
import type {
    CodeIndexStore,
    EmbeddingProvider,
} from "../../src/code-indexer/types.js";

function embeddingProvider(): {
    embedQuery: ReturnType<typeof vi.fn>;
    provider: EmbeddingProvider;
} {
    const embedQuery = vi.fn(() => Promise.resolve([0.1, 0.2]));
    return {
        embedQuery,
        provider: {
            dimension: 2,
            embedDocuments: vi.fn(),
            embedQuery,
        },
    };
}

function indexStore(): {
    search: ReturnType<typeof vi.fn>;
    store: CodeIndexStore;
} {
    const search = vi.fn(() =>
        Promise.resolve([
            {
                id: "point-1",
                payload: {
                    endLine: 4,
                    language: "TypeScript",
                    path: "src/server.ts",
                    startLine: 2,
                    text: "function buildServer() {}",
                },
                score: 0.9,
            },
        ])
    );
    const store: CodeIndexStore = {
        deleteCollection: vi.fn(),
        deletePath: vi.fn(),
        ensureCollection: vi.fn(),
        resetCollection: vi.fn(),
        search,
        upsertChunks: vi.fn(),
    };
    return { search, store };
}

describe("code-indexer search adapter", () => {
    it("parses required search parameters and rejects malformed input", () => {
        expect(
            parseCodeSearchRequest({
                installationId: 7,
                query: "request identity",
                repoId: 42,
            })
        ).toEqual({
            installationId: 7,
            query: "request identity",
            repoId: 42,
            top: 10,
        });

        expect(() => parseCodeSearchRequest({ repoId: 42 })).toThrow(
            "installationId, repoId, and query are required"
        );
        expect(() =>
            parseCodeSearchRequest({
                installationId: 7,
                query: "x",
                repoId: 42,
                top: 0,
            })
        ).toThrow("top must be greater than 0");
    });

    it("embeds the query and searches the resolved collection", async () => {
        const { embedQuery, provider } = embeddingProvider();
        const { search, store } = indexStore();

        const result = await searchCode(
            { embeddingProvider: provider, store },
            {
                installationId: 7,
                prNumber: 3,
                query: "build server",
                repoId: 42,
                top: 5,
            }
        );

        expect(embedQuery).toHaveBeenCalledWith("build server");
        expect(search).toHaveBeenCalledWith({
            collection: "gh_repo_42_pr_3",
            queryVector: [0.1, 0.2],
            top: 5,
            userUid: "gh_installation_7",
        });
        expect(result.collection).toBe("gh_repo_42_pr_3");
        expect(result.points).toHaveLength(1);
    });

    it("counts authenticated searches before embedding the query", async () => {
        const { embedQuery, provider } = embeddingProvider();
        const { search, store } = indexStore();
        const incrementDailyUsage = vi.fn(() => Promise.resolve(6));
        const quota = createCodeIndexerQuota({
            limits: {
                chunksPerRepo: 50,
                filesPerRepo: 10,
                reposPerInstallation: 3,
                searchesPerUserPerDay: 5,
            },
            logger: { warn: vi.fn() },
            store: { incrementDailyUsage },
        });

        await expect(
            searchCode(
                { embeddingProvider: provider, quota, store },
                {
                    githubUserId: 123,
                    installationId: 7,
                    query: "build server",
                    repoId: 42,
                }
            )
        ).rejects.toMatchObject({
            code: "quota_searches_per_user_per_day_exceeded",
            statusCode: 429,
        });
        expect(incrementDailyUsage).toHaveBeenCalledWith({
            githubUserId: 123,
            metric: "search",
        });
        expect(embedQuery).not.toHaveBeenCalled();
        expect(search).not.toHaveBeenCalled();
    });

    it("formats search results as concise text", () => {
        const text = formatCodeSearchResponse({
            collection: "gh_repo_42_default",
            points: [
                {
                    id: "point-1",
                    payload: {
                        endLine: 4,
                        language: "TypeScript",
                        path: "src/server.ts",
                        startLine: 2,
                        text: "function buildServer() {}",
                    },
                    score: 0.9,
                },
            ],
            userUid: "gh_installation_7",
        });

        expect(text).toContain("Found 1 indexed code result");
        expect(text).toContain("src/server.ts:2-4 TypeScript score=0.9");
        expect(text).toContain("function buildServer() {}");
    });
});
