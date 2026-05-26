import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createYdbQdrantClient: vi.fn(),
    searchPoints: vi.fn(),
    upsertPoints: vi.fn(),
}));

vi.mock("../../src/package/api.js", () => {
    class QdrantServiceError extends Error {
        readonly statusCode: number;
        readonly payload: { status: string; error: unknown };

        constructor(
            statusCode: number,
            payload: { status: string; error: unknown },
            message?: string
        ) {
            super(message ?? String(payload.error));
            this.statusCode = statusCode;
            this.payload = payload;
        }
    }

    return {
        createYdbQdrantClient: mocks.createYdbQdrantClient,
        QdrantServiceError,
    };
});

describe("code-indexer index store", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createYdbQdrantClient.mockResolvedValue({
            searchPoints: mocks.searchPoints,
            upsertPoints: mocks.upsertPoints,
        });
        mocks.searchPoints.mockResolvedValue({ points: [] });
        mocks.upsertPoints.mockResolvedValue(undefined);
    });

    it("returns empty search results when the index collection is missing", async () => {
        const { YdbQdrantIndexStore } = await import(
            "../../src/code-indexer/indexStore.js"
        );
        const { QdrantServiceError } = await import("../../src/package/api.js");
        mocks.searchPoints.mockRejectedValueOnce(
            new QdrantServiceError(404, {
                error: "collection not found",
                status: "error",
            })
        );
        const store = new YdbQdrantIndexStore();

        const result = await store.search({
            collection: "gh_repo_42_default",
            queryVector: [1, 0, 0],
            top: 5,
            userUid: "gh_installation_7",
        });

        expect(result).toEqual([]);
    });

    it("propagates non-404 search failures", async () => {
        const { YdbQdrantIndexStore } = await import(
            "../../src/code-indexer/indexStore.js"
        );
        const { QdrantServiceError } = await import("../../src/package/api.js");
        const error = new QdrantServiceError(500, {
            error: "backend unavailable",
            status: "error",
        });
        mocks.searchPoints.mockRejectedValueOnce(error);
        const store = new YdbQdrantIndexStore();

        await expect(
            store.search({
                collection: "gh_repo_42_default",
                queryVector: [1, 0, 0],
                top: 5,
                userUid: "gh_installation_7",
            })
        ).rejects.toBe(error);
    });

    it("writes optional chunk metadata into Qdrant payloads", async () => {
        const { YdbQdrantIndexStore } = await import(
            "../../src/code-indexer/indexStore.js"
        );
        const store = new YdbQdrantIndexStore();

        await store.upsertChunks({
            chunks: [
                {
                    blobSha: "blob-1",
                    chunker: "tree-sitter",
                    chunkIndex: 0,
                    chunkKind: "function",
                    endLine: 4,
                    language: "TypeScript",
                    owner: "octo",
                    path: "src/server.ts",
                    pathSegments: ["src", "server.ts"],
                    ref: "main",
                    repo: "demo",
                    repoId: 42,
                    sha: "commit-1",
                    startLine: 1,
                    symbolName: "start",
                    symbolPath: "Server.start",
                    text: "export function start() {}",
                },
            ],
            collection: "gh_repo_42_default",
            userUid: "gh_installation_7",
            vectors: [[1, 0, 0]],
        });

        type UpsertBody = { points: Array<{ payload: Record<string, unknown> }> };
        const calls = mocks.upsertPoints.mock.calls as unknown as Array<
            [string, UpsertBody]
        >;
        expect(calls).toHaveLength(1);
        expect(calls[0][0]).toBe("gh_repo_42_default");
        expect(calls[0][1].points[0]?.payload).toMatchObject({
            chunker: "tree-sitter",
            chunkKind: "function",
            symbolName: "start",
            symbolPath: "Server.start",
        });
    });
});
