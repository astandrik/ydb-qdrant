import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
    listLocalRepositoryFiles,
    LocalCodeIndexer,
    resolveLocalRepositoryRoot,
} from "../../src/code-indexer/localIndexer.js";
import type {
    CodeIndexStore,
    EmbeddingProvider,
    RepoIndexManifest,
    RepoManifestStore,
} from "../../src/code-indexer/types.js";

const tempDirs: string[] = [];
const execFile = promisify(execFileCallback);

async function makeTempDir(name: string): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), `ydbq-${name}-`));
    tempDirs.push(dir);
    return dir;
}

afterEach(async () => {
    await Promise.all(
        tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true }))
    );
});

describe("local code indexer root resolution", () => {
    it("uses the configured workspace root when no tool root is provided", async () => {
        const workspaceRoot = await makeTempDir("workspace");

        await expect(
            resolveLocalRepositoryRoot({
                root: undefined,
                workspaceRoot,
            })
        ).resolves.toEqual(await realpath(workspaceRoot));
    });

    it("rejects roots outside the allowed root list", async () => {
        const allowedRoot = await makeTempDir("allowed");
        const otherRoot = await makeTempDir("other");

        await expect(
            resolveLocalRepositoryRoot({
                allowedRoots: [allowedRoot],
                root: otherRoot,
                workspaceRoot: allowedRoot,
            })
        ).rejects.toThrow(/outside allowed roots/);
    });

    it("allows nested paths inside an allowed root", async () => {
        const allowedRoot = await makeTempDir("allowed");
        const nestedRoot = join(allowedRoot, "repo");
        await mkdir(nestedRoot, { recursive: true });

        await expect(
            resolveLocalRepositoryRoot({
                allowedRoots: [allowedRoot],
                root: nestedRoot,
                workspaceRoot: allowedRoot,
            })
        ).resolves.toEqual(await realpath(nestedRoot));
    });

    it("rejects explicit roots outside workspace root when no allowlist is configured", async () => {
        const workspaceRoot = await makeTempDir("workspace");
        const otherRoot = await makeTempDir("other");

        await expect(
            resolveLocalRepositoryRoot({
                root: otherRoot,
                workspaceRoot,
            })
        ).rejects.toThrow(/outside allowed roots/);
    });
});

describe("local repository file listing", () => {
    it("uses git ignored files plus hard excludes before indexing local files", async () => {
        const root = await makeTempDir("repo");
        await execFile("git", ["init"], { cwd: root });
        await mkdir(join(root, "src"), { recursive: true });
        await mkdir(join(root, "cache"), { recursive: true });
        await mkdir(join(root, "private"), { recursive: true });
        await mkdir(join(root, "logs"), { recursive: true });
        await writeFile(join(root, ".gitignore"), "ignored.txt\n");
        await writeFile(join(root, "src", "app.ts"), "export const app = 1;\n");
        await writeFile(join(root, ".env"), "TOKEN=secret\n");
        await writeFile(join(root, ".envrc"), "export TOKEN=secret\n");
        await writeFile(join(root, "cache", "data.ts"), "export const cached = 1;\n");
        await writeFile(join(root, "local.key"), "secret\n");
        await writeFile(join(root, "local.pem"), "secret\n");
        await writeFile(join(root, "private", "secret.ts"), "export const secret = 1;\n");
        await writeFile(join(root, "logs", "app.log"), "secret\n");
        await writeFile(join(root, "ignored.txt"), "ignored\n");

        const paths = (await listLocalRepositoryFiles(root)).map(
            (file) => file.path
        );

        expect(paths).toContain("src/app.ts");
        expect(paths).not.toContain(".env");
        expect(paths).not.toContain(".envrc");
        expect(paths).not.toContain("cache/data.ts");
        expect(paths).not.toContain("local.key");
        expect(paths).not.toContain("local.pem");
        expect(paths).not.toContain("private/secret.ts");
        expect(paths).not.toContain("logs/app.log");
        expect(paths).not.toContain("ignored.txt");
    });
});

