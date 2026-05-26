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
    GitHubRepositorySnapshot,
    GitHubRepositorySnapshotContent,
    GitHubRepositorySnapshotFile,
    IndexedCodeChunk,
    IndexingJob,
    IndexingProgressStore,
    IndexingJobProgressUpdate,
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
    readonly contentRequests: Array<{
        owner: string;
        path: string;
        ref?: string;
        repo: string;
    }> = [];
    files: GitHubFileEntry[] = [];
    readonly listRequests: Array<{ owner: string; ref?: string; repo: string }> = [];
    readonly contents = new Map<string, string | null>();

    compareCommits(): Promise<GitHubChangedFile[]> {
        this.compareCalls += 1;
        return Promise.resolve(this.changedFiles);
    }

    getFileContent(params: {
        owner: string;
        path: string;
        ref?: string;
        repo: string;
    }): Promise<string | null> {
        this.contentRequests.push({
            owner: params.owner,
            path: params.path,
            ref: params.ref,
            repo: params.repo,
        });
        return Promise.resolve(this.contents.get(params.path) ?? null);
    }

    listRepositoryFiles(params: {
        owner: string;
        ref?: string;
        repo: string;
    }): Promise<GitHubFileEntry[]> {
        this.listRequests.push({
            owner: params.owner,
            ref: params.ref,
            repo: params.repo,
        });
        return Promise.resolve(this.files);
    }
}

class FakeRepositorySnapshot implements GitHubRepositorySnapshot {
    closed = false;

    constructor(
        readonly files: GitHubRepositorySnapshotFile[],
        private readonly contents: Map<string, GitHubRepositorySnapshotContent | null>
    ) {}

    close(): Promise<void> {
        this.closed = true;
        return Promise.resolve();
    }

    getFileContent(path: string): Promise<GitHubRepositorySnapshotContent | null> {
        return Promise.resolve(this.contents.get(path) ?? null);
    }
}

class FakeSnapshotGitHubClient extends FakeGitHubClient {
    readonly snapshotRequests: Array<{ owner: string; ref: string; repo: string }> =
        [];
    snapshot: FakeRepositorySnapshot | null = null;

