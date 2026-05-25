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

export interface EmbeddingProvider {
    readonly dimension: number;
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
    enqueue(job: IndexingJob): Promise<void>;
}

export interface DeliveryStore {
    has(deliveryId: string): Promise<boolean>;
    mark(deliveryId: string): Promise<void>;
}

export interface RepoManifestStore {
    delete(params: { collection: string; userUid: string }): Promise<void>;
    get(params: {
        collection: string;
        userUid: string;
    }): Promise<RepoIndexManifest | null>;
    save(manifest: RepoIndexManifest): Promise<void>;
}
