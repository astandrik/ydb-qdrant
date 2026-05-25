import { createHash, createSign } from "node:crypto";
import { createWriteStream } from "node:fs";
import { lstat, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type {
    GitHubChangedFile,
    GitHubChecksClient,
    GitHubChecksClientFactory,
    GitHubContentClient,
    GitHubContentClientFactory,
    GitHubFileEntry,
    GitHubRepositorySnapshot,
    GitHubRepositorySnapshotContent,
    GitHubRepositorySnapshotFile,
} from "./types.js";

type FetchLike = typeof fetch;

const GITHUB_RATE_LIMIT_RETRY_SAFETY_MS = 1_000;
const execFileAsync = promisify(execFile);

type GitHubAppAuthOptions = {
    apiBaseUrl?: string;
    apiVersion?: string;
    appId: string;
    fetchImpl?: FetchLike;
    privateKey: string;
};

type InstallationTokenResponse = {
    token: string;
};

type TreeResponse = {
    tree: Array<{
        path?: string;
        sha?: string;
        size?: number;
        type?: string;
    }>;
    truncated?: boolean;
};

type CompareResponse = {
    files?: Array<{
        filename?: string;
        previous_filename?: string;
        sha?: string;
        status?: string;
    }>;
};

type CreateCheckRunResponse = {
    id: number;
};

function base64Url(value: string | Buffer): string {
    return Buffer.from(value)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function createJwt(params: {
    appId: string;
    nowMs?: number;
    privateKey: string;
}): string {
    const nowSeconds = Math.floor((params.nowMs ?? Date.now()) / 1000);
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64Url(
        JSON.stringify({
            exp: nowSeconds + 9 * 60,
            iat: nowSeconds - 60,
            iss: params.appId,
        })
    );
    const unsigned = `${header}.${payload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    signer.end();
    const signature = base64Url(signer.sign(params.privateKey));
    return `${unsigned}.${signature}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isInstallationTokenResponse(
    value: unknown
): value is InstallationTokenResponse {
    return isRecord(value) && typeof value.token === "string";
}

function isTreeResponse(value: unknown): value is TreeResponse {
    return (
        isRecord(value) &&
        Array.isArray(value.tree) &&
        value.tree.every(isRecord)
    );
}

function isCompareResponse(value: unknown): value is CompareResponse {
    return isRecord(value) && (value.files === undefined || Array.isArray(value.files));
}

function isCreateCheckRunResponse(
    value: unknown
): value is CreateCheckRunResponse {
    return isRecord(value) && typeof value.id === "number";
}

function encodePath(path: string): string {
    return path
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
}

function joinApiUrl(baseUrl: string, path: string): string {
    return `${baseUrl.replace(/\/+$/g, "")}${path}`;
}

async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (text.length === 0) {
        return null;
    }
    return JSON.parse(text) as unknown;
}

function readNonNegativeNumberHeader(
    response: Response,
    name: string
): number | null {
    const value = response.headers.get(name);
    if (value === null) {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readGitHubRateLimitRetryDelayMs(response: Response): number | null {
    if (response.status !== 403 && response.status !== 429) {
        return null;
    }

    const retryAfterSeconds = readNonNegativeNumberHeader(response, "retry-after");
    if (retryAfterSeconds !== null) {
        return retryAfterSeconds * 1000 + GITHUB_RATE_LIMIT_RETRY_SAFETY_MS;
    }

    if (response.headers.get("x-ratelimit-remaining") !== "0") {
        return null;
    }

    const resetSeconds = readNonNegativeNumberHeader(
        response,
        "x-ratelimit-reset"
    );
    if (resetSeconds === null) {
        return 0;
    }
    return Math.max(
        0,
        resetSeconds * 1000 - Date.now() + GITHUB_RATE_LIMIT_RETRY_SAFETY_MS
    );
}

async function sleep(ms: number): Promise<void> {
    if (ms <= 0) {
        return;
    }
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

function gitBlobSha(content: Uint8Array): string {
    return createHash("sha1")
        .update(`blob ${content.byteLength}\0`)
        .update(content)
        .digest("hex");
}

function toRepoPath(root: string, filePath: string): string {
    return relative(root, filePath).split(sep).join("/");
}

async function listLocalSnapshotFiles(
    root: string,
    current: string = root
): Promise<GitHubRepositorySnapshotFile[]> {
    const entries = await readdir(current, { withFileTypes: true });
    const files: GitHubRepositorySnapshotFile[] = [];
    for (const entry of entries) {
        const entryPath = join(current, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listLocalSnapshotFiles(root, entryPath)));
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        const fileStat = await lstat(entryPath);
        files.push({
            path: toRepoPath(root, entryPath),
            size: fileStat.size,
        });
    }
    return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function findExtractedArchiveRoot(tempDir: string): Promise<string> {
    const entries = await readdir(tempDir, { withFileTypes: true });
    const directories = entries.filter((entry) => entry.isDirectory());
    if (directories.length !== 1) {
        throw new Error("GitHub archive extraction did not produce one root directory");
    }
    return join(tempDir, directories[0].name);
}

class LocalGitHubRepositorySnapshot implements GitHubRepositorySnapshot {
    private closed = false;

    constructor(
        private readonly tempDir: string,
        private readonly rootDir: string,
        readonly files: GitHubRepositorySnapshotFile[]
    ) {}

    async close(): Promise<void> {
        if (this.closed) {
            return;
        }
        this.closed = true;
        await rm(this.tempDir, { force: true, recursive: true });
    }

    async getFileContent(
        path: string
    ): Promise<GitHubRepositorySnapshotContent | null> {
        const file = this.files.find((entry) => entry.path === path);
        if (!file) {
            return null;
        }
        const content = await readFile(join(this.rootDir, path));
        return {
            blobSha: gitBlobSha(content),
            content: content.toString("utf8"),
        };
    }
}

export class GitHubAppClientFactory
    implements GitHubContentClientFactory, GitHubChecksClientFactory
{
    private readonly apiBaseUrl: string;
    private readonly apiVersion: string;
    private readonly appId: string;
    private readonly fetchImpl: FetchLike;
    private readonly privateKey: string;

    constructor(options: GitHubAppAuthOptions) {
        if (!options.appId.trim()) {
            throw new Error("GitHub app id is required");
        }
        if (!options.privateKey.trim()) {
            throw new Error("GitHub private key is required");
        }
        this.apiBaseUrl = options.apiBaseUrl ?? "https://api.github.com";
        this.apiVersion = options.apiVersion ?? "2022-11-28";
        this.appId = options.appId;
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.privateKey = options.privateKey;
    }

    async forInstallation(
        installationId: number
    ): Promise<GitHubContentClient> {
        const token = await this.createInstallationToken(installationId);
        return new GitHubInstallationClient({
            apiBaseUrl: this.apiBaseUrl,
            apiVersion: this.apiVersion,
            fetchImpl: this.fetchImpl,
            token,
        });
    }

    async checksForInstallation(
        installationId: number
    ): Promise<GitHubChecksClient> {
        const token = await this.createInstallationToken(installationId);
        return new GitHubInstallationClient({
            apiBaseUrl: this.apiBaseUrl,
            apiVersion: this.apiVersion,
            fetchImpl: this.fetchImpl,
            token,
        });
    }

    async createInstallationToken(
        installationId: number
    ): Promise<string> {
        const jwt = createJwt({
            appId: this.appId,
            privateKey: this.privateKey,
        });
        const response = await this.fetchImpl(
            joinApiUrl(
                this.apiBaseUrl,
                `/app/installations/${installationId}/access_tokens`
            ),
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${jwt}`,
                    "X-GitHub-Api-Version": this.apiVersion,
                },
                method: "POST",
            }
        );
        if (!response.ok) {
            throw new Error(
                `GitHub installation token request failed: ${response.status} ${response.statusText}`
            );
        }
        const json = await readJson(response);
        if (!isInstallationTokenResponse(json)) {
            throw new Error("GitHub installation token response is invalid");
        }
        return json.token;
    }
}

class GitHubInstallationClient
    implements GitHubContentClient, GitHubChecksClient
{
    private readonly apiBaseUrl: string;
    private readonly apiVersion: string;
    private readonly fetchImpl: FetchLike;
    private readonly token: string;

    constructor(params: {
        apiBaseUrl: string;
        apiVersion: string;
        fetchImpl: FetchLike;
        token: string;
    }) {
        this.apiBaseUrl = params.apiBaseUrl;
        this.apiVersion = params.apiVersion;
        this.fetchImpl = params.fetchImpl;
        this.token = params.token;
    }

    async compareCommits(params: {
        base: string;
        head: string;
        owner: string;
        repo: string;
    }): Promise<GitHubChangedFile[]> {
        const basehead = encodeURIComponent(`${params.base}...${params.head}`);
        const json = await this.githubJson(
            `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
                params.repo
            )}/compare/${basehead}`
        );
        if (!isCompareResponse(json)) {
            throw new Error("GitHub compare response is invalid");
        }
        return (json.files ?? [])
            .filter((file) => typeof file.filename === "string")
            .map((file) => ({
                filename: file.filename as string,
                previousFilename:
                    typeof file.previous_filename === "string"
                        ? file.previous_filename
                        : undefined,
                sha: typeof file.sha === "string" ? file.sha : undefined,
                status: typeof file.status === "string" ? file.status : "modified",
            }));
    }

    async getFileContent(params: {
        owner: string;
        path: string;
        ref: string;
        repo: string;
    }): Promise<string | null> {
        const response = await this.githubFetch(
            `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
                params.repo
            )}/contents/${encodePath(params.path)}?ref=${encodeURIComponent(
                params.ref
            )}`,
            {
                headers: {
                    Accept: "application/vnd.github.raw",
                },
            }
        );
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(
                `GitHub content request failed: ${response.status} ${response.statusText}`
            );
        }
        return await response.text();
    }

    async getRepositorySnapshot(params: {
        owner: string;
        ref: string;
        repo: string;
    }): Promise<GitHubRepositorySnapshot> {
        const tempDir = await mkdtemp(join(tmpdir(), "ydb-qdrant-gh-archive-"));
        try {
            const archivePath = join(tempDir, "archive.tar.gz");
            await this.downloadTarball({
                archivePath,
                owner: params.owner,
                ref: params.ref,
                repo: params.repo,
            });
            await execFileAsync("tar", ["-xzf", archivePath, "-C", tempDir]);
            const rootDir = await findExtractedArchiveRoot(tempDir);
            const files = await listLocalSnapshotFiles(rootDir);
            return new LocalGitHubRepositorySnapshot(tempDir, rootDir, files);
        } catch (err: unknown) {
            await rm(tempDir, { force: true, recursive: true });
            throw err;
        }
    }

    async listRepositoryFiles(params: {
        owner: string;
        ref: string;
        repo: string;
    }): Promise<GitHubFileEntry[]> {
        const recursive = await this.getTree({
            owner: params.owner,
            recursive: true,
            repo: params.repo,
            treeSha: params.ref,
        });
        if (!recursive.truncated) {
            return treeFiles(recursive);
        }

        const files: GitHubFileEntry[] = [];
        const queue: Array<{ pathPrefix: string; sha: string }> = [
            { pathPrefix: "", sha: params.ref },
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) {
                break;
            }
            const tree = await this.getTree({
                owner: params.owner,
                recursive: false,
                repo: params.repo,
                treeSha: current.sha,
            });
            for (const item of tree.tree) {
                if (
                    typeof item.path !== "string" ||
                    typeof item.sha !== "string" ||
                    typeof item.type !== "string"
                ) {
                    continue;
                }
                const path = current.pathPrefix
                    ? `${current.pathPrefix}/${item.path}`
                    : item.path;
                if (item.type === "tree") {
                    queue.push({ pathPrefix: path, sha: item.sha });
                    continue;
                }
                if (item.type === "blob") {
                    files.push({
                        path,
                        sha: item.sha,
                        size:
                            typeof item.size === "number"
                                ? item.size
                                : undefined,
                    });
                }
            }
        }

        return files;
    }

    private async downloadTarball(params: {
        archivePath: string;
        owner: string;
        ref: string;
        repo: string;
    }): Promise<void> {
        const response = await this.githubFetch(
            `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
                params.repo
            )}/tarball/${encodeURIComponent(params.ref)}`
        );
        if (!response.ok) {
            throw new Error(
                `GitHub archive request failed: ${response.status} ${response.statusText}`
            );
        }
        if (!response.body) {
            throw new Error("GitHub archive response is missing a body");
        }
        await pipeline(
            Readable.fromWeb(
                response.body as unknown as NodeReadableStream<Uint8Array>
            ),
            createWriteStream(params.archivePath)
        );
    }

    async createCheckRun(params: {
        headSha: string;
        name: string;
        owner: string;
        repo: string;
        status: "in_progress" | "queued";
    }): Promise<{ id: number }> {
        const json = await this.githubJson(
            `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
                params.repo
            )}/check-runs`,
            {
                body: JSON.stringify({
                    head_sha: params.headSha,
                    name: params.name,
                    started_at: new Date().toISOString(),
                    status: params.status,
                }),
                method: "POST",
            }
        );
        if (!isCreateCheckRunResponse(json)) {
            throw new Error("GitHub create check run response is invalid");
        }
        return { id: json.id };
    }

    async updateCheckRun(params: {
        checkRunId: number;
        conclusion?: "failure" | "success";
        owner: string;
        repo: string;
        status: "completed" | "in_progress" | "queued";
        summary?: string;
        title?: string;
    }): Promise<void> {
        await this.githubJson(
            `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
                params.repo
            )}/check-runs/${params.checkRunId}`,
            {
                body: JSON.stringify({
                    ...(params.conclusion
                        ? { conclusion: params.conclusion }
                        : {}),
                    ...(params.status === "completed"
                        ? { completed_at: new Date().toISOString() }
                        : {}),
                    ...(params.summary || params.title
                        ? {
                              output: {
                                  summary: params.summary ?? "",
                                  title: params.title ?? "YDB Qdrant indexing",
                              },
                          }
                        : {}),
                    status: params.status,
                }),
                method: "PATCH",
            }
        );
    }

    private async getTree(params: {
        owner: string;
        recursive: boolean;
        repo: string;
        treeSha: string;
    }): Promise<TreeResponse> {
        const query = params.recursive ? "?recursive=1" : "";
        const json = await this.githubJson(
            `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
                params.repo
            )}/git/trees/${encodeURIComponent(params.treeSha)}${query}`
        );
        if (!isTreeResponse(json)) {
            throw new Error("GitHub tree response is invalid");
        }
        return json;
    }

    private async githubJson(
        path: string,
        init?: RequestInit
    ): Promise<unknown> {
        const response = await this.githubFetch(path, init);
        if (!response.ok) {
            throw new Error(
                `GitHub request failed: ${response.status} ${response.statusText}`
            );
        }
        return await readJson(response);
    }

    private async githubFetch(
        path: string,
        init?: RequestInit
    ): Promise<Response> {
        const response = await this.fetchOnce(path, init);
        const retryDelayMs = readGitHubRateLimitRetryDelayMs(response);
        if (retryDelayMs === null) {
            return response;
        }
        await sleep(retryDelayMs);
        return await this.fetchOnce(path, init);
    }

    private async fetchOnce(path: string, init?: RequestInit): Promise<Response> {
        return await this.fetchImpl(joinApiUrl(this.apiBaseUrl, path), {
            ...init,
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${this.token}`,
                "X-GitHub-Api-Version": this.apiVersion,
                ...init?.headers,
            },
        });
    }
}

function treeFiles(tree: TreeResponse): GitHubFileEntry[] {
    return tree.tree
        .filter((item) => item.type === "blob" && typeof item.path === "string")
        .map((item) => ({
            path: item.path as string,
            sha: typeof item.sha === "string" ? item.sha : "",
            size: typeof item.size === "number" ? item.size : undefined,
        }))
        .filter((item) => item.sha.length > 0);
}
