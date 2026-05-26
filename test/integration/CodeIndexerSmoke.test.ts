import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { HashEmbeddingProvider } from "../../src/code-indexer/embeddings.js";
import { YdbQdrantIndexStore } from "../../src/code-indexer/indexStore.js";
import {
    defaultBranchCollectionForRepo,
    userUidForInstallation,
} from "../../src/code-indexer/naming.js";
import { RepoIndexer } from "../../src/code-indexer/repoIndexer.js";
import { searchCode } from "../../src/code-indexer/searchAdapter.js";
import {
    YdbIndexingProgressStore,
    YdbIndexingQueue,
    YdbRepoManifestStore,
} from "../../src/code-indexer/stateStore.js";
import type {
    GitHubChangedFile,
    GitHubContentClient,
    GitHubFileEntry,
    GitHubRepositoryRef,
} from "../../src/code-indexer/types.js";
import { createMetaTableIfMissing } from "./helpers/bootstrap-meta-table.js";

const hasSdkCredentials = [
    "YDB_ACCESS_TOKEN_CREDENTIALS",
    "YDB_ANONYMOUS_CREDENTIALS",
    "YDB_METADATA_CREDENTIALS",
    "YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS",
].some((name) => process.env[name]);
if (!hasSdkCredentials && !process.env.YDB_STATIC_CREDENTIALS_USER) {
    process.env.YDB_ANONYMOUS_CREDENTIALS = "1";
}

const ydbQdrantEndpoint =
    process.env.YDB_QDRANT_ENDPOINT ?? "grpc://127.0.0.1:2136";
if (
    !process.env.YDB_ENDPOINT &&
    /^grpc:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|$)/.test(ydbQdrantEndpoint)
) {
    // The local-ydb container can advertise its Docker hostname through discovery.
    // Keep app config on YDB_QDRANT_* while overriding the SDK endpoint locally.
    process.env.YDB_ENDPOINT = ydbQdrantEndpoint;
}

class FixtureGitHubClient implements GitHubContentClient {
    readonly files: GitHubFileEntry[] = [
        { path: "src/requestIdentity.ts", sha: "blob-request-identity", size: 210 },
        { path: "node_modules/pkg/index.js", sha: "blob-vendor", size: 20 },
    ];
    readonly contents = new Map<string, string>([
        [
            "src/requestIdentity.ts",
            [
                "export function resolveRequestIdentity() {",
                '    const namespace = "tenant scoped request identity";',
                "    return namespace;",
                "}",
            ].join("\n"),
        ],
    ]);

    compareCommits(): Promise<GitHubChangedFile[]> {
        return Promise.resolve([]);
    }

    getFileContent(params: {
        path: string;
    }): Promise<string | null> {
        return Promise.resolve(this.contents.get(params.path) ?? null);
    }

    listRepositoryFiles(): Promise<GitHubFileEntry[]> {
        return Promise.resolve(this.files);
    }
}

describe("code-indexer YDB integration smoke", () => {
    const installationId = Number(
        process.env.YDB_QDRANT_CODE_INDEXER_INSTALLATION_ID ?? "700001"
    );
    const repoId = Number(
        process.env.YDB_QDRANT_CODE_INDEXER_REPO_ID ?? `${Date.now()}`
    );
    const repository: GitHubRepositoryRef = {
        defaultBranch: "main",
        owner: "octo",
        repo: "code-indexer-fixture",
        repoId,
    };
    const collection = defaultBranchCollectionForRepo(repoId);
    const userUid = userUidForInstallation(installationId);
    const embeddingProvider = new HashEmbeddingProvider(64);
    const manifestStore = new YdbRepoManifestStore();
    const progressStore = new YdbIndexingProgressStore();
    const store = new YdbQdrantIndexStore({ includeTextInPayload: true });
    let ydbReady = false;

    beforeAll(async () => {
        await createMetaTableIfMissing();
        ydbReady = true;
    }, 60_000);

    afterAll(async () => {
        if (!ydbReady) {
            return;
        }
        await Promise.allSettled([
            store.deleteCollection({ collection, userUid }),
            manifestStore.delete({ collection, userUid }),
        ]);
    }, 60_000);

    it("indexes a fixture repository and finds a known code phrase", async () => {
        const client = new FixtureGitHubClient();
        const indexer = new RepoIndexer({
            clientFactory: {
                forInstallation: () => Promise.resolve(client),
            },
            embeddingProvider,
            manifestStore,
            options: { chunkLines: 4, overlapLines: 0 },
            progressStore,
            store,
        });
        const queue = new YdbIndexingQueue(
            (job, context) => indexer.processJob(job, context),
            { progressStore, retryBackoffMs: 0 }
        );

        const enqueued = await queue.enqueue({
            deliveryId: `integration-code-indexer-smoke-${repoId}`,
            installationId,
            kind: "full-index",
            reason: "integration-smoke",
            ref: repository.defaultBranch,
            repository,
            sha: "f".repeat(40),
        });

        await vi.waitFor(
            async () => {
                const progress = await progressStore.getJobProgress(
                    enqueued.jobId
                );
                expect(progress).toMatchObject({
                    jobId: enqueued.jobId,
                    phase: "completed",
                    processedFiles: 1,
                    status: "completed",
                    totalFiles: 1,
                });
                expect(progress?.processedChunks).toBeGreaterThan(0);
            },
            { timeout: 30_000 }
        );

        const manifest = await manifestStore.get({ collection, userUid });
        expect(manifest?.files).toEqual([
            {
                blobSha: "blob-request-identity",
                chunkCount: 1,
                path: "src/requestIdentity.ts",
            },
        ]);

        const result = await searchCode(
            { embeddingProvider, store },
            {
                installationId,
                query: "tenant scoped request identity",
                repoId,
                top: 3,
            }
        );
        const paths = result.points.map((point) => point.payload?.path);

        expect(paths).toContain("src/requestIdentity.ts");
    }, 60_000);
});
