import {
    branchNameFromRef,
    defaultBranchCollectionForRepo,
    isAllZeroSha,
    pathSegmentsForPath,
    pullRequestCollectionForRepo,
    userUidForInstallation,
} from "./naming.js";
import {
    defaultCodeChunker,
    indexingFingerprintForChunker,
    shouldIndexFile,
    type ChunkingOptions,
    type CodeChunker,
} from "./chunker.js";
import {
    loadRepoIndexingConfig,
    REPO_CONFIG_PATH,
    type RepoIndexingConfig,
} from "./repoConfig.js";
import type { CodeIndexerQuota } from "./quota.js";
import type {
    CodeIndexStore,
    EmbeddingProvider,
    FullIndexJob,
    GitHubChangedFile,
    GitHubContentClient,
    GitHubContentClientFactory,
    GitHubRepositoryRef,
    IndexedCodeChunk,
    IndexingJob,
    PullRequestIndexJob,
    RepoManifestFile,
    RepoManifestStore,
} from "./types.js";

export type RepoIndexerOptions = ChunkingOptions & {
    maxChangedFilesForIncremental?: number;
};

export type RepoIndexerStatusStore = {
    markRepositoryStatus(params: {
        chunkCount?: number;
        lastError?: string;
        lastIndexedAt?: Date;
        lastIndexedSha?: string;
        repoId: number | string;
        status: "queued" | "indexing" | "ready" | "failed" | "deleted";
    }): Promise<void>;
};

export type RepoIndexerQuotaStore = {
    listRepositoriesForInstallation(
        installationId: number | string
    ): Promise<Array<{ status?: string }>>;
};

const DEFAULT_MAX_CHANGED_FILES = 300;

function mergeChunkingOptions(
    base: ChunkingOptions,
    repoConfig: RepoIndexingConfig
): ChunkingOptions {
    return {
        ...base,
        ...repoConfig,
    };
}

function changesRepoConfig(changedFile: GitHubChangedFile): boolean {
    return (
        changedFile.filename === REPO_CONFIG_PATH ||
        changedFile.previousFilename === REPO_CONFIG_PATH
    );
}

export class RepoIndexer {
    private readonly chunkingOptions: ChunkingOptions;
    private readonly chunker: CodeChunker;
    private readonly clientFactory: GitHubContentClientFactory;
    private readonly embeddingProvider: EmbeddingProvider;
    private readonly manifestStore: RepoManifestStore;
    private readonly maxChangedFilesForIncremental: number;
    private readonly quota?: CodeIndexerQuota;
    private readonly quotaStore?: RepoIndexerQuotaStore;
    private readonly statusStore?: RepoIndexerStatusStore;
    private readonly store: CodeIndexStore;

    constructor(params: {
        clientFactory: GitHubContentClientFactory;
        chunker?: CodeChunker;
        embeddingProvider: EmbeddingProvider;
        manifestStore: RepoManifestStore;
        options?: RepoIndexerOptions;
        quota?: CodeIndexerQuota;
        quotaStore?: RepoIndexerQuotaStore;
        statusStore?: RepoIndexerStatusStore;
        store: CodeIndexStore;
    }) {
        this.clientFactory = params.clientFactory;
        this.chunker = params.chunker ?? defaultCodeChunker;
        this.embeddingProvider = params.embeddingProvider;
        this.manifestStore = params.manifestStore;
        this.quota = params.quota;
        this.quotaStore = params.quotaStore;
        this.statusStore = params.statusStore;
        this.store = params.store;
        this.maxChangedFilesForIncremental =
            params.options?.maxChangedFilesForIncremental ??
            DEFAULT_MAX_CHANGED_FILES;
        this.chunkingOptions = {
            chunkLines: params.options?.chunkLines,
            maxChunkChars: params.options?.maxChunkChars,
            maxFileBytes: params.options?.maxFileBytes,
            overlapLines: params.options?.overlapLines,
        };
    }

