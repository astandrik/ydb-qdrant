import { describe, expect, it, vi } from "vitest";

import {
    indexingFingerprintForChunker,
    LineWindowChunker,
    type CodeChunker,
} from "../../src/code-indexer/chunker.js";
import { RepoIndexer } from "../../src/code-indexer/repoIndexer.js";
import { createCodeIndexerQuota, type CodeIndexerQuota } from "../../src/code-indexer/quota.js";
import { REPO_CONFIG_PATH } from "../../src/code-indexer/repoConfig.js";
import type {
    CodeChunk,
    CodeIndexStore,
    CodeSearchResult,
    EmbeddingProvider,
    GitHubChangedFile,
    GitHubContentClient,
    GitHubContentClientFactory,
    GitHubFileEntry,
    IndexedCodeChunk,
    IndexingJob,
    RepoIndexManifest,
    RepoManifestStore,
} from "../../src/code-indexer/types.js";

function repository() {
    return {
        defaultBranch: "main",
        owner: "octo",
        repo: "demo",
        repoId: 42,
    };
}

class FakeGitHubClient implements GitHubContentClient {
    changedFiles: GitHubChangedFile[] = [];
    compareCalls = 0;
    readonly contentRequests: Array<{ owner: string; path: string; repo: string }> =
        [];
    files: GitHubFileEntry[] = [];
    readonly listRequests: Array<{ owner: string; repo: string }> = [];
    readonly contents = new Map<string, string | null>();

    compareCommits(): Promise<GitHubChangedFile[]> {
        this.compareCalls += 1;
        return Promise.resolve(this.changedFiles);
    }

    getFileContent(params: {
        owner: string;
        path: string;
        repo: string;
    }): Promise<string | null> {
        this.contentRequests.push({
            owner: params.owner,
            path: params.path,
            repo: params.repo,
        });
        return Promise.resolve(this.contents.get(params.path) ?? null);
    }

    listRepositoryFiles(params: {
        owner: string;
        repo: string;
    }): Promise<GitHubFileEntry[]> {
        this.listRequests.push({ owner: params.owner, repo: params.repo });
        return Promise.resolve(this.files);
    }
}

class FakeManifestStore implements RepoManifestStore {
    readonly deletedManifests: Array<{ collection: string; userUid: string }> = [];
    readonly saved: RepoIndexManifest[] = [];
    private readonly manifests = new Map<string, RepoIndexManifest>();

    delete(params: { collection: string; userUid: string }): Promise<void> {
        this.deletedManifests.push(params);
        this.manifests.delete(this.keyFor(params));
        return Promise.resolve();
    }

    get(params: {
        collection: string;
        userUid: string;
    }): Promise<RepoIndexManifest | null> {
        return Promise.resolve(this.manifests.get(this.keyFor(params)) ?? null);
    }

    save(manifest: RepoIndexManifest): Promise<void> {
        this.saved.push(manifest);
        this.manifests.set(this.keyFor(manifest), manifest);
        return Promise.resolve();
    }

    seed(manifest: RepoIndexManifest): void {
        this.manifests.set(this.keyFor(manifest), manifest);
    }

    private keyFor(params: { collection: string; userUid: string }): string {
        return `${params.userUid}/${params.collection}`;
    }
}

class FakeStore implements CodeIndexStore {
    readonly deletedCollections: Array<{ collection: string; userUid: string }> = [];
    readonly deletedPaths: Array<{
        collection: string;
        pathSegments: string[];
        userUid: string;
    }> = [];
    readonly ensuredCollections: Array<{
        collection: string;
        dimension: number;
        userUid: string;
    }> = [];
    readonly resetCollections: Array<{
        collection: string;
        dimension: number;
        userUid: string;
    }> = [];
    readonly upserts: Array<{
        chunks: IndexedCodeChunk[];
        collection: string;
        userUid: string;
        vectors: number[][];
    }> = [];

