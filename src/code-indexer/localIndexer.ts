import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { hostname, userInfo } from "node:os";
import { basename, dirname, join, relative, sep } from "node:path";
import { promisify } from "node:util";

import {
    defaultCodeChunker,
    type ChunkingOptions,
} from "./chunker.js";
import {
    defaultBranchCollectionForRepo,
    pointIdForChunkIdentity,
    userUidForInstallation,
} from "./naming.js";
import { loadRepoIndexingConfig } from "./repoConfig.js";
import {
    indexingFingerprintForOptions,
    mergeChunkingOptions,
    RepoIndexer,
} from "./repoIndexer.js";
import type {
    CodeIndexStore,
    EmbeddingProvider,
    FullIndexJob,
    GitHubChangedFile,
    GitHubContentClient,
    GitHubContentClientFactory,
    GitHubFileEntry,
    GitHubRepositoryRef,
    GitHubRepositorySnapshot,
    GitHubRepositorySnapshotContent,
    GitHubRepositorySnapshotFile,
    RepoIndexManifest,
    RepoManifestStore,
} from "./types.js";

const execFile = promisify(execFileCallback);
const GIT_LS_FILES_MAX_BUFFER = 10 * 1024 * 1024;
const HARD_EXCLUDED_DIRECTORIES = new Set([
    ".aws",
    ".azure",
    ".cache",
    ".docker",
    ".git",
    ".gnupg",
    ".idea",
    ".kube",
    ".npm-cache",
    ".ssh",
    ".vscode",
    "build",
    "cache",
    "coverage",
    "dist",
    "logs",
    "node_modules",
    "out",
    "private",
    "test-results",
]);
const HARD_EXCLUDED_PATH_PREFIXES = [[".config", "gcloud"]];
const HARD_EXCLUDED_FILENAMES = new Set([
    ".git-credentials",
    ".netrc",
    ".npmrc",
    ".pypirc",
    "_netrc",
    "application_default_credentials.json",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
    "id_rsa",
    "ydb-sa.json",
]);
const HARD_EXCLUDED_EXTENSIONS = new Set([
    ".cer",
    ".crt",
    ".key",
    ".log",
    ".p12",
    ".pem",
    ".pfx",
]);

export type LocalRepositoryIndexSummary = {
    chunkCount?: number;
    collection: string;
    installationId: number;
    lastError?: string;
    lastIndexedAt?: string;
    lastIndexedSha?: string;
    owner: string;
    repo: string;
    repoId: number;
    root: string;
    status: string;
};

export type LocalRepositoryIndexStatus = {
    indexes: LocalRepositoryIndexSummary[];
};

export type LocalRepositoryRootOptions = {
    allowedRoots?: string[];
    root?: string;
    workspaceRoot?: string;
};

type LocalRepositoryIdentity = {
    collection: string;
    installationId: number;
    repoId: number;
    repository: GitHubRepositoryRef;
    root: string;
    userUid: string;
};

const LEGACY_LOCAL_INDEX_NAMESPACE = "";

export async function resolveLocalRepositoryRoot(
    options: LocalRepositoryRootOptions
): Promise<string> {
    const explicitRoot = options.root?.trim();
    const workspaceRoot = options.workspaceRoot?.trim();
    const requestedRoot = explicitRoot || workspaceRoot;
    if (!requestedRoot) {
        throw new Error(
            "root is required when YDB_QDRANT_MCP_WORKSPACE_ROOT is not configured"
        );
    }
    const resolvedRoot = await realpath(requestedRoot);
    const configuredAllowedRoots = (options.allowedRoots ?? [])
        .map((root) => root.trim())
        .filter((root) => root.length > 0);
    const effectiveAllowedRoots =
        configuredAllowedRoots.length === 0 && explicitRoot && workspaceRoot
            ? [workspaceRoot]
            : configuredAllowedRoots;
    const allowedRoots = await Promise.all(
        effectiveAllowedRoots.map((root) => realpath(root))
    );
    if (
        allowedRoots.length > 0 &&
        !allowedRoots.some((allowedRoot) => isSameOrChild(resolvedRoot, allowedRoot))
    ) {
        throw new Error(`root ${resolvedRoot} is outside allowed roots`);
    }
    return resolvedRoot;
}