    async processJob(job: IndexingJob): Promise<void> {
        switch (job.kind) {
            case "full-index":
                await this.assertRepositoryQuota(job);
                await this.markIndexing(job);
                await this.markReady(job, await this.fullIndex(job));
                return;
            case "incremental-push":
                await this.assertRepositoryQuota(job);
                await this.markIndexing(job);
                if (shouldFallbackToFullIndex(job)) {
                    const fallbackJob: FullIndexJob = {
                        deliveryId: job.deliveryId,
                        installationId: job.installationId,
                        kind: "full-index",
                        reason: "incremental-fallback",
                        ref: job.repository.defaultBranch,
                        repository: job.repository,
                        sha: job.after,
                    };
                    await this.markReady(job, await this.fullIndex(fallbackJob));
                    return;
                }
                await this.markReady(job, await this.incrementalPush(job));
                return;
            case "delete-repo-index":
                await this.store.deleteCollection({
                    collection: defaultBranchCollectionForRepo(job.repository.repoId),
                    userUid: userUidForInstallation(job.installationId),
                });
                await this.manifestStore.delete({
                    collection: defaultBranchCollectionForRepo(job.repository.repoId),
                    userUid: userUidForInstallation(job.installationId),
                });
                await this.markDeleted(job);
                return;
            case "pr-index":
                await this.assertRepositoryQuota(job);
                await this.markIndexing(job);
                await this.markReady(job, await this.pullRequestIndex(job));
                return;
            case "delete-pr-index":
                await this.store.deleteCollection({
                    collection: pullRequestCollectionForRepo(
                        job.repository.repoId,
                        job.prNumber
                    ),
                    userUid: userUidForInstallation(job.installationId),
                });
                await this.manifestStore.delete({
                    collection: pullRequestCollectionForRepo(
                        job.repository.repoId,
                        job.prNumber
                    ),
                    userUid: userUidForInstallation(job.installationId),
                });
                return;
        }
    }

    async reportFinalFailure(job: IndexingJob, err: unknown): Promise<void> {
        if (!this.statusStore || job.kind === "delete-pr-index") {
            return;
        }
        await this.statusStore.markRepositoryStatus({
            lastError: sanitizeError(err),
            repoId: job.repository.repoId,
            status: "failed",
        });
    }

    private async fullIndex(job: FullIndexJob): Promise<IndexingStatusResult> {
        const client = await this.clientFactory.forInstallation(job.installationId);
        const collection = defaultBranchCollectionForRepo(job.repository.repoId);
        const userUid = userUidForInstallation(job.installationId);
        const ref = job.sha ?? job.ref;
        const repoConfig = await loadRepoIndexingConfig({
            client,
            ref,
            repository: job.repository,
        });
        const chunkingOptions = mergeChunkingOptions(
            this.chunkingOptions,
            repoConfig
        );
        const indexingFingerprint = this.indexingFingerprint(chunkingOptions);

        const indexed = await this.indexRepositoryRef({
            client,
            collection,
            contentRepository: job.repository,
            chunkingOptions,
            installationId: job.installationId,
            prepareCollection: async () => {
                await this.store.resetCollection({
                    collection,
                    dimension: this.embeddingProvider.dimension,
                    userUid,
                });
            },
            repository: job.repository,
            sha: job.sha ?? job.ref,
            ref,
            userUid,
        });
        await this.manifestStore.save({
            collection,
            files: indexed.files,
            indexingFingerprint,
            ref: job.ref,
            repository: job.repository,
            sha: job.sha ?? job.ref,
            userUid,
        });
        return {
            chunkCount: indexed.chunkCount,
            lastIndexedSha: job.sha ?? job.ref,
        };
    }