    deleteCollection(params: {
        collection: string;
        userUid: string;
    }): Promise<void> {
        this.deletedCollections.push(params);
        return Promise.resolve();
    }

    deletePath(params: {
        collection: string;
        pathSegments: string[];
        userUid: string;
    }): Promise<void> {
        this.deletedPaths.push(params);
        return Promise.resolve();
    }

    ensureCollection(params: {
        collection: string;
        dimension: number;
        userUid: string;
    }): Promise<void> {
        this.ensuredCollections.push(params);
        return Promise.resolve();
    }

    resetCollection(params: {
        collection: string;
        dimension: number;
        userUid: string;
    }): Promise<void> {
        this.resetCollections.push(params);
        return Promise.resolve();
    }

    search(): Promise<CodeSearchResult[]> {
        return Promise.resolve([]);
    }

    upsertChunks(params: {
        chunks: IndexedCodeChunk[];
        collection: string;
        userUid: string;
        vectors: number[][];
    }): Promise<void> {
        this.upserts.push(params);
        return Promise.resolve();
    }
}

class FakeStatusStore {
    readonly statusUpdates: Array<Record<string, unknown>> = [];

    markRepositoryStatus(params: Record<string, unknown>): Promise<void> {
        this.statusUpdates.push(params);
        return Promise.resolve();
    }
}

const embeddingProvider: EmbeddingProvider = {
    dimension: 3,
    embedDocuments: vi.fn((texts: string[]) =>
        Promise.resolve(texts.map(() => [1, 0, 0]))
    ),
    embedQuery: vi.fn(() => Promise.resolve([1, 0, 0])),
};

const defaultTestChunker = new LineWindowChunker();
const defaultTestChunkingOptions = { chunkLines: 2, overlapLines: 0 };
const defaultIndexingFingerprint = indexingFingerprintForChunker(
    defaultTestChunker,
    defaultTestChunkingOptions
);

function makeDefaultManifest(
    files: RepoIndexManifest["files"] = [],
    indexingFingerprint: string | undefined = defaultIndexingFingerprint
): RepoIndexManifest {
    return {
        collection: "gh_repo_42_default",
        files,
        indexingFingerprint,
        ref: "refs/heads/main",
        repository: repository(),
        sha: "a".repeat(40),
        userUid: "gh_installation_7",
    };
}

function buildIndexer(
    client: FakeGitHubClient,
    store: FakeStore,
    manifestStore = new FakeManifestStore(),
    chunker: CodeChunker = defaultTestChunker,
    statusStore?: FakeStatusStore,
    quota?: CodeIndexerQuota
): RepoIndexer {
    const clientFactory: GitHubContentClientFactory = {
        forInstallation: vi.fn(() => Promise.resolve(client)),
    };
    return new RepoIndexer({
        clientFactory,
        chunker,
        embeddingProvider,
        manifestStore,
        options: defaultTestChunkingOptions,
        quota,
        statusStore,
        store,
    });
}