export class LocalCodeIndexer {
    private readonly allowedRoots: string[];
    private readonly clientFactory = new LocalGitHubContentClientFactory();
    private readonly embeddingProvider: EmbeddingProvider;
    private readonly indexer: RepoIndexer;
    private readonly localNamespace: string;
    private readonly manifestStore: RepoManifestStore;
    private readonly statuses = new Map<string, LocalRepositoryIndexSummary>();
    private readonly store: CodeIndexStore;
    private readonly workspaceRoot?: string;

    constructor(params: {
        allowedRoots?: string[];
        embeddingProvider: EmbeddingProvider;
        localNamespace?: string;
        manifestStore: RepoManifestStore;
        store: CodeIndexStore;
        workspaceRoot?: string;
    }) {
        this.allowedRoots = params.allowedRoots ?? [];
        this.embeddingProvider = params.embeddingProvider;
        this.localNamespace = resolveLocalIndexNamespace(params.localNamespace);
        this.manifestStore = params.manifestStore;
        this.store = params.store;
        this.workspaceRoot = params.workspaceRoot;
        this.indexer = new RepoIndexer({
            clientFactory: this.clientFactory,
            embeddingProvider: params.embeddingProvider,
            manifestStore: params.manifestStore,
            statusStore: {
                markRepositoryStatus: (status) => {
                    const repoId = numericId(status.repoId, "repoId");
                    const current = this.statuses.get(String(repoId));
                    const installationId =
                        status.installationId === undefined
                            ? current?.installationId
                            : numericId(status.installationId, "installationId");
                    if (installationId === undefined) {
                        throw new Error(
                            "local index status update is missing installationId"
                        );
                    }
                    this.statuses.set(String(repoId), {
                        collection:
                            current?.collection ?? defaultBranchCollectionForRepo(repoId),
                        installationId,
                        owner: status.owner ?? current?.owner ?? "local",
                        repo: status.repo ?? current?.repo ?? "repository",
                        repoId,
                        root: current?.root ?? "",
                        status: status.status,
                        ...(status.chunkCount === undefined
                            ? {}
                            : { chunkCount: status.chunkCount }),
                        ...(status.lastError === undefined
                            ? {}
                            : { lastError: status.lastError }),
                        ...(status.lastIndexedAt === undefined
                            ? {}
                            : { lastIndexedAt: status.lastIndexedAt.toISOString() }),
                        ...(status.lastIndexedSha === undefined
                            ? {}
                            : { lastIndexedSha: status.lastIndexedSha }),
                    });
                    return Promise.resolve();
                },
            },
            store: params.store,
        });
    }

    async indexRepository(params: {
        root?: string;
    }): Promise<LocalRepositoryIndexSummary> {
        const root = await this.resolveRoot(params.root);
        const identity = localRepositoryIdentity(root, this.localNamespace);
        const initialStatus: LocalRepositoryIndexSummary = {
            collection: identity.collection,
            installationId: identity.installationId,
            owner: identity.repository.owner,
            repo: identity.repository.repo,
            repoId: identity.repoId,
            root,
            status: "indexing",
        };
        this.statuses.set(String(identity.repoId), initialStatus);
        this.clientFactory.setRoot(identity.installationId, root);
        try {
            await this.indexer.processJob({
                installationId: identity.installationId,
                kind: "full-index",
                reason: "local-mcp-index",
                ref: "local",
                repository: identity.repository,
                sha: `local:${contentFingerprint(root)}`,
            } satisfies FullIndexJob);
        } catch (err: unknown) {
            const failedStatus = {
                ...initialStatus,
                ...(this.statuses.get(String(identity.repoId)) ?? {}),
                lastError: err instanceof Error ? err.message : String(err),
                status: "failed",
            };
            this.statuses.set(String(identity.repoId), failedStatus);
            throw err;
        }
        return this.statuses.get(String(identity.repoId)) ?? initialStatus;
    }

