import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createYdbQdrantClient: vi.fn(),
    upsertPoints: vi.fn(),
}));

vi.mock("../../src/package/api.js", () => {
    class QdrantServiceError extends Error {
        readonly statusCode: number;

        constructor(statusCode: number, message: string) {
            super(message);
            this.statusCode = statusCode;
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
            upsertPoints: mocks.upsertPoints,
        });
        mocks.upsertPoints.mockResolvedValue(undefined);
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
