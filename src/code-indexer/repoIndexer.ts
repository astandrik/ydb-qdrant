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
    IndexingJobExecutionContext,
    IndexingJobProgressUpdate,
    IndexingProgressStore,
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
    private readonly progressStore?: IndexingProgressStore;
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
        progressStore?: IndexingProgressStore;
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
        this.progressStore = params.progressStore;
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

    async processJob(
        job: IndexingJob,
        context?: IndexingJobExecutionContext
    ): Promise<void> {
        switch (job.kind) {
            case "full-index":
                await this.assertRepositoryQuota(job);
                await this.markIndexing(job);
                await this.markReady(job, await this.fullIndex(job, context));
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
                    await this.reportProgress(context, {
                        message: "Falling back to full index: forced push or branch recreation",
                    });
                    await this.markReady(
                        job,
                        await this.fullIndex(fallbackJob, context)
                    );
                    return;
                }
                await this.markReady(job, await this.incrementalPush(job, context));
                return;
            case "delete-repo-index":
                await this.reportProgress(context, { phase: "deleting" });
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
                await this.markReady(job, await this.pullRequestIndex(job, context));
                return;
            case "delete-pr-index":
                await this.reportProgress(context, { phase: "deleting" });
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

    private async fullIndex(
        job: FullIndexJob,
        context?: IndexingJobExecutionContext
    ): Promise<IndexingStatusResult> {
        const client = await this.clientFactory.forInstallation(job.installationId);
        const collection = defaultBranchCollectionForRepo(job.repository.repoId);
        const userUid = userUidForInstallation(job.installationId);
        const ref = job.sha ?? job.ref;
        await this.reportProgress(context, { phase: "loading_config" });
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
            context,
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
        await this.reportProgress(context, { phase: "saving_manifest" });
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
        job: PullRequestIndexJob,
        context?: IndexingJobExecutionContext
    ): Promise<IndexingStatusResult> {
        const client = await this.clientFactory.forInstallation(job.installationId);
        const collection = pullRequestCollectionForRepo(
            job.repository.repoId,
            job.prNumber
        );
        const userUid = userUidForInstallation(job.installationId);
        await this.reportProgress(context, { phase: "loading_config" });
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
            context,
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
        await this.reportProgress(context, { phase: "saving_manifest" });
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
        job: Extract<IndexingJob, { kind: "incremental-push" }>,
        context?: IndexingJobExecutionContext
    ): Promise<IndexingStatusResult> {
        const client = await this.clientFactory.forInstallation(job.installationId);
        const collection = defaultBranchCollectionForRepo(job.repository.repoId);
        const userUid = userUidForInstallation(job.installationId);
        const currentManifest = await this.manifestStore.get({
            collection,
            userUid,
        });
        if (!currentManifest) {
            await this.reportProgress(context, {
                message: "Falling back to full index: missing-manifest",
            });
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "missing-manifest",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            }, context);
        }
        await this.reportProgress(context, { phase: "loading_config" });
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
            await this.reportProgress(context, {
                message: "Falling back to full index: indexing-fingerprint-changed",
            });
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "indexing-fingerprint-changed",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            }, context);
        }
        await this.reportProgress(context, { phase: "fetching_tree" });
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
            await this.reportProgress(context, {
                message: "Falling back to full index: too-many-changed-files",
            });
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "too-many-changed-files",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            }, context);
        }
        if (changedFiles.some(changesRepoConfig)) {
            await this.reportProgress(context, {
                message: "Falling back to full index: repo-config-changed",
            });
            return await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "repo-config-changed",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            }, context);
        }
        await this.reportProgress(context, {
            phase: "processing_files",
            processedChunks: 0,
            processedFiles: 0,
            totalFiles: changedFiles.length,
        });
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
                context,
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
        context?: IndexingJobExecutionContext;
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
        let processedFiles = 0;
        await this.reportProgress(params.context, { phase: "fetching_tree" });
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
        await this.reportProgress(params.context, {
            phase: "processing_files",
            processedChunks: 0,
            processedFiles: 0,
            totalChunks: 0,
            totalFiles: indexableFiles.length,
        });
        await this.reportProgress(params.context, { phase: "resetting_collection" });
        await params.prepareCollection();
        for (const file of indexableFiles) {
            const manifestFile = await this.indexSingleFile({
                blobSha: file.sha,
                chunkingOptions: params.chunkingOptions,
                client: params.client,
                collection: params.collection,
                contentRepository: params.contentRepository,
                context: params.context,
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
            processedFiles += 1;
            await this.reportProgress(params.context, {
                currentPath: file.path,
                phase: "processing_files",
                processedChunks: chunkCount,
                processedFiles,
            });
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
        context?: IndexingJobExecutionContext;
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
            context: params.context,
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
        context?: IndexingJobExecutionContext;
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
        await this.reportProgress(params.context, {
            currentPath: params.path,
            phase: "fetching_file",
        });
        const content = await params.client.getFileContent({
            owner: params.contentRepository.owner,
            path: params.path,
            ref: params.ref,
            repo: params.contentRepository.repo,
        });
        if (content === null) {
            return null;
        }
        await this.reportProgress(params.context, {
            currentPath: params.path,
            phase: "chunking",
        });
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
        await this.reportProgress(params.context, {
            currentPath: params.path,
            phase: "embedding",
            totalChunks: params.currentChunkCount + chunks.length,
        });
        const vectors = await this.embeddingProvider.embedDocuments(
            indexedChunks.map((chunk) => chunk.text)
        );
        await this.reportProgress(params.context, {
            currentPath: params.path,
            phase: "upserting",
        });
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

    private async reportProgress(
        context: IndexingJobExecutionContext | undefined,
        update: IndexingJobProgressUpdate
    ): Promise<void> {
        if (!context || !this.progressStore) {
            return;
        }
        await this.progressStore.updateJobProgress({
            jobId: context.jobId,
            update,
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
