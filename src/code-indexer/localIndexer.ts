import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { basename, join, relative, sep } from "node:path";
import { promisify } from "node:util";

import {
    defaultBranchCollectionForRepo,
    userUidForInstallation,
} from "./naming.js";
import { RepoIndexer } from "./repoIndexer.js";
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
    ".cache",
    ".git",
    ".idea",
    ".npm-cache",
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
const HARD_EXCLUDED_FILENAMES = new Set([
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
    private readonly indexer: RepoIndexer;
    private readonly manifestStore: RepoManifestStore;
    private readonly statuses = new Map<string, LocalRepositoryIndexSummary>();
    private readonly store: CodeIndexStore;
    private readonly workspaceRoot?: string;

    constructor(params: {
        allowedRoots?: string[];
        embeddingProvider: EmbeddingProvider;
        manifestStore: RepoManifestStore;
        store: CodeIndexStore;
        workspaceRoot?: string;
    }) {
        this.allowedRoots = params.allowedRoots ?? [];
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
        const identity = localRepositoryIdentity(root);
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
        const identity = localRepositoryIdentity(root);
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
        const identity = localRepositoryIdentity(root);
        const manifest = await this.manifestStore.get({
            collection: identity.collection,
            userUid: identity.userUid,
        });
        if (!manifest) {
            return null;
        }
        const manifestChunkCount = chunkCountFromManifest(manifest);
        const chunkCount =
            manifestChunkCount ??
            (await this.store.countCollection({
                collection: identity.collection,
                userUid: identity.userUid,
            }));
        const status: LocalRepositoryIndexSummary = {
            chunkCount,
            collection: identity.collection,
            installationId: identity.installationId,
            lastIndexedSha: manifest.sha,
            owner: manifest.repository.owner,
            repo: manifest.repository.repo,
            repoId: identity.repoId,
            root,
            status: "ready",
        };
        this.statuses.set(String(identity.repoId), status);
        return status;
    }
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
    } catch {
        return null;
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
    if (
        segments.some((segment) =>
            HARD_EXCLUDED_DIRECTORIES.has(segment.toLowerCase())
        )
    ) {
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

function localRepositoryIds(root: string): {
    installationId: number;
    repoId: number;
} {
    return {
        installationId: stablePositiveInt(`installation:${root}`),
        repoId: stablePositiveInt(`repo:${root}`),
    };
}

function localRepositoryIdentity(root: string): LocalRepositoryIdentity {
    const ids = localRepositoryIds(root);
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
    if (!manifest.files.every((file) => typeof file.chunkCount === "number")) {
        return null;
    }
    return manifest.files.reduce((sum, file) => sum + (file.chunkCount ?? 0), 0);
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

function sha1(value: Buffer): string {
    return createHash("sha1").update(value).digest("hex");
}
