import {
    branchNameFromRef,
    defaultBranchCollectionForRepo,
    isAllZeroSha,
    pathSegmentsForPath,
    pullRequestCollectionForRepo,
    repoCollectionPrefixForRepo,
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
    GitHubRepositorySnapshot,
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
    embeddingBatchMaxChars?: number;
    embeddingBatchSize?: number;
    embeddingConcurrency?: number;
    fileConcurrency?: number;
    maxChangedFilesForIncremental?: number;
};

export type RepoIndexerStatusStore = {
    markRepositoryStatus(params: {
        chunkCount?: number;
        defaultBranch?: string;
        installationId?: number | string;
        lastError?: string;
        lastIndexedAt?: Date;
        lastIndexedSha?: string;
        owner?: string;
        repo?: string;
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
const GITHUB_COMPARE_FILES_CAP = 300;
const DEFAULT_FILE_CONCURRENCY = 4;
const DEFAULT_EMBEDDING_BATCH_SIZE = 64;
const DEFAULT_EMBEDDING_BATCH_MAX_CHARS = 200_000;
const DEFAULT_EMBEDDING_CONCURRENCY = 2;

type RepositoryIndexFile = {
    blobSha?: string;
    path: string;
    size?: number;
};

export function mergeChunkingOptions(
    base: ChunkingOptions,
    repoConfig: RepoIndexingConfig
): ChunkingOptions {
    return {
        ...base,
        ...repoConfig,
    };
}

export function indexingFingerprintForOptions(params: {
    chunker: CodeChunker;
    chunkingOptions: ChunkingOptions;
    embeddingProvider: EmbeddingProvider;
}): string {
    const chunkerFingerprint = indexingFingerprintForChunker(
        params.chunker,
        params.chunkingOptions
    );
    const embeddingFingerprint =
        params.embeddingProvider.fingerprint ??
        `custom:v1:dimension=${params.embeddingProvider.dimension}`;
    return `chunker:${chunkerFingerprint}|embedding:${embeddingFingerprint}`;
}

function positiveIntegerOption(
    value: number | undefined,
    defaultValue: number
): number {
    return Math.max(1, Math.floor(value ?? defaultValue));
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
    private readonly embeddingBatchMaxChars: number;
    private readonly embeddingBatchSize: number;
    private readonly embeddingConcurrency: number;
    private readonly embeddingProvider: EmbeddingProvider;
    private readonly fileConcurrency: number;
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
        this.fileConcurrency = positiveIntegerOption(
            params.options?.fileConcurrency,
            DEFAULT_FILE_CONCURRENCY
        );
        this.embeddingBatchSize = positiveIntegerOption(
            params.options?.embeddingBatchSize,
            DEFAULT_EMBEDDING_BATCH_SIZE
        );
        this.embeddingBatchMaxChars = positiveIntegerOption(
            params.options?.embeddingBatchMaxChars,
            DEFAULT_EMBEDDING_BATCH_MAX_CHARS
        );
        this.embeddingConcurrency = positiveIntegerOption(
            params.options?.embeddingConcurrency,
            DEFAULT_EMBEDDING_CONCURRENCY
        );
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
                await this.deleteRepoCollections(job);
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
        if (!this.statusStore || !updatesDefaultBranchStatus(job)) {
            return;
        }
        await this.statusStore.markRepositoryStatus({
            defaultBranch: job.repository.defaultBranch,
            installationId: job.installationId,
            lastError: sanitizeError(err),
            owner: job.repository.owner,
            repo: job.repository.repo,
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

        const contentRef = `refs/pull/${job.prNumber}/head`;
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
            sha: job.headSha,
            ref: contentRef,
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

        if (
            changedFiles.length > this.maxChangedFilesForIncremental ||
            changedFiles.length >= GITHUB_COMPARE_FILES_CAP
        ) {
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
        let currentChunkCount = await this.currentManifestChunkCount({
            collection,
            manifest: currentManifest,
            userUid,
        });
        for (const changedFile of changedFiles) {
            if (changedFile.previousFilename) {
                currentChunkCount = this.subtractManifestChunkCount({
                    currentChunkCount,
                    file: filesByPath.get(changedFile.previousFilename),
                });
                filesByPath.delete(changedFile.previousFilename);
            }
            currentChunkCount = this.subtractManifestChunkCount({
                currentChunkCount,
                file: filesByPath.get(changedFile.filename),
            });
            filesByPath.delete(changedFile.filename);
            const manifestFile = await this.applyChangedFile({
                changedFile,
                client,
                collection,
                context,
                currentChunkCount,
                ref: job.after,
                installationId: job.installationId,
                repository: job.repository,
                chunkingOptions,
                sha: job.after,
                userUid,
            });
            if (manifestFile) {
                filesByPath.set(manifestFile.file.path, manifestFile.file);
                currentChunkCount += manifestFile.chunkCount;
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
        let snapshot: GitHubRepositorySnapshot | null = null;
        try {
            const manifestFiles: RepoManifestFile[] = [];
            let chunkCount = 0;
            let processedFiles = 0;
            await this.reportProgress(params.context, { phase: "fetching_tree" });
            const repositoryFiles = await this.readRepositoryIndexFiles(params);
            snapshot = repositoryFiles.snapshot;
            const indexableFiles = repositoryFiles.files.filter((file) =>
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
            await this.reportProgress(params.context, {
                phase: "resetting_collection",
            });
            await params.prepareCollection();
            const batcher = this.createEmbeddingBatcher({
                collection: params.collection,
                context: params.context,
                getProcessedFiles: () => processedFiles,
                getTotalChunks: () => chunkCount,
                totalFiles: indexableFiles.length,
                userUid: params.userUid,
            });
            await forEachWithConcurrency(
                indexableFiles,
                this.fileConcurrency,
                async (file) => {
                    const manifestFile = await this.readAndChunkSingleFile({
                        blobSha: file.blobSha ?? params.sha,
                        chunkingOptions: params.chunkingOptions,
                        client: params.client,
                        contentRepository: params.contentRepository,
                        context: params.context,
                        path: file.path,
                        ref: params.ref,
                        repository: params.repository,
                        sha: params.sha,
                        snapshot,
                    });
                    if (manifestFile) {
                        this.quota?.assertChunksPerRepo({
                            chunkCount: chunkCount + manifestFile.chunkCount,
                            installationId: params.installationId,
                            repoId: params.repository.repoId,
                        });
                        manifestFiles.push(manifestFile.file);
                        chunkCount += manifestFile.chunkCount;
                        await batcher.add(manifestFile.chunks);
                    }
                    processedFiles += 1;
                    await this.reportProgress(params.context, {
                        currentPath: file.path,
                        phase: "processing_files",
                        processedChunks: batcher.processedChunks(),
                        processedFiles,
                        totalChunks: chunkCount,
                    });
                }
            );
            await batcher.flush();
            await this.reportProgress(params.context, {
                phase: "processing_files",
                processedChunks: batcher.processedChunks(),
                processedFiles,
                totalChunks: chunkCount,
                totalFiles: indexableFiles.length,
            });
            return {
                chunkCount,
                files: sortManifestFiles(manifestFiles),
            };
        } finally {
            await snapshot?.close();
        }
    }

    private createEmbeddingBatcher(params: {
        collection: string;
        context?: IndexingJobExecutionContext;
        getProcessedFiles: () => number;
        getTotalChunks: () => number;
        totalFiles: number;
        userUid: string;
    }): {
        add(chunks: IndexedCodeChunk[]): Promise<void>;
        flush(): Promise<void>;
        processedChunks(): number;
    } {
        let currentBatch: IndexedCodeChunk[] = [];
        let currentBatchChars = 0;
        let processedChunks = 0;
        const active = new Set<Promise<void>>();

        const scheduleBatch = async (chunks: IndexedCodeChunk[]): Promise<void> => {
            const task = (async () => {
                const currentPath = describeChunkBatch(chunks);
                await this.reportProgress(params.context, {
                    currentPath,
                    phase: "embedding",
                    processedChunks,
                    processedFiles: params.getProcessedFiles(),
                    totalChunks: params.getTotalChunks(),
                    totalFiles: params.totalFiles,
                });
                const vectors = await this.embeddingProvider.embedDocuments(
                    chunks.map((chunk) => chunk.text)
                );
                await this.reportProgress(params.context, {
                    currentPath,
                    phase: "upserting",
                    processedChunks,
                    processedFiles: params.getProcessedFiles(),
                    totalChunks: params.getTotalChunks(),
                    totalFiles: params.totalFiles,
                });
                await this.store.upsertChunks({
                    chunks,
                    collection: params.collection,
                    userUid: params.userUid,
                    vectors,
                });
                processedChunks += chunks.length;
                await this.reportProgress(params.context, {
                    currentPath,
                    phase: "processing_files",
                    processedChunks,
                    processedFiles: params.getProcessedFiles(),
                    totalChunks: params.getTotalChunks(),
                    totalFiles: params.totalFiles,
                });
            })();
            active.add(task);
            task.then(
                () => active.delete(task),
                () => active.delete(task)
            );
            if (active.size >= this.embeddingConcurrency) {
                await Promise.race(active);
            }
        };

        const flushCurrentBatch = async (): Promise<void> => {
            if (currentBatch.length === 0) {
                return;
            }
            const batch = currentBatch;
            currentBatch = [];
            currentBatchChars = 0;
            await scheduleBatch(batch);
        };

        return {
            add: async (chunks: IndexedCodeChunk[]): Promise<void> => {
                for (const chunk of chunks) {
                    const chunkChars = chunk.text.length;
                    if (
                        currentBatch.length > 0 &&
                        (currentBatch.length >= this.embeddingBatchSize ||
                            currentBatchChars + chunkChars >
                                this.embeddingBatchMaxChars)
                    ) {
                        await flushCurrentBatch();
                    }
                    currentBatch.push(chunk);
                    currentBatchChars += chunkChars;
                    if (
                        currentBatch.length >= this.embeddingBatchSize ||
                        currentBatchChars >= this.embeddingBatchMaxChars
                    ) {
                        await flushCurrentBatch();
                    }
                }
            },
            flush: async (): Promise<void> => {
                await flushCurrentBatch();
                await Promise.all(active);
            },
            processedChunks: () => processedChunks,
        };
    }

    private async readRepositoryIndexFiles(params: {
        client: GitHubContentClient;
        contentRepository: GitHubRepositoryRef;
        ref: string;
    }): Promise<{
        files: RepositoryIndexFile[];
        snapshot: GitHubRepositorySnapshot | null;
    }> {
        if (params.client.getRepositorySnapshot) {
            const snapshot = await params.client.getRepositorySnapshot({
                owner: params.contentRepository.owner,
                ref: params.ref,
                repo: params.contentRepository.repo,
            });
            return {
                files: snapshot.files.map((file) => ({
                    path: file.path,
                    size: file.size,
                })),
                snapshot,
            };
        }
        return {
            files: (
                await params.client.listRepositoryFiles({
                    owner: params.contentRepository.owner,
                    ref: params.ref,
                    repo: params.contentRepository.repo,
                })
            ).map((file) => ({
                blobSha: file.sha,
                path: file.path,
                size: file.size,
            })),
            snapshot: null,
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
        snapshot?: GitHubRepositorySnapshot | null;
        userUid: string;
    }): Promise<IndexedManifestFile | null> {
        const manifestFile = await this.readAndChunkSingleFile({
            blobSha: params.blobSha,
            chunkingOptions: params.chunkingOptions,
            client: params.client,
            contentRepository: params.contentRepository,
            context: params.context,
            path: params.path,
            ref: params.ref,
            repository: params.repository,
            sha: params.sha,
            snapshot: params.snapshot,
        });
        if (!manifestFile) {
            return null;
        }
        this.quota?.assertChunksPerRepo({
            chunkCount: params.currentChunkCount + manifestFile.chunkCount,
            installationId: params.installationId,
            repoId: params.repository.repoId,
        });
        await this.embedAndUpsertChunks({
            chunks: manifestFile.chunks,
            collection: params.collection,
            context: params.context,
            currentPath: params.path,
            totalChunks: params.currentChunkCount + manifestFile.chunkCount,
            userUid: params.userUid,
        });
        return {
            chunkCount: manifestFile.chunkCount,
            file: manifestFile.file,
        };
    }

    private async readAndChunkSingleFile(params: {
        blobSha: string;
        chunkingOptions: ChunkingOptions;
        client: GitHubContentClient;
        contentRepository: GitHubRepositoryRef;
        context?: IndexingJobExecutionContext;
        path: string;
        ref: string;
        repository: GitHubRepositoryRef;
        sha: string;
        snapshot?: GitHubRepositorySnapshot | null;
    }): Promise<PreparedIndexedFile | null> {
        if (!shouldIndexFile({ path: params.path }, params.chunkingOptions)) {
            return null;
        }
        await this.reportProgress(params.context, {
            currentPath: params.path,
            phase: "fetching_file",
        });
        const snapshotContent = params.snapshot
            ? await params.snapshot.getFileContent(params.path)
            : null;
        const content =
            snapshotContent?.content ??
            (await params.client.getFileContent({
                owner: params.contentRepository.owner,
                path: params.path,
                ref: params.ref,
                repo: params.contentRepository.repo,
            }));
        if (content === null) {
            return null;
        }
        const blobSha = snapshotContent?.blobSha ?? params.blobSha;
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
        const indexedChunks: IndexedCodeChunk[] = chunks.map((chunk) => ({
            ...chunk,
            blobSha,
            owner: params.repository.owner,
            ref: params.ref,
            repo: params.repository.repo,
            repoId: params.repository.repoId,
            sha: params.sha,
        }));
        return {
            chunkCount: chunks.length,
            chunks: indexedChunks,
            file: {
                blobSha,
                chunkCount: chunks.length,
                path: params.path,
            },
        };
    }

    private async deleteRepoCollections(
        job: Extract<IndexingJob, { kind: "delete-repo-index" }>
    ): Promise<void> {
        const userUid = userUidForInstallation(job.installationId);
        const collectionPrefix = repoCollectionPrefixForRepo(job.repository.repoId);
        const collections = await this.manifestStore.listCollectionsByPrefix({
            collectionPrefix,
            userUid,
        });
        const uniqueCollections = [
            ...new Set([
                defaultBranchCollectionForRepo(job.repository.repoId),
                ...collections,
            ]),
        ].sort();
        for (const collection of uniqueCollections) {
            await this.store.deleteCollection({ collection, userUid });
            await this.manifestStore.delete({ collection, userUid });
        }
    }

    private async currentManifestChunkCount(params: {
        collection: string;
        manifest: { files: RepoManifestFile[] };
        userUid: string;
    }): Promise<number> {
        if (
            params.manifest.files.every(
                (file) => file.chunkCount !== undefined
            )
        ) {
            return params.manifest.files.reduce(
                (sum, file) => sum + (file.chunkCount ?? 0),
                0
            );
        }
        return await this.store.countCollection({
            collection: params.collection,
            userUid: params.userUid,
        });
    }

    private subtractManifestChunkCount(params: {
        currentChunkCount: number;
        file: RepoManifestFile | undefined;
    }): number {
        if (!params.file) {
            return params.currentChunkCount;
        }
        return Math.max(
            0,
            params.currentChunkCount - (params.file.chunkCount ?? 0)
        );
    }

    private async embedAndUpsertChunks(params: {
        chunks: IndexedCodeChunk[];
        collection: string;
        context?: IndexingJobExecutionContext;
        currentPath: string;
        totalChunks: number;
        userUid: string;
    }): Promise<void> {
        await this.reportProgress(params.context, {
            currentPath: params.currentPath,
            phase: "embedding",
            totalChunks: params.totalChunks,
        });
        const vectors = await this.embeddingProvider.embedDocuments(
            params.chunks.map((chunk) => chunk.text)
        );
        await this.reportProgress(params.context, {
            currentPath: params.currentPath,
            phase: "upserting",
        });
        await this.store.upsertChunks({
            chunks: params.chunks,
            collection: params.collection,
            userUid: params.userUid,
            vectors,
        });
    }

    private indexingFingerprint(options: ChunkingOptions): string {
        return indexingFingerprintForOptions({
            chunker: this.chunker,
            chunkingOptions: options,
            embeddingProvider: this.embeddingProvider,
        });
    }

    private async assertRepositoryQuota(job: IndexingJob): Promise<void> {
        if (!this.quota || !this.quotaStore || !addsRepositoryToInstallation(job)) {
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
            defaultBranch: job.repository.defaultBranch,
            installationId: job.installationId,
            owner: job.repository.owner,
            repo: job.repository.repo,
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
        if (!updatesDefaultBranchStatus(job)) {
            return;
        }
        await this.statusStore?.markRepositoryStatus({
            defaultBranch: job.repository.defaultBranch,
            installationId: job.installationId,
            owner: job.repository.owner,
            repo: job.repository.repo,
            repoId: job.repository.repoId,
            status: "indexing",
        });
    }

    private async markReady(
        job: IndexingJob,
        result: IndexingStatusResult
    ): Promise<void> {
        if (!updatesDefaultBranchStatus(job)) {
            return;
        }
        await this.statusStore?.markRepositoryStatus({
            ...(result.chunkCount === undefined
                ? {}
                : { chunkCount: result.chunkCount }),
            defaultBranch: job.repository.defaultBranch,
            installationId: job.installationId,
            lastIndexedAt: new Date(),
            lastIndexedSha: result.lastIndexedSha,
            owner: job.repository.owner,
            repo: job.repository.repo,
            repoId: job.repository.repoId,
            status: "ready",
        });
    }
}

type IndexedManifestFile = {
    chunkCount: number;
    file: RepoManifestFile;
};

type PreparedIndexedFile = IndexedManifestFile & {
    chunks: IndexedCodeChunk[];
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

async function forEachWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>
): Promise<void> {
    let nextIndex = 0;
    const workerCount = Math.min(Math.max(1, concurrency), items.length);
    await Promise.all(
        Array.from({ length: workerCount }, async () => {
            while (nextIndex < items.length) {
                const item = items[nextIndex];
                nextIndex += 1;
                if (item !== undefined) {
                    await worker(item);
                }
            }
        })
    );
}

function describeChunkBatch(chunks: IndexedCodeChunk[]): string {
    const firstPath = chunks[0]?.path;
    if (!firstPath) {
        return "embedding batch";
    }
    const distinctPaths = new Set(chunks.map((chunk) => chunk.path));
    return distinctPaths.size <= 1
        ? firstPath
        : `${firstPath} + ${distinctPaths.size - 1} files`;
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

function addsRepositoryToInstallation(job: IndexingJob): boolean {
    return (
        job.kind === "full-index" &&
        (job.reason === "installation" ||
            job.reason === "installation-repositories-added")
    );
}

function updatesDefaultBranchStatus(job: IndexingJob): boolean {
    return job.kind === "full-index" || job.kind === "incremental-push";
}