    async getIndexStatus(params: {
        root?: string;
    }): Promise<LocalRepositoryIndexStatus> {
        if (!params.root && !this.workspaceRoot) {
            return { indexes: [...this.statuses.values()] };
        }
        const root = await this.resolveRoot(params.root);
        const identity = localRepositoryIdentity(root, this.localNamespace);
        const index =
            this.statuses.get(String(identity.repoId)) ??
            (await this.loadPersistedStatusForRoot(root));
        return { indexes: index ? [index] : [] };
    }

    async listRepositoryIndexes(params: { root?: string }): Promise<{
        defaultBranch: {
            branch: string;
            chunkCount?: number;
            collection: string;
            lastError?: string;
            lastIndexedAt?: string;
            lastIndexedSha?: string;
            status: string;
        };
        installationId: number;
        owner: string;
        pullRequests: [];
        repo: string;
        repoId: number;
    } | null> {
        if (!params.root && !this.workspaceRoot) {
            return null;
        }
        const status = (await this.getIndexStatus(params)).indexes[0];
        if (!status) {
            return null;
        }
        return {
            defaultBranch: {
                branch: "local",
                collection: status.collection,
                status: status.status,
                ...(status.chunkCount === undefined
                    ? {}
                    : { chunkCount: status.chunkCount }),
                ...(status.lastError === undefined
                    ? {}
                    : { lastError: status.lastError }),
                ...(status.lastIndexedAt === undefined
                    ? {}
                    : { lastIndexedAt: status.lastIndexedAt }),
                ...(status.lastIndexedSha === undefined
                    ? {}
                    : { lastIndexedSha: status.lastIndexedSha }),
            },
            installationId: status.installationId,
            owner: status.owner,
            pullRequests: [],
            repo: status.repo,
            repoId: status.repoId,
        };
    }

    private async resolveRoot(root?: string): Promise<string> {
        return await resolveLocalRepositoryRoot({
            allowedRoots: this.allowedRoots,
            root,
            workspaceRoot: this.workspaceRoot,
        });
    }

    private async loadPersistedStatusForRoot(
        root: string
    ): Promise<LocalRepositoryIndexSummary | null> {
        const identity = localRepositoryIdentity(root, this.localNamespace);
        const currentStatus = await this.loadPersistedStatusForIdentity(
            root,
            identity
        );
        if (currentStatus || this.localNamespace === LEGACY_LOCAL_INDEX_NAMESPACE) {
            return currentStatus;
        }
        return await this.loadPersistedStatusForIdentity(
            root,
            localRepositoryIdentity(root, LEGACY_LOCAL_INDEX_NAMESPACE)
        );
    }

