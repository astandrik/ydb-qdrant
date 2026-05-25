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
    private readonly store: CodeIndexStore;

    constructor(params: {
        clientFactory: GitHubContentClientFactory;
        chunker?: CodeChunker;
        embeddingProvider: EmbeddingProvider;
        manifestStore: RepoManifestStore;
        options?: RepoIndexerOptions;
        store: CodeIndexStore;
    }) {
        this.clientFactory = params.clientFactory;
        this.chunker = params.chunker ?? defaultCodeChunker;
        this.embeddingProvider = params.embeddingProvider;
        this.manifestStore = params.manifestStore;
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
                await this.fullIndex(job);
                return;
            case "incremental-push":
                if (shouldFallbackToFullIndex(job)) {
                    await this.fullIndex({
                        deliveryId: job.deliveryId,
                        installationId: job.installationId,
                        kind: "full-index",
                        reason: "incremental-fallback",
                        ref: job.repository.defaultBranch,
                        repository: job.repository,
                        sha: job.after,
                    });
                    return;
                }
                await this.incrementalPush(job);
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
                return;
            case "pr-index":
                await this.pullRequestIndex(job);
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

    private async fullIndex(job: FullIndexJob): Promise<void> {
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

        await this.store.resetCollection({
            collection,
            dimension: this.embeddingProvider.dimension,
            userUid,
        });
        const files = await this.indexRepositoryRef({
            client,
            collection,
            contentRepository: job.repository,
            chunkingOptions,
            repository: job.repository,
            sha: job.sha ?? job.ref,
            ref,
            userUid,
        });
        await this.manifestStore.save({
            collection,
            files,
            indexingFingerprint,
            ref: job.ref,
            repository: job.repository,
            sha: job.sha ?? job.ref,
            userUid,
        });
    }

    private async pullRequestIndex(job: PullRequestIndexJob): Promise<void> {
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

        await this.store.resetCollection({
            collection,
            dimension: this.embeddingProvider.dimension,
            userUid,
        });
        const files = await this.indexRepositoryRef({
            client,
            collection,
            contentRepository: job.sourceRepository,
            chunkingOptions,
            repository: job.repository,
            sha: job.headSha,
            ref: job.headSha,
            userUid,
        });
        await this.manifestStore.save({
            collection,
            files,
            indexingFingerprint,
            ref: job.headRef,
            repository: job.repository,
            sha: job.headSha,
            userUid,
        });
    }

    private async incrementalPush(
        job: Extract<IndexingJob, { kind: "incremental-push" }>
    ): Promise<void> {
        const client = await this.clientFactory.forInstallation(job.installationId);
        const collection = defaultBranchCollectionForRepo(job.repository.repoId);
        const userUid = userUidForInstallation(job.installationId);
        const currentManifest = await this.manifestStore.get({
            collection,
            userUid,
        });
        if (!currentManifest) {
            await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "missing-manifest",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
            return;
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
            await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "indexing-fingerprint-changed",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
            return;
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
            await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "too-many-changed-files",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
            return;
        }
        if (changedFiles.some(changesRepoConfig)) {
            await this.fullIndex({
                deliveryId: job.deliveryId,
                installationId: job.installationId,
                kind: "full-index",
                reason: "repo-config-changed",
                ref: job.repository.defaultBranch,
                repository: job.repository,
                sha: job.after,
            });
            return;
        }
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
                ref: job.after,
                repository: job.repository,
                chunkingOptions,
                sha: job.after,
                userUid,
            });
            if (manifestFile) {
                filesByPath.set(manifestFile.path, manifestFile);
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
    }

    private async indexRepositoryRef(params: {
        client: GitHubContentClient;
        collection: string;
        contentRepository: GitHubRepositoryRef;
        chunkingOptions: ChunkingOptions;
        ref: string;
        repository: GitHubRepositoryRef;
        sha: string;
        userUid: string;
    }): Promise<RepoManifestFile[]> {
        const manifestFiles: RepoManifestFile[] = [];
        const files = await params.client.listRepositoryFiles({
            owner: params.contentRepository.owner,
            ref: params.ref,
            repo: params.contentRepository.repo,
        });
        for (const file of files) {
            if (!shouldIndexFile(file, params.chunkingOptions)) {
                continue;
            }
            const manifestFile = await this.indexSingleFile({
                blobSha: file.sha,
                chunkingOptions: params.chunkingOptions,
                client: params.client,
                collection: params.collection,
                contentRepository: params.contentRepository,
                path: file.path,
                ref: params.ref,
                repository: params.repository,
                sha: params.sha,
                userUid: params.userUid,
            });
            if (manifestFile) {
                manifestFiles.push(manifestFile);
            }
        }
        return sortManifestFiles(manifestFiles);
    }

    private async applyChangedFile(params: {
        changedFile: GitHubChangedFile;
        chunkingOptions: ChunkingOptions;
        client: GitHubContentClient;
        collection: string;
        ref: string;
        repository: GitHubRepositoryRef;
        sha: string;
        userUid: string;
    }): Promise<RepoManifestFile | null> {
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
        path: string;
        ref: string;
        repository: GitHubRepositoryRef;
        sha: string;
        userUid: string;
    }): Promise<RepoManifestFile | null> {
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
            blobSha: params.blobSha,
            path: params.path,
        };
    }

    private indexingFingerprint(options: ChunkingOptions): string {
        return indexingFingerprintForChunker(this.chunker, options);
    }
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