    private async pullRequestIndex(
        job: PullRequestIndexJob
    ): Promise<IndexingStatusResult> {
        const client = await this.clientFactory.forInstallation(job.installationId);
        const collection = pullRequestCollectionForRepo(
            job.repository.repoId,
            job.prNumber
        );
        const userUid = userUidForInstallation(job.installationId);
        const repoConfig = await loadRepoIndexingConfig({
            client,
            ref: job.baseRef,
            repository: job.repository,
        });
        const chunkingOptions = mergeChunkingOptions(
            this.chunkingOptions,
            repoConfig
        );
        const indexingFingerprint = this.indexingFingerprint(chunkingOptions);

        const indexed = await this.indexRepositoryRef({
            client,
            collection,
            contentRepository: job.sourceRepository,
            chunkingOptions,
            installationId: job.installationId,
            prepareCollection: async () => {
                await this.store.resetCollection({
                    collection,
                    dimension: this.embeddingProvider.dimension,
                    userUid,
                });
            },
            repository: job.repository,
            sha: job.headSha,
            ref: job.headSha,
            userUid,
        });
        await this.manifestStore.save({
            collection,
            files: indexed.files,
            indexingFingerprint,
            ref: job.headRef,
            repository: job.repository,
            sha: job.headSha,
            userUid,
        });
        return {
            chunkCount: indexed.chunkCount,
            lastIndexedSha: job.headSha,
        };
    }

    private async incrementalPush(
        job: Extract<IndexingJob, { kind: "incremental-push" }>
    ): Promise<IndexingStatusResult> {
        const client = await this.clientFactory.forInstallation(job.installationId);
        const collection = defaultBranchCollectionForRepo(job.repository.repoId);
        const userUid = userUidForInstallation(job.installationId);
        const currentManifest = await this.manifestStore.get({
            collection,
            userUid,
        });
        if (!currentManifest) {
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "missing-manifest",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
        }
        const repoConfig = await loadRepoIndexingConfig({
            client,
            ref: job.after,
            repository: job.repository,
        });
        const chunkingOptions = mergeChunkingOptions(
            this.chunkingOptions,
            repoConfig
        );
        const indexingFingerprint = this.indexingFingerprint(chunkingOptions);
        if (currentManifest.indexingFingerprint !== indexingFingerprint) {
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "indexing-fingerprint-changed",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
        }
        const changedFiles = await client.compareCommits({
            base: job.before,
            head: job.after,
            owner: job.repository.owner,
            repo: job.repository.repo,
        });
        const filesByPath = new Map(
            currentManifest.files.map((file) => [file.path, file])
        );

        if (changedFiles.length > this.maxChangedFilesForIncremental) {
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "too-many-changed-files",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
        }
        if (changedFiles.some(changesRepoConfig)) {
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "repo-config-changed",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
        }
        const projectedFilesByPath = new Map(filesByPath);
        for (const changedFile of changedFiles) {
            if (changedFile.previousFilename) {
                projectedFilesByPath.delete(changedFile.previousFilename);
            }
            projectedFilesByPath.delete(changedFile.filename);
            const status = changedFile.status.toLowerCase();
            if (
                status !== "removed" &&
                status !== "deleted" &&
                shouldIndexFile({ path: changedFile.filename }, chunkingOptions)
            ) {
                projectedFilesByPath.set(changedFile.filename, {
                    blobSha: changedFile.sha ?? job.after,
                    path: changedFile.filename,
                });
            }
        }
        this.quota?.assertFilesPerRepo({
            fileCount: projectedFilesByPath.size,
            installationId: job.installationId,
            repoId: job.repository.repoId,
        });
        await this.store.ensureCollection({
            collection,
            dimension: this.embeddingProvider.dimension,
            userUid,
        });
        for (const changedFile of changedFiles) {
            if (changedFile.previousFilename) {
                filesByPath.delete(changedFile.previousFilename);
            }
            filesByPath.delete(changedFile.filename);
            const manifestFile = await this.applyChangedFile({
                changedFile,
                client,
                collection,
                currentChunkCount: 0,
                ref: job.after,
                installationId: job.installationId,
                repository: job.repository,
                chunkingOptions,
                sha: job.after,
                userUid,
            });
            if (manifestFile) {
                filesByPath.set(manifestFile.file.path, manifestFile.file);
            }
        }
        await this.manifestStore.save({
            collection,
            files: sortManifestFiles([...filesByPath.values()]),
            indexingFingerprint,
            ref: job.ref,
            repository: job.repository,
            sha: job.after,
            userUid,
        });
        return {
            chunkCount: await this.store.countCollection({ collection, userUid }),
            lastIndexedSha: job.after,
        };
    }