describe("local code indexer status", () => {
    it("reconstructs index status from persisted manifest after restart", async () => {
        const root = await makeTempDir("indexed-repo");
        await mkdir(join(root, "src"), { recursive: true });
        await writeFile(
            join(root, "src", "app.ts"),
            [
                "export function localRestartStatus() {",
                '    return "persisted local mcp status";',
                "}",
            ].join("\n")
        );
        const manifestStore = new MemoryManifestStore();
        const store = new MemoryIndexStore();
        const firstIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        });

        const indexed = await firstIndexer.indexRepository({});
        const restartedIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        });

        await expect(restartedIndexer.getIndexStatus({})).resolves.toEqual({
            indexes: [
                expect.objectContaining({
                    chunkCount: indexed.chunkCount,
                    collection: indexed.collection,
                    installationId: indexed.installationId,
                    lastIndexedSha: indexed.lastIndexedSha,
                    owner: indexed.owner,
                    repo: indexed.repo,
                    repoId: indexed.repoId,
                    root: indexed.root,
                    status: "ready",
                }),
            ],
        });
    });

    it("does not count persisted points when manifest contains chunk counts", async () => {
        const root = await makeTempDir("manifest-count-repo");
        await mkdir(join(root, "src"), { recursive: true });
        await writeFile(join(root, "src", "app.ts"), "export const app = 1;\n");
        const manifestStore = new MemoryManifestStore();
        const firstIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store: new MemoryIndexStore(),
            workspaceRoot: root,
        });

        const indexed = await firstIndexer.indexRepository({});
        const restartedIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store: new ThrowingCountIndexStore(),
            workspaceRoot: root,
        });

        await expect(restartedIndexer.getIndexStatus({})).resolves.toEqual({
            indexes: [
                expect.objectContaining({
                    chunkCount: indexed.chunkCount,
                    collection: indexed.collection,
                    status: "ready",
                }),
            ],
        });
    });

    it("does not count persisted points when manifest has no files", async () => {
        const root = await makeTempDir("empty-manifest-repo");
        const manifestStore = new MemoryManifestStore();
        const firstIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store: new MemoryIndexStore(),
            workspaceRoot: root,
        });

        const indexed = await firstIndexer.indexRepository({});
        const restartedIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store: new ThrowingCountIndexStore(),
            workspaceRoot: root,
        });

        await expect(restartedIndexer.getIndexStatus({})).resolves.toEqual({
            indexes: [
                expect.objectContaining({
                    chunkCount: 0,
                    collection: indexed.collection,
                    status: "ready",
                }),
            ],
        });
    });

    it("reconstructs local repository index listing from persisted manifest", async () => {
        const root = await makeTempDir("listed-repo");
        await mkdir(join(root, "src"), { recursive: true });
        await writeFile(join(root, "src", "app.ts"), "export const app = 1;\n");
        const manifestStore = new MemoryManifestStore();
        const store = new MemoryIndexStore();
        const firstIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        });

        const indexed = await firstIndexer.indexRepository({});
        const restartedIndexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        });

        const listing = await restartedIndexer.listRepositoryIndexes({});

        expect(listing?.defaultBranch).toEqual({
            branch: "local",
            chunkCount: indexed.chunkCount,
            collection: indexed.collection,
            lastIndexedSha: indexed.lastIndexedSha,
            status: "ready",
        });
        expect(listing?.installationId).toBe(indexed.installationId);
        expect(listing?.repoId).toBe(indexed.repoId);
    });

    it("does not choose an arbitrary repository listing without a root", async () => {
        const firstRoot = await makeTempDir("first-explicit-repo");
        const secondRoot = await makeTempDir("second-explicit-repo");
        await mkdir(join(firstRoot, "src"), { recursive: true });
        await mkdir(join(secondRoot, "src"), { recursive: true });
        await writeFile(join(firstRoot, "src", "app.ts"), "export const app = 1;\n");
        await writeFile(
            join(secondRoot, "src", "app.ts"),
            "export const app = 2;\n"
        );
        const indexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore: new MemoryManifestStore(),
            store: new MemoryIndexStore(),
        });

        await indexer.indexRepository({ root: firstRoot });
        const secondIndexed = await indexer.indexRepository({ root: secondRoot });

        await expect(indexer.getIndexStatus({})).resolves.toMatchObject({
            indexes: [{ status: "ready" }, { status: "ready" }],
        });
        await expect(indexer.listRepositoryIndexes({})).resolves.toBeNull();
        await expect(
            indexer.listRepositoryIndexes({ root: secondRoot })
        ).resolves.toMatchObject({
            defaultBranch: {
                collection: secondIndexed.collection,
                status: "ready",
            },
            repoId: secondIndexed.repoId,
        });
    });

    it("returns empty status and null listing when no persisted manifest exists", async () => {
        const root = await makeTempDir("missing-manifest-repo");
        const indexer = new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore: new MemoryManifestStore(),
            store: new MemoryIndexStore(),
            workspaceRoot: root,
        });

        await expect(indexer.getIndexStatus({})).resolves.toEqual({
            indexes: [],
        });
        await expect(indexer.listRepositoryIndexes({})).resolves.toBeNull();
    });

    it("marks failed indexing attempts with the error message", async () => {
        const root = await makeTempDir("failing-repo");
        await mkdir(join(root, "src"), { recursive: true });
        await writeFile(join(root, "src", "app.ts"), "export const app = 1;\n");
        const indexer = new LocalCodeIndexer({
            embeddingProvider: failingEmbeddingProvider,
            manifestStore: new MemoryManifestStore(),
            store: new MemoryIndexStore(),
            workspaceRoot: root,
        });

        await expect(indexer.indexRepository({})).rejects.toThrow(
            /embedding failed/
        );

        await expect(indexer.getIndexStatus({})).resolves.toMatchObject({
            indexes: [
                {
                    lastError: "embedding failed",
                    status: "failed",
                },
            ],
        });
    });

    it("keeps failed in-memory status instead of replacing it with persisted fallback", async () => {
        const root = await makeTempDir("failed-over-persisted-repo");
        await mkdir(join(root, "src"), { recursive: true });
        await writeFile(join(root, "src", "app.ts"), "export const app = 1;\n");
        const manifestStore = new MemoryManifestStore();
        const store = new MemoryIndexStore();
        await new LocalCodeIndexer({
            embeddingProvider: passingEmbeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        }).indexRepository({});
        const failingIndexer = new LocalCodeIndexer({
            embeddingProvider: failingEmbeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        });

        await expect(failingIndexer.indexRepository({})).rejects.toThrow(
            /embedding failed/
        );

        await expect(failingIndexer.getIndexStatus({})).resolves.toMatchObject({
            indexes: [
                {
                    lastError: "embedding failed",
                    status: "failed",
                },
            ],
        });
    });
});

