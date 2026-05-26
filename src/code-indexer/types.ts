import type { Payload, YdbQdrantPointId } from "../qdrant/QdrantRestTypes.js";

export type GitHubRepositoryRef = {
    owner: string;
    repo: string;
    repoId: number;
    defaultBranch: string;
};

export type GitHubFileEntry = {
    path: string;
    sha: string;
    size?: number;
};

export type GitHubRepositorySnapshotFile = {
    path: string;
    size?: number;
};

export type GitHubRepositorySnapshotContent = {
    blobSha: string;
    content: string;
};

export interface GitHubRepositorySnapshot {
    close(): Promise<void>;
    files: GitHubRepositorySnapshotFile[];
    getFileContent(path: string): Promise<GitHubRepositorySnapshotContent | null>;
}

export type GitHubChangedFile = {
    filename: string;
    previousFilename?: string;
    status: string;
    sha?: string;
};

export type CodeChunk = {
    chunker?: string;
    chunkIndex: number;
    chunkKind?: string;
    endLine: number;
    language: string | null;
    path: string;
    pathSegments: string[];
    startLine: number;
    symbolName?: string;
    symbolPath?: string;
    text: string;
};

export type IndexedCodeChunk = CodeChunk & {
    blobSha: string;
    owner: string;
    ref: string;
    repo: string;
    repoId: number;
    sha: string;
};

export type CodeSearchResult = {
    id: YdbQdrantPointId;
    payload?: Payload;
    score: number;
};

export type RepoManifestFile = {
    blobSha: string;
    chunkCount?: number;
    path: string;
};

export type RepoIndexManifest = {
    collection: string;
    files: RepoManifestFile[];
    indexingFingerprint?: string;
    ref: string;
    repository: GitHubRepositoryRef;
    sha: string;
    userUid: string;
};

type BaseIndexingJob = {
    deliveryId?: string;
    installationId: number;
    repository: GitHubRepositoryRef;
};

export type FullIndexJob = BaseIndexingJob & {
    kind: "full-index";
    reason: string;
    ref: string;
    sha?: string;
};

export type IncrementalPushJob = BaseIndexingJob & {
    after: string;
    before: string;
    created: boolean;
    deleted: boolean;
    forced: boolean;
    kind: "incremental-push";
    ref: string;
};

export type DeleteRepoIndexJob = BaseIndexingJob & {
    kind: "delete-repo-index";
    reason: string;
};

export type PullRequestIndexJob = BaseIndexingJob & {
    baseRef: string;
    headRef: string;
    headSha: string;
    kind: "pr-index";
    prNumber: number;
    sourceRepository: GitHubRepositoryRef;
};

export type DeletePullRequestIndexJob = BaseIndexingJob & {
    kind: "delete-pr-index";
    prNumber: number;
    reason: string;
};

export type IndexingJob =
    | FullIndexJob
    | IncrementalPushJob
    | DeleteRepoIndexJob
    | PullRequestIndexJob
    | DeletePullRequestIndexJob;

export type IndexingJobStatus = "pending" | "running" | "completed" | "failed";

export type IndexingJobPhase =
    | "queued"
    | "claiming"
    | "loading_config"
    | "fetching_tree"
    | "resetting_collection"
    | "processing_files"
    | "fetching_file"
    | "chunking"
    | "embedding"
    | "upserting"
    | "saving_manifest"
    | "deleting"
    | "completed"
    | "failed";

export type EnqueuedIndexingJob = {
    jobId: string;
    phase: IndexingJobPhase;
    status: IndexingJobStatus;
};

export type IndexingJobExecutionContext = {
    jobId: string;
};

export type IndexingJobProgressRecord = {
    createdAt: Date;
    currentPath?: string;
    finishedAt?: Date;
    installationId: string;
    jobId: string;
    jobKind: IndexingJob["kind"];
    lastError?: string;
    message?: string;
    owner: string;
    phase: IndexingJobPhase;
    processedChunks: number;
    processedFiles: number;
    prNumber?: number;
    repo: string;
    repoId: string;
    startedAt?: Date;
    status: IndexingJobStatus;
    totalChunks?: number;
    totalFiles?: number;
    updatedAt: Date;
};

export type IndexingJobProgressUpdate = {
    currentPath?: string | null;
    finishedAt?: Date | null;
    lastError?: string | null;
    message?: string | null;
    phase?: IndexingJobPhase;
    processedChunks?: number;
    processedFiles?: number;
    startedAt?: Date | null;
    status?: IndexingJobStatus;
    totalChunks?: number | null;
    totalFiles?: number | null;
};