    getRepositorySnapshot(params: {
        owner: string;
        ref: string;
        repo: string;
    }): Promise<GitHubRepositorySnapshot> {
        this.snapshotRequests.push(params);
        if (!this.snapshot) {
            throw new Error("missing fake repository snapshot");
        }
        return Promise.resolve(this.snapshot);
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

    listCollectionsByPrefix(params: {
        collectionPrefix: string;
        userUid: string;
    }): Promise<string[]> {
        const keyPrefix = `${params.userUid}/${params.collectionPrefix}`;
        return Promise.resolve(
            [...this.manifests.keys()]
                .filter((key) => key.startsWith(keyPrefix))
                .map((key) => key.slice(`${params.userUid}/`.length))
                .sort()
        );
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
    collectionCount = 0;
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

    countCollection(): Promise<number> {
        return Promise.resolve(this.collectionCount);
    }

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

class FakeProgressStore implements IndexingProgressStore {
    readonly updates: Array<{
        jobId: string;
        update: IndexingJobProgressUpdate;
    }> = [];

    createJobProgress = vi.fn();
    getJobProgress = vi.fn();
    listActiveJobsForInstallation = vi.fn();

    updateJobProgress(params: {
        jobId: string;
        update: IndexingJobProgressUpdate;
    }): Promise<void> {
        this.updates.push(params);
        return Promise.resolve();
    }
}

const embeddingProvider: EmbeddingProvider = {
    dimension: 3,
    fingerprint: "test-embedding:v1:dimension=3",
    embedDocuments: vi.fn((texts: string[]) =>
        Promise.resolve(texts.map(() => [1, 0, 0]))
    ),
    embedQuery: vi.fn(() => Promise.resolve([1, 0, 0])),
};

const defaultTestChunker = new LineWindowChunker();
const defaultTestChunkingOptions = { chunkLines: 2, overlapLines: 0 };
const defaultChunkerFingerprint = indexingFingerprintForChunker(
    defaultTestChunker,
    defaultTestChunkingOptions
);
const defaultIndexingFingerprint = `chunker:${defaultChunkerFingerprint}|embedding:${embeddingProvider.fingerprint}`;

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
    quota?: CodeIndexerQuota,
    progressStore?: IndexingProgressStore,
    provider: EmbeddingProvider = embeddingProvider,
    extraOptions: Record<string, unknown> = {}
): RepoIndexer {
    const clientFactory: GitHubContentClientFactory = {
        forInstallation: vi.fn(() => Promise.resolve(client)),
    };
    return new RepoIndexer({
        clientFactory,
        chunker,
        embeddingProvider: provider,
        manifestStore,
        options: { ...defaultTestChunkingOptions, ...extraOptions } as never,
        progressStore,
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
                files: [
                    { blobSha: "blob-1", chunkCount: 2, path: "src/server.ts" },
                ],
                indexingFingerprint: defaultIndexingFingerprint,
                ref: "main",
                repository: repository(),
                sha: "commit-1",
                userUid: "gh_installation_7",
            },
        ]);
    });

    it("full-index reads repository files from a snapshot when the GitHub client provides one", async () => {
        const client = new FakeSnapshotGitHubClient();
        client.snapshot = new FakeRepositorySnapshot(
            [
                { path: "src/server.ts", size: 50 },
                { path: "node_modules/pkg/index.js", size: 50 },
            ],
            new Map([
                [
                    "src/server.ts",
                    {
                        blobSha: "archive-blob-1",
                        content: "line1\nline2\nline3",
                    },
                ],
                [
                    "node_modules/pkg/index.js",
                    {
                        blobSha: "archive-blob-2",
                        content: "ignored",
                    },
                ],
            ])
        );
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

        expect(client.snapshotRequests).toEqual([
            { owner: "octo", ref: "commit-1", repo: "demo" },
        ]);
        expect(client.listRequests).toEqual([]);
        expect(client.contentRequests).toEqual([
            { owner: "octo", path: REPO_CONFIG_PATH, ref: "commit-1", repo: "demo" },
        ]);
        expect(client.snapshot.closed).toBe(true);
        expect(store.upserts[0].chunks).toMatchObject([
            {
                blobSha: "archive-blob-1",
                path: "src/server.ts",
            },
            {
                blobSha: "archive-blob-1",
                path: "src/server.ts",
            },
        ]);
        expect(manifestStore.saved[0].files).toEqual([
            { blobSha: "archive-blob-1", chunkCount: 2, path: "src/server.ts" },
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

    it("reports full-index job progress phases and counters", async () => {
        const client = new FakeGitHubClient();
        client.files = [{ path: "src/server.ts", sha: "blob-1", size: 50 }];
        client.contents.set("src/server.ts", "line1\nline2\nline3");
        const store = new FakeStore();
        const progressStore = new FakeProgressStore();
        const indexer = buildIndexer(
            client,
            store,
            new FakeManifestStore(),
            defaultTestChunker,
            undefined,
            undefined,
            progressStore
        );

        await indexer.processJob(
            {
                installationId: 7,
                kind: "full-index",
                reason: "test",
                ref: "main",
                repository: repository(),
                sha: "commit-1",
            },
            { jobId: "job-1" }
        );

        expect(progressStore.updates.map((entry) => entry.update.phase)).toEqual(
            expect.arrayContaining([
                "loading_config",
                "fetching_tree",
                "processing_files",
                "resetting_collection",
                "fetching_file",
                "chunking",
                "embedding",
                "upserting",
                "saving_manifest",
            ])
        );
        expect(progressStore.updates).toContainEqual({
            jobId: "job-1",
            update: {
                phase: "processing_files",
                processedChunks: 0,
                processedFiles: 0,
                totalChunks: 0,
                totalFiles: 1,
            },
        });
        expect(
            progressStore.updates.some(
                (entry) =>
                    entry.jobId === "job-1" &&
                    entry.update.currentPath === "src/server.ts" &&
                    entry.update.phase === "embedding" &&
                    entry.update.totalChunks === 2
            )
        ).toBe(true);
        expect(
            progressStore.updates.some(
                (entry) =>
                    entry.jobId === "job-1" &&
                    entry.update.currentPath === "src/server.ts" &&
                    entry.update.phase === "processing_files" &&
                    entry.update.processedChunks === 2 &&
                    entry.update.processedFiles === 1
            )
        ).toBe(true);
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
                ref: "main",
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

    it("batches embeddings across files during full indexing", async () => {
        const client = new FakeGitHubClient();
        client.files = [
            { path: "src/a.ts", sha: "blob-a", size: 50 },
            { path: "src/b.ts", sha: "blob-b", size: 50 },
            { path: "src/c.ts", sha: "blob-c", size: 50 },
        ];
        client.contents.set("src/a.ts", "a");
        client.contents.set("src/b.ts", "b");
        client.contents.set("src/c.ts", "c");
        const chunker: CodeChunker = {
            chunkFile: vi.fn(({ path }: { path: string }) => [
                {
                    chunkIndex: 0,
                    endLine: 1,
                    language: "TypeScript",
                    path,
                    pathSegments: path.split("/"),
                    startLine: 1,
                    text: `${path}:one`,
                },
                {
                    chunkIndex: 1,
                    endLine: 2,
                    language: "TypeScript",
                    path,
                    pathSegments: path.split("/"),
                    startLine: 2,
                    text: `${path}:two`,
                },
            ]),
        };
        const embedDocuments = vi.fn((texts: string[]) =>
            Promise.resolve(texts.map(() => [1, 0, 0]))
        );
        const provider: EmbeddingProvider = {
            dimension: 3,
            fingerprint: "test-embedding:v1:dimension=3",
            embedDocuments,
            embedQuery: vi.fn(() => Promise.resolve([1, 0, 0])),
        };
        const store = new FakeStore();
        const indexer = buildIndexer(
            client,
            store,
            new FakeManifestStore(),
            chunker,
            undefined,
            undefined,
            undefined,
            provider,
            {
                embeddingBatchSize: 3,
                fileConcurrency: 2,
            }
        );

        await indexer.processJob({
            deliveryId: "delivery-1",
            installationId: 7,
            kind: "full-index",
            reason: "test",
            ref: "main",
            repository: repository(),
            sha: "commit-1",
        });

        expect(embedDocuments).toHaveBeenCalledTimes(2);
        expect(embedDocuments.mock.calls.map(([texts]) => texts)).toEqual([
            ["src/a.ts:one", "src/a.ts:two", "src/b.ts:one"],
            ["src/b.ts:two", "src/c.ts:one", "src/c.ts:two"],
        ]);
        expect(store.upserts).toHaveLength(2);
        expect(store.upserts.map((upsert) => upsert.chunks)).toEqual([
            expect.arrayContaining([
                expect.objectContaining({ path: "src/a.ts", text: "src/a.ts:one" }),
                expect.objectContaining({ path: "src/a.ts", text: "src/a.ts:two" }),
                expect.objectContaining({ path: "src/b.ts", text: "src/b.ts:one" }),
            ]),
            expect.arrayContaining([
                expect.objectContaining({ path: "src/b.ts", text: "src/b.ts:two" }),
                expect.objectContaining({ path: "src/c.ts", text: "src/c.ts:one" }),
                expect.objectContaining({ path: "src/c.ts", text: "src/c.ts:two" }),
            ]),
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
        store.collectionCount = 5;
        const manifestStore = new FakeManifestStore();
        const statusStore = new FakeStatusStore();
        manifestStore.seed(
            makeDefaultManifest([
                { blobSha: "blob-deleted", chunkCount: 1, path: "src/deleted.ts" },
                { blobSha: "blob-old", chunkCount: 1, path: "src/old.ts" },
                {
                    blobSha: "blob-unchanged",
                    chunkCount: 4,
                    path: "src/unchanged.ts",
                },
            ])
        );
        const indexer = buildIndexer(
            client,
            store,
            manifestStore,
            defaultTestChunker,
            statusStore
        );

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
                { blobSha: "blob-new", chunkCount: 1, path: "src/new.ts" },
                {
                    blobSha: "blob-unchanged",
                    chunkCount: 4,
                    path: "src/unchanged.ts",
                },
            ],
            indexingFingerprint: defaultIndexingFingerprint,
            ref: "refs/heads/main",
            repository: repository(),
            sha: "b".repeat(40),
            userUid: "gh_installation_7",
        });
        expect(statusStore.statusUpdates.at(-1)).toMatchObject({
            chunkCount: 5,
            lastIndexedSha: "b".repeat(40),
            repoId: 42,
            status: "ready",
        });
    });

    it("uses existing manifest chunk counts for incremental chunk quota checks", async () => {
        const client = new FakeGitHubClient();
        client.changedFiles = [
            { filename: "src/changed.ts", sha: "blob-new", status: "modified" },
        ];
        client.contents.set("src/changed.ts", "one\ntwo\nthree\nfour\nfive");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        manifestStore.seed(
            makeDefaultManifest([
                { blobSha: "blob-old", chunkCount: 1, path: "src/changed.ts" },
                {
                    blobSha: "blob-unchanged",
                    chunkCount: 9,
                    path: "src/unchanged.ts",
                },
            ])
        );
        const quota = createCodeIndexerQuota({
            limits: {
                chunksPerRepo: 11,
                filesPerRepo: 10,
                reposPerInstallation: 10,
                searchesPerUserPerDay: 10,
            },
            logger: { warn: vi.fn() },
        });
        const indexer = buildIndexer(
            client,
            store,
            manifestStore,
            defaultTestChunker,
            undefined,
            quota
        );

        await expect(
            indexer.processJob({
                after: "b".repeat(40),
                before: "a".repeat(40),
                created: false,
                deleted: false,
                forced: false,
                installationId: 7,
                kind: "incremental-push",
                ref: "refs/heads/main",
                repository: repository(),
            })
        ).rejects.toMatchObject({
            code: "quota_chunks_per_repo_exceeded",
            statusCode: 422,
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

    it("falls back to full reindex when compare reaches GitHub's 300-file cap", async () => {
        const client = new FakeGitHubClient();
        client.changedFiles = Array.from({ length: 300 }, (_, index) => ({
            filename: `src/file-${index}.ts`,
            sha: `blob-${index}`,
            status: "modified",
        }));
        client.files = [{ path: "src/server.ts", sha: "blob-1", size: 50 }];
        client.contents.set("src/server.ts", "export const value = 1;");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        manifestStore.seed(makeDefaultManifest([]));
        const indexer = buildIndexer(
            client,
            store,
            manifestStore,
            defaultTestChunker,
            undefined,
            undefined,
            undefined,
            embeddingProvider,
            { maxChangedFilesForIncremental: 1_000 }
        );

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

    it("falls back to full reindex when the manifest fingerprint is legacy or stale", async () => {
        const legacyManifest = makeDefaultManifest();
        delete legacyManifest.indexingFingerprint;
        const chunkerOnlyManifest = makeDefaultManifest(
            [{ blobSha: "old-blob", path: "src/server.ts" }],
            defaultChunkerFingerprint
        );
        const staleManifest = makeDefaultManifest([], "old-fingerprint");

        for (const manifest of [
            legacyManifest,
            chunkerOnlyManifest,
            staleManifest,
        ]) {
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

    it("falls back to full reindex when the embedding fingerprint changes", async () => {
        const client = new FakeGitHubClient();
        client.files = [{ path: "src/server.ts", sha: "blob-1", size: 50 }];
        client.contents.set("src/server.ts", "export const value = 1;");
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        manifestStore.seed(
            makeDefaultManifest(
                [{ blobSha: "old-blob", path: "src/server.ts" }],
                `chunker:${defaultChunkerFingerprint}|embedding:test-embedding:v1:dimension=1536`
            )
        );
        const provider512: EmbeddingProvider = {
            dimension: 512,
            fingerprint: "test-embedding:v1:dimension=512",
            embedDocuments: vi.fn((texts: string[]) =>
                Promise.resolve(texts.map(() => [1, 0, 0]))
            ),
            embedQuery: vi.fn(() => Promise.resolve([1, 0, 0])),
        };
        const indexer = buildIndexer(
            client,
            store,
            manifestStore,
            defaultTestChunker,
            undefined,
            undefined,
            undefined,
            provider512
        );

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
        expect(store.resetCollections).toEqual([
            {
                collection: "gh_repo_42_default",
                dimension: 512,
                userUid: "gh_installation_7",
            },
        ]);
        expect(store.ensuredCollections).toEqual([]);
        expect(manifestStore.saved.at(-1)).toMatchObject({
            files: [{ blobSha: "blob-1", path: "src/server.ts" }],
            indexingFingerprint: `chunker:${defaultChunkerFingerprint}|embedding:test-embedding:v1:dimension=512`,
            sha: "b".repeat(40),
        });
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

    it("indexes PR contents through the installation-scoped base repository ref", async () => {
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

        expect(client.listRequests).toEqual([
            { owner: "octo", ref: "refs/pull/3/head", repo: "demo" },
        ]);
        expect(client.contentRequests).toEqual([
            { owner: "octo", path: REPO_CONFIG_PATH, ref: "main", repo: "demo" },
            {
                owner: "octo",
                path: "src/pr.ts",
                ref: "refs/pull/3/head",
                repo: "demo",
            },
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
            files: [{ blobSha: "blob-pr", chunkCount: 1, path: "src/pr.ts" }],
            indexingFingerprint: defaultIndexingFingerprint,
            ref: "feature",
            repository: repository(),
            sha: "c".repeat(40),
            userUid: "gh_installation_7",
        });
    });

    it("does not update default-branch repository status for PR index jobs", async () => {
        const client = new FakeGitHubClient();
        client.files = [{ path: "src/pr.ts", sha: "blob-pr", size: 20 }];
        client.contents.set("src/pr.ts", "export const pr = true;");
        const store = new FakeStore();
        const statusStore = new FakeStatusStore();
        const indexer = buildIndexer(
            client,
            store,
            new FakeManifestStore(),
            defaultTestChunker,
            statusStore
        );

        await indexer.processJob({
            baseRef: "main",
            headRef: "feature",
            headSha: "c".repeat(40),
            installationId: 7,
            kind: "pr-index",
            prNumber: 3,
            repository: repository(),
            sourceRepository: repository(),
        });

        expect(statusStore.statusUpdates).toEqual([]);
    });

    it("deletes repo collections and manifests together", async () => {
        const client = new FakeGitHubClient();
        const store = new FakeStore();
        const manifestStore = new FakeManifestStore();
        manifestStore.seed({
            ...makeDefaultManifest(),
            collection: "gh_repo_42_default",
        });
        manifestStore.seed({
            ...makeDefaultManifest(),
            collection: "gh_repo_42_pr_3",
            ref: "feature",
        });
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
            {
                collection: "gh_repo_42_pr_3",
                userUid: "gh_installation_7",
            },
        ]);
        expect(manifestStore.deletedManifests).toEqual([
            {
                collection: "gh_repo_42_default",
                userUid: "gh_installation_7",
            },
            {
                collection: "gh_repo_42_pr_3",
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
        const upsertedChunks = store.upserts.flatMap((upsert) => upsert.chunks);
        expect(upsertedChunks).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "src/keep.ts", text: "line1" }),
                expect.objectContaining({ path: "src/keep.ts", text: "line2" }),
            ])
        );
        expect(upsertedChunks.at(-1)).toMatchObject({
            path: "package-lock.json",
        });
        expect(manifestStore.saved.at(-1)?.files).toEqual([
            { blobSha: "blob-lock", chunkCount: 1, path: "package-lock.json" },
            { blobSha: "blob-keep", chunkCount: 2, path: "src/keep.ts" },
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