    private async loadPersistedStatusForIdentity(
        root: string,
        identity: LocalRepositoryIdentity
    ): Promise<LocalRepositoryIndexSummary | null> {
        const manifest = await this.manifestStore.get({
            collection: identity.collection,
            userUid: identity.userUid,
        });
        if (!manifest) {
            return null;
        }
        const fingerprintStatus = await this.verifyPersistedIndexingFingerprint({
            identity,
            manifest,
            root,
        });
        if (fingerprintStatus) {
            return fingerprintStatus;
        }
        const manifestChunkCount = chunkCountFromManifest(manifest);
        const expectedPointIds =
            manifestChunkCount === null ? null : pointIdsFromManifest(manifest);
        let pointCount: number;
        try {
            pointCount = await this.store.countCollection({
                collection: identity.collection,
                userUid: identity.userUid,
            });
        } catch (err: unknown) {
            const status = persistedStatusFromManifest({
                chunkCount: manifestChunkCount ?? undefined,
                identity,
                lastError: `persisted index verification failed: ${errorMessage(err)}`,
                manifest,
                root,
                status: "failed",
            });
            this.statuses.set(String(identity.repoId), status);
            return status;
        }
        if (manifestChunkCount === null || expectedPointIds === null) {
            const status = persistedStatusFromManifest({
                chunkCount: undefined,
                identity,
                lastError:
                    "persisted index verification failed: manifest files are missing chunk counts",
                manifest,
                root,
                status: "failed",
            });
            this.statuses.set(String(identity.repoId), status);
            return status;
        }
        if (pointCount !== manifestChunkCount) {
            const status = persistedStatusFromManifest({
                chunkCount: manifestChunkCount,
                identity,
                lastError: `persisted index verification failed: point count ${pointCount} does not match manifest chunk count ${manifestChunkCount}`,
                manifest,
                root,
                status: "failed",
            });
            this.statuses.set(String(identity.repoId), status);
            return status;
        }
        let existingPointIdCount: number;
        try {
            existingPointIdCount = await this.store.countExistingPointIds({
                collection: identity.collection,
                pointIds: expectedPointIds,
                userUid: identity.userUid,
            });
        } catch (err: unknown) {
            const status = persistedStatusFromManifest({
                chunkCount: manifestChunkCount,
                identity,
                lastError: `persisted index verification failed: ${errorMessage(err)}`,
                manifest,
                root,
                status: "failed",
            });
            this.statuses.set(String(identity.repoId), status);
            return status;
        }
        if (existingPointIdCount !== manifestChunkCount) {
            const status = persistedStatusFromManifest({
                chunkCount: manifestChunkCount,
                identity,
                lastError: `persisted index verification failed: expected point id count ${existingPointIdCount} does not match manifest chunk count ${manifestChunkCount}`,
                manifest,
                root,
                status: "failed",
            });
            this.statuses.set(String(identity.repoId), status);
            return status;
        }
        const status = persistedStatusFromManifest({
            chunkCount: manifestChunkCount,
            identity,
            manifest,
            root,
            status: "ready",
        });
        this.statuses.set(String(identity.repoId), status);
        return status;
    }

    private async verifyPersistedIndexingFingerprint(params: {
        identity: LocalRepositoryIdentity;
        manifest: RepoIndexManifest;
        root: string;
    }): Promise<LocalRepositoryIndexSummary | null> {
        let currentFingerprint: string;
        try {
            currentFingerprint = await this.currentIndexingFingerprint(params);
        } catch (err: unknown) {
            return this.cachePersistedFailure({
                identity: params.identity,
                lastError: `persisted index verification failed: ${errorMessage(err)}`,
                manifest: params.manifest,
                root: params.root,
            });
        }
        if (!params.manifest.indexingFingerprint) {
            return this.cachePersistedFailure({
                identity: params.identity,
                lastError:
                    "persisted index verification failed: manifest is missing indexing fingerprint; reindex required",
                manifest: params.manifest,
                root: params.root,
            });
        }
        if (params.manifest.indexingFingerprint !== currentFingerprint) {
            return this.cachePersistedFailure({
                identity: params.identity,
                lastError:
                    "persisted index verification failed: indexing fingerprint changed; reindex required",
                manifest: params.manifest,
                root: params.root,
            });
        }
        return null;
    }

    private async currentIndexingFingerprint(params: {
        identity: LocalRepositoryIdentity;
        manifest: RepoIndexManifest;
        root: string;
    }): Promise<string> {
        const repoConfig = await loadRepoIndexingConfig({
            client: new LocalGitHubContentClient(params.root),
            ref: params.manifest.sha || params.manifest.ref,
            repository: params.identity.repository,
        });
        const baseChunkingOptions: ChunkingOptions = {};
        return indexingFingerprintForOptions({
            chunker: defaultCodeChunker,
            chunkingOptions: mergeChunkingOptions(
                baseChunkingOptions,
                repoConfig
            ),
            embeddingProvider: this.embeddingProvider,
        });
    }

    private cachePersistedFailure(params: {
        identity: LocalRepositoryIdentity;
        lastError: string;
        manifest: RepoIndexManifest;
        root: string;
    }): LocalRepositoryIndexSummary {
        const status = persistedStatusFromManifest({
            chunkCount: chunkCountFromManifest(params.manifest) ?? undefined,
            identity: params.identity,
            lastError: params.lastError,
            manifest: params.manifest,
            root: params.root,
            status: "failed",
        });
        this.statuses.set(String(params.identity.repoId), status);
        return status;
    }
}