const passingEmbeddingProvider: EmbeddingProvider = {
    dimension: 64,
    embedDocuments: (texts) =>
        Promise.resolve(texts.map(() => Array.from({ length: 64 }, () => 0.1))),
    embedQuery: () => Promise.resolve(Array.from({ length: 64 }, () => 0.1)),
};

const failingEmbeddingProvider: EmbeddingProvider = {
    dimension: 64,
    embedDocuments: () => Promise.reject(new Error("embedding failed")),
    embedQuery: () => Promise.resolve(Array.from({ length: 64 }, () => 0)),
};

class MemoryManifestStore implements RepoManifestStore {
    private readonly manifests = new Map<string, RepoIndexManifest>();

    delete(params: { collection: string; userUid: string }): Promise<void> {
        this.manifests.delete(this.key(params));
        return Promise.resolve();
    }

    get(params: {
        collection: string;
        userUid: string;
    }): Promise<RepoIndexManifest | null> {
        return Promise.resolve(this.manifests.get(this.key(params)) ?? null);
    }

    listCollectionsByPrefix(): Promise<string[]> {
        return Promise.resolve([]);
    }

    save(manifest: RepoIndexManifest): Promise<void> {
        this.manifests.set(
            this.key({
                collection: manifest.collection,
                userUid: manifest.userUid,
            }),
            manifest
        );
        return Promise.resolve();
    }

    private key(params: { collection: string; userUid: string }): string {
        return `${params.userUid}/${params.collection}`;
    }
}

class MemoryIndexStore implements CodeIndexStore {
    private readonly pointCounts = new Map<string, number>();

    countCollection(params: { collection: string; userUid: string }): Promise<number> {
        return Promise.resolve(this.pointCounts.get(this.key(params)) ?? 0);
    }

    deleteCollection(params: { collection: string; userUid: string }): Promise<void> {
        this.pointCounts.delete(this.key(params));
        return Promise.resolve();
    }

    deletePath(): Promise<void> {
        return Promise.resolve();
    }

    ensureCollection(): Promise<void> {
        return Promise.resolve();
    }

    resetCollection(params: { collection: string; userUid: string }): Promise<void> {
        this.pointCounts.delete(this.key(params));
        return Promise.resolve();
    }

    search(): Promise<[]> {
        return Promise.resolve([]);
    }

    upsertChunks(params: {
        chunks: unknown[];
        collection: string;
        userUid: string;
    }): Promise<void> {
        this.pointCounts.set(this.key(params), params.chunks.length);
        return Promise.resolve();
    }

    private key(params: { collection: string; userUid: string }): string {
        return `${params.userUid}/${params.collection}`;
    }
}

class ThrowingCountIndexStore extends MemoryIndexStore {
    override countCollection(): Promise<number> {
        return Promise.reject(new Error("countCollection should not be called"));
    }
}