describe("code-indexer repo indexer", () => {
    it("full-index resets the default collection and upserts indexable chunks", async () => {
        const client = new FakeGitHubClient();
        client.files = [
            { path: "src/server.ts", sha: "blob-1", size: 50 },
            { path: "node_modules/pkg/index.js", sha: "blob-2", size: 50 },
        ];
        client.contents.set("src/server.ts", "line1\nline2\nline3");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const indexer = buildIndexer(client, store, manifestStore);

        await indexer.processJob({
            deliveryId: "delivery-1",
            installationId: 7,
            kind: "full-index",
            reason: "test",
            ref: "main",
            repository: repository(),
            sha: "commit-1",
        });

        expect(store.resetCollections).toEqual([
            {
                collection: "gh_repo_42_default",
                dimension: 3,
                userUid: "gh_installation_7",
            },
        ]);
        expect(store.upserts).toHaveLength(1);
        expect(store.upserts[0].chunks).toMatchObject([
            {
                blobSha: "blob-1",
                endLine: 2,
                path: "src/server.ts",
                pathSegments: ["src", "server.ts"],
                startLine: 1,
            },
            {
                blobSha: "blob-1",
                endLine: 3,
                path: "src/server.ts",
                pathSegments: ["src", "server.ts"],
                startLine: 3,
            },
        ]);
        expect(manifestStore.saved).toEqual([
            {
                collection: "gh_repo_42_default",
                files: [{ blobSha: "blob-1", path: "src/server.ts" }],
                indexingFingerprint: defaultIndexingFingerprint,
                ref: "main",
                repository: repository(),
                sha: "commit-1",
                userUid: "gh_installation_7",
            },
        ]);
    });

    it("reports repository indexing and ready status for full-index jobs", async () => {
        const client = new FakeGitHubClient();
        client.files = [{ path: "src/server.ts", sha: "blob-1", size: 50 }];
        client.contents.set("src/server.ts", "line1\nline2\nline3");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const statusStore = new FakeStatusStore();
        const indexer = buildIndexer(
            client,
            store,
            manifestStore,
            defaultTestChunker,
            statusStore
        );

        await indexer.processJob({
            installationId: 7,
            kind: "full-index",
            reason: "test",
            ref: "main",
            repository: repository(),
            sha: "commit-1",
        });

        expect(statusStore.statusUpdates[0]).toEqual({
            repoId: 42,
            status: "indexing",
        });

        const readyStatus = statusStore.statusUpdates[1];
        expect(readyStatus).toMatchObject({
            chunkCount: 2,
            lastIndexedSha: "commit-1",
            repoId: 42,
            status: "ready",
        });
        expect(readyStatus?.lastIndexedAt).toBeInstanceOf(Date);
    });

    it("rejects full indexing before content reads when the file quota is exceeded", async () => {
        const client = new FakeGitHubClient();
        client.files = [
            { path: "src/a.ts", sha: "blob-a", size: 50 },
            { path: "src/b.ts", sha: "blob-b", size: 50 },
            { path: "src/c.ts", sha: "blob-c", size: 50 },
        ];
        const store = new FakeStore();
        const quota = createCodeIndexerQuota({
            limits: {
                chunksPerRepo: 50,
                filesPerRepo: 2,
                reposPerInstallation: 10,
                searchesPerUserPerDay: 100,
            },
            logger: { warn: vi.fn() },
        });
        const indexer = buildIndexer(
            client,
            store,
            new FakeManifestStore(),
            defaultTestChunker,
            undefined,
            quota
        );

        await expect(
            indexer.processJob({
                installationId: 7,
                kind: "full-index",
                reason: "test",
                ref: "main",
                repository: repository(),
            })
        ).rejects.toMatchObject({
            code: "quota_files_per_repo_exceeded",
            statusCode: 422,
        });
        expect(client.contentRequests).toEqual([
            {
                owner: "octo",
                path: REPO_CONFIG_PATH,
                repo: "demo",
            },
        ]);
        expect(store.upserts).toEqual([]);
    });

    it("uses the injected code chunker implementation", async () => {
        const client = new FakeGitHubClient();
        client.files = [{ path: "src/server.ts", sha: "blob-1", size: 50 }];
        client.contents.set("src/server.ts", "line1\nline2\nline3");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const injectedChunk: CodeChunk = {
            chunkIndex: 0,
            endLine: 10,
            language: "Injected",
            path: "src/server.ts",
            pathSegments: ["src", "server.ts"],
            startLine: 4,
            text: "custom semantic chunk",
        };
        const chunkFileMock = vi.fn(() => [injectedChunk]);
        const chunker: CodeChunker = { chunkFile: chunkFileMock };
        const indexer = buildIndexer(client, store, manifestStore, chunker);

        await indexer.processJob({
            deliveryId: "delivery-1",
            installationId: 7,
            kind: "full-index",
            reason: "test",
            ref: "main",
            repository: repository(),
            sha: "commit-1",
        });

        expect(chunkFileMock).toHaveBeenCalledWith({
            content: "line1\nline2\nline3",
            options: {
                chunkLines: 2,
                maxChunkChars: undefined,
                maxFileBytes: undefined,
                overlapLines: 0,
            },
            path: "src/server.ts",
        });
        expect(store.upserts[0].chunks).toMatchObject([
            {
                endLine: 10,
                language: "Injected",
                startLine: 4,
                text: "custom semantic chunk",
            },
        ]);
    });

    it("incremental-push deletes old paths and indexes changed files", async () => {
        const client = new FakeGitHubClient();
        client.changedFiles = [
            {
                filename: "src/new.ts",
                previousFilename: "src/old.ts",
                sha: "blob-new",
                status: "renamed",
            },
            { filename: "src/deleted.ts", status: "removed" },
        ];
        client.contents.set("src/new.ts", "export const value = 1;");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        manifestStore.seed(
            makeDefaultManifest([
                { blobSha: "blob-deleted", path: "src/deleted.ts" },
                { blobSha: "blob-old", path: "src/old.ts" },
                { blobSha: "blob-unchanged", path: "src/unchanged.ts" },
            ])
        );
        const indexer = buildIndexer(client, store, manifestStore);

        const job: IndexingJob = {
            after: "b".repeat(40),
            before: "a".repeat(40),
            created: false,
            deleted: false,
            deliveryId: "delivery-1",
            forced: false,
            installationId: 7,
            kind: "incremental-push",
            ref: "refs/heads/main",
            repository: repository(),
        };
        await indexer.processJob(job);

        expect(store.ensuredCollections).toEqual([
            {
                collection: "gh_repo_42_default",
                dimension: 3,
                userUid: "gh_installation_7",
            },
        ]);
        expect(store.deletedPaths).toEqual([
            {
                collection: "gh_repo_42_default",
                pathSegments: ["src", "old.ts"],
                userUid: "gh_installation_7",
            },
            {
                collection: "gh_repo_42_default",
                pathSegments: ["src", "new.ts"],
                userUid: "gh_installation_7",
            },
            {
                collection: "gh_repo_42_default",
                pathSegments: ["src", "deleted.ts"],
                userUid: "gh_installation_7",
            },
        ]);
        expect(store.upserts[0].chunks[0]).toMatchObject({
            blobSha: "blob-new",
            path: "src/new.ts",
            sha: "b".repeat(40),
        });
        expect(manifestStore.saved.at(-1)).toEqual({
            collection: "gh_repo_42_default",
            files: [
                { blobSha: "blob-new", path: "src/new.ts" },
                { blobSha: "blob-unchanged", path: "src/unchanged.ts" },
            ],
            indexingFingerprint: defaultIndexingFingerprint,
            ref: "refs/heads/main",
            repository: repository(),
            sha: "b".repeat(40),
            userUid: "gh_installation_7",
        });
    });

    it("falls back to full reindex when the incremental manifest is missing", async () => {
        const client = new FakeGitHubClient();
        client.files = [{ path: "src/server.ts", sha: "blob-1", size: 50 }];
        client.contents.set("src/server.ts", "export const value = 1;");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const indexer = buildIndexer(client, store, manifestStore);

        await indexer.processJob({
            after: "b".repeat(40),
            before: "a".repeat(40),
            created: false,
            deleted: false,
            deliveryId: "delivery-1",
            forced: false,
            installationId: 7,
            kind: "incremental-push",
            ref: "refs/heads/main",
            repository: repository(),
        });

        expect(client.compareCalls).toBe(0);
        expect(store.resetCollections).toHaveLength(1);
        expect(store.ensuredCollections).toEqual([]);
        expect(manifestStore.saved.at(-1)).toMatchObject({
            collection: "gh_repo_42_default",
            files: [{ blobSha: "blob-1", path: "src/server.ts" }],
            sha: "b".repeat(40),
        });
    });

    it("falls back to full reindex when the manifest fingerprint is legacy or stale", async () => {
        const legacyManifest = makeDefaultManifest();
        delete legacyManifest.indexingFingerprint;
        const staleManifest = makeDefaultManifest([], "old-fingerprint");

        for (const manifest of [legacyManifest, staleManifest]) {
            const client = new FakeGitHubClient();
            client.files = [{ path: "src/server.ts", sha: "blob-1", size: 50 }];
            client.contents.set("src/server.ts", "export const value = 1;");
            const store = new FakeStore();
            const manifestStore = new FakeManifestStore();
            manifestStore.seed(manifest);
            const indexer = buildIndexer(client, store, manifestStore);

            await indexer.processJob({
                after: "b".repeat(40),
                before: "a".repeat(40),
                created: false,
                deleted: false,
                forced: false,
                installationId: 7,
                kind: "incremental-push",
                ref: "refs/heads/main",
                repository: repository(),
            });

            expect(client.compareCalls).toBe(0);
            expect(store.resetCollections).toHaveLength(1);
            expect(store.ensuredCollections).toEqual([]);
            expect(manifestStore.saved.at(-1)).toMatchObject({
                files: [{ blobSha: "blob-1", path: "src/server.ts" }],
                indexingFingerprint: defaultIndexingFingerprint,
                sha: "b".repeat(40),
            });
        }
    });

    it("falls back to full-index for forced pushes", async () => {
        const client = new FakeGitHubClient();
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const indexer = buildIndexer(client, store, manifestStore);

        await indexer.processJob({
            after: "b".repeat(40),
            before: "a".repeat(40),
            created: false,
            deleted: false,
            forced: true,
            installationId: 7,
            kind: "incremental-push",
            ref: "refs/heads/main",
            repository: repository(),
        });

        expect(store.resetCollections).toHaveLength(1);
        expect(store.ensuredCollections).toEqual([]);
        expect(manifestStore.saved.at(-1)).toMatchObject({
            collection: "gh_repo_42_default",
            sha: "b".repeat(40),
        });
    });

    it("indexes PR contents from the PR head repository", async () => {
        const client = new FakeGitHubClient();
        client.files = [{ path: "src/pr.ts", sha: "blob-pr", size: 20 }];
        client.contents.set("src/pr.ts", "export const pr = true;");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const indexer = buildIndexer(client, store, manifestStore);

        await indexer.processJob({
            baseRef: "main",
            headRef: "feature",
            headSha: "c".repeat(40),
            installationId: 7,
            kind: "pr-index",
            prNumber: 3,
            repository: repository(),
            sourceRepository: {
                defaultBranch: "main",
                owner: "contrib",
                repo: "fork",
                repoId: 99,
            },
        });

        expect(client.listRequests).toEqual([{ owner: "contrib", repo: "fork" }]);
        expect(client.contentRequests).toEqual([
            { owner: "octo", path: REPO_CONFIG_PATH, repo: "demo" },
            { owner: "contrib", path: "src/pr.ts", repo: "fork" },
        ]);
        expect(store.resetCollections[0]).toEqual({
            collection: "gh_repo_42_pr_3",
            dimension: 3,
            userUid: "gh_installation_7",
        });
        expect(store.upserts[0].chunks[0]).toMatchObject({
            path: "src/pr.ts",
            repoId: 42,
        });
        expect(manifestStore.saved.at(-1)).toEqual({
            collection: "gh_repo_42_pr_3",
            files: [{ blobSha: "blob-pr", path: "src/pr.ts" }],
            indexingFingerprint: defaultIndexingFingerprint,
            ref: "feature",
            repository: repository(),
            sha: "c".repeat(40),
            userUid: "gh_installation_7",
        });
    });

    it("deletes repo collections and manifests together", async () => {
        const client = new FakeGitHubClient();
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const statusStore = new FakeStatusStore();
        const indexer = buildIndexer(
            client,
            store,
            manifestStore,
            defaultTestChunker,
            statusStore
        );

        await indexer.processJob({
            installationId: 7,
            kind: "delete-repo-index",
            reason: "repository-deleted",
            repository: repository(),
        });

        expect(store.deletedCollections).toEqual([
            {
                collection: "gh_repo_42_default",
                userUid: "gh_installation_7",
            },
        ]);
        expect(manifestStore.deletedManifests).toEqual([
            {
                collection: "gh_repo_42_default",
                userUid: "gh_installation_7",
            },
        ]);
        expect(statusStore.statusUpdates).toContainEqual({
            repoId: 42,
            status: "deleted",
        });
    });

    it("reports sanitized final indexing failures", async () => {
        const client = new FakeGitHubClient();
        const store = new FakeStore();
        const statusStore = new FakeStatusStore();
        const indexer = buildIndexer(
            client,
            store,
            new FakeManifestStore(),
            defaultTestChunker,
            statusStore
        );

        await indexer.reportFinalFailure(
            {
                installationId: 7,
                kind: "full-index",
                reason: "test",
                ref: "main",
                repository: repository(),
            },
            new Error("boom\nwith\tunsafe whitespace")
        );

        expect(statusStore.statusUpdates).toEqual([
            {
                lastError: "boom with unsafe whitespace",
                repoId: 42,
                status: "failed",
            },
        ]);
    });

    it("applies repository include/exclude and chunk overrides", async () => {
        const client = new FakeGitHubClient();
        client.files = [
            { path: "src/keep.ts", sha: "blob-keep", size: 20 },
            { path: "src/skip.ts", sha: "blob-skip", size: 20 },
            { path: "docs/readme.md", sha: "blob-docs", size: 20 },
            { path: "package-lock.json", sha: "blob-lock", size: 20 },
        ];
        client.contents.set(
            REPO_CONFIG_PATH,
            JSON.stringify({
                chunkLines: 1,
                exclude: ["src/skip.ts"],
                include: ["src/**", "package-lock.json"],
                overlapLines: 0,
            })
        );
        client.contents.set("src/keep.ts", "line1\nline2");
        client.contents.set("package-lock.json", "{}");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        const indexer = buildIndexer(client, store, manifestStore);

        await indexer.processJob({
            installationId: 7,
            kind: "full-index",
            reason: "test",
            ref: "main",
            repository: repository(),
            sha: "commit-1",
        });

        expect(client.contentRequests.map((request) => request.path)).toEqual([
            REPO_CONFIG_PATH,
            "src/keep.ts",
            "package-lock.json",
        ]);
        expect(store.upserts).toHaveLength(2);
        expect(store.upserts[0].chunks).toMatchObject([
            { path: "src/keep.ts", text: "line1" },
            { path: "src/keep.ts", text: "line2" },
        ]);
        expect(store.upserts[1].chunks[0]).toMatchObject({
            path: "package-lock.json",
        });
        expect(manifestStore.saved.at(-1)?.files).toEqual([
            { blobSha: "blob-lock", path: "package-lock.json" },
            { blobSha: "blob-keep", path: "src/keep.ts" },
        ]);
    });

    it("falls back to full reindex when repository config changes", async () => {
        const client = new FakeGitHubClient();
        client.changedFiles = [
            {
                filename: REPO_CONFIG_PATH,
                sha: "blob-config",
                status: "modified",
            },
        ];
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        manifestStore.seed(makeDefaultManifest());
        const indexer = buildIndexer(client, store, manifestStore);

        await indexer.processJob({
            after: "b".repeat(40),
            before: "a".repeat(40),
            created: false,
            deleted: false,
            forced: false,
            installationId: 7,
            kind: "incremental-push",
            ref: "refs/heads/main",
            repository: repository(),
        });

        expect(store.resetCollections).toHaveLength(1);
        expect(store.ensuredCollections).toEqual([]);
        expect(manifestStore.saved.at(-1)).toMatchObject({
            collection: "gh_repo_42_default",
            sha: "b".repeat(40),
        });
    });
});