function persistedStatusFromManifest(params: {
    chunkCount?: number;
    identity: LocalRepositoryIdentity;
    lastError?: string;
    manifest: RepoIndexManifest;
    root: string;
    status: "failed" | "ready";
}): LocalRepositoryIndexSummary {
    const status: LocalRepositoryIndexSummary = {
        collection: params.identity.collection,
        installationId: params.identity.installationId,
        lastIndexedSha: params.manifest.sha,
        owner: params.manifest.repository.owner,
        repo: params.manifest.repository.repo,
        repoId: params.identity.repoId,
        root: params.root,
        status: params.status,
    };
    if (params.chunkCount !== undefined) {
        status.chunkCount = params.chunkCount;
    }
    if (params.lastError !== undefined) {
        status.lastError = params.lastError;
    }
    return status;
}

class LocalGitHubContentClientFactory implements GitHubContentClientFactory {
    private readonly roots = new Map<number, string>();

    setRoot(installationId: number, root: string): void {
        this.roots.set(installationId, root);
    }

    forInstallation(installationId: number): Promise<GitHubContentClient> {
        const root = this.roots.get(installationId);
        if (!root) {
            throw new Error(`local root is not registered for ${installationId}`);
        }
        return Promise.resolve(new LocalGitHubContentClient(root));
    }
}

class LocalGitHubContentClient implements GitHubContentClient {
    constructor(private readonly root: string) {}

    compareCommits(): Promise<GitHubChangedFile[]> {
        return Promise.resolve([]);
    }

    async getFileContent(params: { path: string }): Promise<string | null> {
        if (!isSafeLocalRepositoryPath(params.path)) {
            return null;
        }
        try {
            return await readFile(join(this.root, params.path), "utf8");
        } catch {
            return null;
        }
    }

    async getRepositorySnapshot(): Promise<GitHubRepositorySnapshot> {
        const files = await listLocalRepositoryFiles(this.root);
        return new LocalRepositorySnapshot(this.root, files);
    }

    async listRepositoryFiles(): Promise<GitHubFileEntry[]> {
        const files = await listLocalRepositoryFiles(this.root);
        return files.map((file) => ({
            path: file.path,
            sha: "",
            size: file.size,
        }));
    }
}

class LocalRepositorySnapshot implements GitHubRepositorySnapshot {
    constructor(
        private readonly root: string,
        readonly files: GitHubRepositorySnapshotFile[]
    ) {}

    async close(): Promise<void> {}

    async getFileContent(
        path: string
    ): Promise<GitHubRepositorySnapshotContent | null> {
        if (!isSafeLocalRepositoryPath(path)) {
            return null;
        }
        try {
            const content = await readFile(join(this.root, path));
            return {
                blobSha: sha1(content),
                content: content.toString("utf8"),
            };
        } catch {
            return null;
        }
    }
}

export async function listLocalRepositoryFiles(
    root: string
): Promise<GitHubRepositorySnapshotFile[]> {
    const gitFiles = await listGitRepositoryFiles(root);
    const files = gitFiles ?? (await listLocalSnapshotFiles(root));
    return files
        .filter((file) => isSafeLocalRepositoryPath(file.path))
        .sort((left, right) => left.path.localeCompare(right.path));
}