    private async indexRepositoryRef(params: {
        client: GitHubContentClient;
        collection: string;
        contentRepository: GitHubRepositoryRef;
        chunkingOptions: ChunkingOptions;
        installationId: number;
        prepareCollection: () => Promise<void>;
        ref: string;
        repository: GitHubRepositoryRef;
        sha: string;
        userUid: string;
    }): Promise<IndexRepositoryRefResult> {
        const manifestFiles: RepoManifestFile[] = [];
        let chunkCount = 0;
        const files = await params.client.listRepositoryFiles({
            owner: params.contentRepository.owner,
            ref: params.ref,
            repo: params.contentRepository.repo,
        });
        const indexableFiles = files.filter((file) =>
            shouldIndexFile(file, params.chunkingOptions)
        );
        this.quota?.assertFilesPerRepo({
            fileCount: indexableFiles.length,
            installationId: params.installationId,
            repoId: params.repository.repoId,
        });
        await params.prepareCollection();
        for (const file of indexableFiles) {
            const manifestFile = await this.indexSingleFile({
                blobSha: file.sha,
                chunkingOptions: params.chunkingOptions,
                client: params.client,
                collection: params.collection,
                contentRepository: params.contentRepository,
                currentChunkCount: chunkCount,
                installationId: params.installationId,
                path: file.path,
                ref: params.ref,
                repository: params.repository,
                sha: params.sha,
                userUid: params.userUid,
            });
            if (manifestFile) {
                manifestFiles.push(manifestFile.file);
                chunkCount += manifestFile.chunkCount;
            }
        }
        return {
            chunkCount,
            files: sortManifestFiles(manifestFiles),
        };
    }

    private async applyChangedFile(params: {
        changedFile: GitHubChangedFile;
        chunkingOptions: ChunkingOptions;
        client: GitHubContentClient;
        collection: string;
        currentChunkCount: number;
        installationId: number;
        ref: string;
        repository: GitHubRepositoryRef;
        sha: string;
        userUid: string;
    }): Promise<IndexedManifestFile | null> {
        const status = params.changedFile.status.toLowerCase();
        if (params.changedFile.previousFilename) {
            await this.store.deletePath({
                collection: params.collection,
                pathSegments: pathSegmentsForPath(
                    params.changedFile.previousFilename
                ),
                userUid: params.userUid,
            });
        }

        if (status === "removed" || status === "deleted") {
            await this.store.deletePath({
                collection: params.collection,
                pathSegments: pathSegmentsForPath(params.changedFile.filename),
                userUid: params.userUid,
            });
            return null;
        }

        await this.store.deletePath({
            collection: params.collection,
            pathSegments: pathSegmentsForPath(params.changedFile.filename),
            userUid: params.userUid,
        });
        return await this.indexSingleFile({
            blobSha: params.changedFile.sha ?? params.sha,
            chunkingOptions: params.chunkingOptions,
            client: params.client,
            collection: params.collection,
            contentRepository: params.repository,
            currentChunkCount: params.currentChunkCount,
            installationId: params.installationId,
            path: params.changedFile.filename,
            ref: params.ref,
            repository: params.repository,
            sha: params.sha,
            userUid: params.userUid,
        });
    }