export interface IndexingProgressStore {
    createJobProgress(params: {
        job: IndexingJob;
        jobId: string;
    }): Promise<IndexingJobProgressRecord>;
    getJobProgress(jobId: string): Promise<IndexingJobProgressRecord | null>;
    listActiveJobsForInstallation(
        installationId: number | string
    ): Promise<IndexingJobProgressRecord[]>;
    listJobsForRepository(params: {
        installationId: number | string;
        limit?: number;
        repoId: number | string;
    }): Promise<IndexingJobProgressRecord[]>;
    updateJobProgress(params: {
        jobId: string;
        update: IndexingJobProgressUpdate;
    }): Promise<void>;
}

export interface EmbeddingProvider {
    readonly dimension: number;
    readonly fingerprint?: string;
    embedDocuments(texts: string[]): Promise<number[][]>;
    embedQuery(text: string): Promise<number[]>;
}

export interface GitHubContentClient {
    compareCommits(params: {
        base: string;
        head: string;
        owner: string;
        repo: string;
    }): Promise<GitHubChangedFile[]>;
    getFileContent(params: {
        owner: string;
        path: string;
        ref: string;
        repo: string;
    }): Promise<string | null>;
    getRepositorySnapshot?(params: {
        owner: string;
        ref: string;
        repo: string;
    }): Promise<GitHubRepositorySnapshot>;
    listRepositoryFiles(params: {
        owner: string;
        ref: string;
        repo: string;
    }): Promise<GitHubFileEntry[]>;
}

export interface GitHubContentClientFactory {
    forInstallation(installationId: number): Promise<GitHubContentClient>;
}

export type GitHubCheckRunConclusion = "failure" | "success";

export type GitHubCheckRunHandle = {
    checkRunId: number;
    installationId: number;
    owner: string;
    repo: string;
};

export interface GitHubChecksClient {
    createCheckRun(params: {
        headSha: string;
        name: string;
        owner: string;
        repo: string;
        status: "in_progress" | "queued";
    }): Promise<{ id: number }>;
    updateCheckRun(params: {
        checkRunId: number;
        conclusion?: GitHubCheckRunConclusion;
        owner: string;
        repo: string;
        status: "completed" | "in_progress" | "queued";
        summary?: string;
        title?: string;
    }): Promise<void>;
}

export interface GitHubChecksClientFactory {
    checksForInstallation(installationId: number): Promise<GitHubChecksClient>;
}

export interface CheckRunReporter {
    complete(
        handle: GitHubCheckRunHandle | null,
        result: {
            conclusion: GitHubCheckRunConclusion;
            summary: string;
            title: string;
        }
    ): Promise<void>;
    start(job: IndexingJob): Promise<GitHubCheckRunHandle | null>;
}

export interface CodeIndexStore {
    countCollection(params: {
        collection: string;
        userUid: string;
    }): Promise<number>;
    deleteCollection(params: {
        collection: string;
        userUid: string;
    }): Promise<void>;
    deletePath(params: {
        collection: string;
        pathSegments: string[];
        userUid: string;
    }): Promise<void>;
    ensureCollection(params: {
        collection: string;
        dimension: number;
        userUid: string;
    }): Promise<void>;
    resetCollection(params: {
        collection: string;
        dimension: number;
        userUid: string;
    }): Promise<void>;
    search(params: {
        collection: string;
        queryVector: number[];
        top: number;
        userUid: string;
    }): Promise<CodeSearchResult[]>;
    upsertChunks(params: {
        chunks: IndexedCodeChunk[];
        collection: string;
        userUid: string;
        vectors: number[][];
    }): Promise<void>;
}

export interface IndexingQueue {
    deleteRepositoryJobs?(params: {
        installationId: number | string;
        repoId: number | string;
    }): Promise<number | void>;
    enqueue(job: IndexingJob): Promise<EnqueuedIndexingJob>;
}

export interface DeliveryStore {
    has(deliveryId: string): Promise<boolean>;
    mark(deliveryId: string): Promise<void>;
    release?(deliveryId: string): Promise<void>;
    reserve?(deliveryId: string): Promise<boolean>;
}

export interface RepoManifestStore {
    delete(params: { collection: string; userUid: string }): Promise<void>;
    get(params: {
        collection: string;
        userUid: string;
    }): Promise<RepoIndexManifest | null>;
    listCollectionsByPrefix(params: {
        collectionPrefix: string;
        userUid: string;
    }): Promise<string[]>;
    save(manifest: RepoIndexManifest): Promise<void>;
}