async function listGitRepositoryFiles(
    root: string
): Promise<GitHubRepositorySnapshotFile[] | null> {
    if (!(await isGitWorkTree(root))) {
        return null;
    }
    try {
        const { stdout } = await execFile(
            "git",
            [
                "-C",
                root,
                "ls-files",
                "--cached",
                "--others",
                "--exclude-standard",
                "-z",
                "--",
                ".",
            ],
            {
                encoding: "utf8",
                maxBuffer: GIT_LS_FILES_MAX_BUFFER,
            }
        );
        const paths = String(stdout)
            .split("\0")
            .map((path) => path.trim())
            .filter((path) => path.length > 0);
        const files: Array<GitHubRepositorySnapshotFile | null> =
            await Promise.all(
                paths.map(
                    async (
                        path
                    ): Promise<GitHubRepositorySnapshotFile | null> => {
                        if (!isSafeLocalRepositoryPath(path)) {
                            return null;
                        }
                        try {
                            const fileStat = await lstat(join(root, path));
                            return fileStat.isFile()
                                ? {
                                      path: path.replace(/\\/g, "/"),
                                      size: fileStat.size,
                                  }
                                : null;
                        } catch {
                            return null;
                        }
                    }
                )
            );
        return files.filter(
            (file): file is GitHubRepositorySnapshotFile => file !== null
        );
    } catch (err: unknown) {
        throw new Error(`git ls-files failed for ${root}: ${errorMessage(err)}`);
    }
}

async function isGitWorkTree(root: string): Promise<boolean> {
    try {
        const { stdout } = await execFile(
            "git",
            ["-C", root, "rev-parse", "--is-inside-work-tree"],
            {
                encoding: "utf8",
                maxBuffer: 1024,
            }
        );
        return String(stdout).trim() === "true";
    } catch (err: unknown) {
        if (
            isNotGitRepositoryError(err) &&
            !(await hasGitMetadataInAncestors(root))
        ) {
            return false;
        }
        throw new Error(`git rev-parse failed for ${root}: ${errorMessage(err)}`);
    }
}

async function hasGitMetadataInAncestors(root: string): Promise<boolean> {
    let current = root;
    while (true) {
        try {
            await lstat(join(current, ".git"));
            return true;
        } catch {
            const parent = dirname(current);
            if (parent === current) {
                return false;
            }
            current = parent;
        }
    }
}

async function listLocalSnapshotFiles(
    root: string,
    current: string = root
): Promise<GitHubRepositorySnapshotFile[]> {
    const entries = await readdir(current, { withFileTypes: true });
    const files: GitHubRepositorySnapshotFile[] = [];
    for (const entry of entries) {
        const entryPath = join(current, entry.name);
        const repoPath = toRepoPath(root, entryPath);
        if (!isSafeLocalRepositoryPath(repoPath)) {
            continue;
        }
        if (entry.isDirectory()) {
            files.push(...(await listLocalSnapshotFiles(root, entryPath)));
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        const fileStat = await lstat(entryPath);
        files.push({
            path: repoPath,
            size: fileStat.size,
        });
    }
    return files;
}

function toRepoPath(root: string, path: string): string {
    return relative(root, path).split(sep).join("/");
}

function isSameOrChild(path: string, parent: string): boolean {
    const pathWithSeparator = path.endsWith(sep) ? path : `${path}${sep}`;
    const parentWithSeparator = parent.endsWith(sep) ? parent : `${parent}${sep}`;
    return path === parent || pathWithSeparator.startsWith(parentWithSeparator);
}

function isSafeLocalRepositoryPath(path: string): boolean {
    const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!normalizedPath || normalizedPath.startsWith("../")) {
        return false;
    }
    const segments = normalizedPath.split("/");
    if (segments.includes("..")) {
        return false;
    }
    const lowerSegments = segments.map((segment) => segment.toLowerCase());
    if (lowerSegments.some((segment) => HARD_EXCLUDED_DIRECTORIES.has(segment))) {
        return false;
    }
    if (hasHardExcludedPathPrefix(lowerSegments)) {
        return false;
    }
    const filename = segments.at(-1)?.toLowerCase() ?? "";
    if (filename.startsWith(".env") || HARD_EXCLUDED_FILENAMES.has(filename)) {
        return false;
    }
    const dotIndex = filename.lastIndexOf(".");
    const extension = dotIndex >= 0 ? filename.slice(dotIndex) : "";
    return !HARD_EXCLUDED_EXTENSIONS.has(extension);
}