    private async indexSingleFile(params: {
        blobSha: string;
        chunkingOptions: ChunkingOptions;
        client: GitHubContentClient;
        collection: string;
        contentRepository: GitHubRepositoryRef;
        currentChunkCount: number;
        installationId: number;
        path: string;
        ref: string;
        repository: GitHubRepositoryRef;
        sha: string;
        userUid: string;
    }): Promise<IndexedManifestFile | null> {
        if (!shouldIndexFile({ path: params.path }, params.chunkingOptions)) {
            return null;
        }
        const content = await params.client.getFileContent({
            owner: params.contentRepository.owner,
            path: params.path,
            ref: params.ref,
            repo: params.contentRepository.repo,
        });
        if (content === null) {
            return null;
        }
        const chunks = this.chunker.chunkFile({
            content,
            options: params.chunkingOptions,
            path: params.path,
        });
        if (chunks.length === 0) {
            return null;
        }
        this.quota?.assertChunksPerRepo({
            chunkCount: params.currentChunkCount + chunks.length,
            installationId: params.installationId,
            repoId: params.repository.repoId,
        });
        const indexedChunks: IndexedCodeChunk[] = chunks.map((chunk) => ({
            ...chunk,
            blobSha: params.blobSha,
            owner: params.repository.owner,
            ref: params.ref,
            repo: params.repository.repo,
            repoId: params.repository.repoId,
            sha: params.sha,
        }));
        const vectors = await this.embeddingProvider.embedDocuments(
            indexedChunks.map((chunk) => chunk.text)
        );
        await this.store.upsertChunks({
            chunks: indexedChunks,
            collection: params.collection,
            userUid: params.userUid,
            vectors,
        });
        return {
            chunkCount: chunks.length,
            file: {
                blobSha: params.blobSha,
                path: params.path,
            },
        };
    }

    private indexingFingerprint(options: ChunkingOptions): string {
        return indexingFingerprintForChunker(this.chunker, options);
    }

    private async assertRepositoryQuota(job: IndexingJob): Promise<void> {
        if (!this.quota || !this.quotaStore) {
            return;
        }
        const repositories = await this.quotaStore.listRepositoriesForInstallation(
            job.installationId
        );
        this.quota.assertRepositoriesPerInstallation({
            installationId: job.installationId,
            repoCount: repositories.filter(
                (repository) => repository.status !== "deleted"
            ).length,
        });
    }

    private async markDeleted(
        job: Extract<IndexingJob, { kind: "delete-repo-index" }>
    ): Promise<void> {
        await this.statusStore?.markRepositoryStatus({
            repoId: job.repository.repoId,
            status: "deleted",
        });
    }

    private async markIndexing(job: IndexingJob): Promise<void> {
        if (job.kind === "delete-pr-index" || job.kind === "delete-repo-index") {
            return;
        }
        await this.statusStore?.markRepositoryStatus({
            repoId: job.repository.repoId,
            status: "indexing",
        });
    }

    private async markReady(
        job: IndexingJob,
        result: IndexingStatusResult
    ): Promise<void> {
        if (job.kind === "delete-pr-index" || job.kind === "delete-repo-index") {
            return;
        }
        await this.statusStore?.markRepositoryStatus({
            ...(result.chunkCount === undefined
                ? {}
                : { chunkCount: result.chunkCount }),
            lastIndexedAt: new Date(),
            lastIndexedSha: result.lastIndexedSha,
            repoId: job.repository.repoId,
            status: "ready",
        });
    }
}

type IndexedManifestFile = {
    chunkCount: number;
    file: RepoManifestFile;
};

type IndexRepositoryRefResult = {
    chunkCount: number;
    files: RepoManifestFile[];
};

type IndexingStatusResult = {
    chunkCount?: number;
    lastIndexedSha: string;
};

function sanitizeError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return message.replace(/\s+/g, " ").trim().slice(0, 4000);
}

function sortManifestFiles(files: RepoManifestFile[]): RepoManifestFile[] {
    return [...files].sort((left, right) => left.path.localeCompare(right.path));
}

function shouldFallbackToFullIndex(
    job: Extract<IndexingJob, { kind: "incremental-push" }>
): boolean {
    if (job.created || job.forced || isAllZeroSha(job.before)) {
        return true;
    }
    if (job.deleted) {
        return false;
    }
    const branch = branchNameFromRef(job.ref);
    return branch !== job.repository.defaultBranch;
}