function localRepositoryIds(
    root: string,
    localNamespace: string
): {
    installationId: number;
    repoId: number;
} {
    const scopedRoot =
        localNamespace === LEGACY_LOCAL_INDEX_NAMESPACE
            ? root
            : `${localNamespace}:${root}`;
    return {
        installationId: stablePositiveInt(`installation:${scopedRoot}`),
        repoId: stablePositiveInt(`repo:${scopedRoot}`),
    };
}

function localRepositoryIdentity(
    root: string,
    localNamespace: string
): LocalRepositoryIdentity {
    const ids = localRepositoryIds(root, localNamespace);
    const repository: GitHubRepositoryRef = {
        defaultBranch: "local",
        owner: "local",
        repo: basename(root) || "repository",
        repoId: ids.repoId,
    };
    return {
        collection: defaultBranchCollectionForRepo(ids.repoId),
        installationId: ids.installationId,
        repoId: ids.repoId,
        repository,
        root,
        userUid: userUidForInstallation(ids.installationId),
    };
}

function chunkCountFromManifest(manifest: RepoIndexManifest): number | null {
    if (
        !manifest.files.every(
            (file) =>
                Number.isSafeInteger(file.chunkCount) &&
                (file.chunkCount ?? -1) >= 0
        )
    ) {
        return null;
    }
    return manifest.files.reduce((sum, file) => sum + (file.chunkCount ?? 0), 0);
}

function pointIdsFromManifest(manifest: RepoIndexManifest): string[] | null {
    const ids: string[] = [];
    const indexedRef = manifest.sha || manifest.ref;
    for (const file of manifest.files) {
        if (
            !Number.isSafeInteger(file.chunkCount) ||
            (file.chunkCount ?? -1) < 0
        ) {
            return null;
        }
        for (
            let chunkIndex = 0;
            chunkIndex < (file.chunkCount ?? 0);
            chunkIndex += 1
        ) {
            ids.push(
                pointIdForChunkIdentity({
                    blobSha: file.blobSha,
                    chunkIndex,
                    path: file.path,
                    ref: indexedRef,
                    repoId: manifest.repository.repoId,
                })
            );
        }
    }
    return ids;
}

function hasHardExcludedPathPrefix(segments: string[]): boolean {
    return HARD_EXCLUDED_PATH_PREFIXES.some((prefix) => {
        if (segments.length < prefix.length) {
            return false;
        }
        return prefix.every((segment, index) => segments[index] === segment);
    });
}

function resolveLocalIndexNamespace(localNamespace: string | undefined): string {
    if (localNamespace !== undefined) {
        return localNamespace.trim();
    }
    return `auto:${sha1Text(defaultLocalIndexNamespaceInput()).slice(0, 16)}`;
}

function defaultLocalIndexNamespaceInput(): string {
    let username = process.env.USER || process.env.USERNAME || "unknown";
    try {
        username = userInfo().username || username;
    } catch {
        // Keep the environment-derived fallback.
    }
    return `${username}@${hostname() || "unknown"}`;
}

function numericId(value: number | string, label: string): number {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        return value;
    }
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) {
        return parsed;
    }
    throw new Error(`invalid ${label}: ${String(value)}`);
}

function stablePositiveInt(value: string): number {
    const digest = createHash("sha256").update(value).digest();
    return 1 + (digest.readUInt32BE(0) % 2_000_000_000);
}

function contentFingerprint(root: string): string {
    return createHash("sha256").update(root).digest("hex").slice(0, 16);
}

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

function errorStderr(err: unknown): string {
    if (!err || typeof err !== "object" || !("stderr" in err)) {
        return "";
    }
    const stderr = (err as { stderr?: unknown }).stderr;
    return typeof stderr === "string" ? stderr : "";
}

function isNotGitRepositoryError(err: unknown): boolean {
    const stderr = errorStderr(err).toLowerCase();
    return (
        stderr.includes("not a git repository") ||
        stderr.includes("not a gitdir")
    );
}

function sha1Text(value: string): string {
    return createHash("sha1").update(value).digest("hex");
}

function sha1(value: Buffer): string {
    return createHash("sha1").update(value).digest("hex");
}
