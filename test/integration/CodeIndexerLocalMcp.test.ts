import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { HashEmbeddingProvider } from "../../src/code-indexer/embeddings.js";
import { YdbQdrantIndexStore } from "../../src/code-indexer/indexStore.js";
import { LocalCodeIndexer } from "../../src/code-indexer/localIndexer.js";
import { CodeIndexerMcpServer } from "../../src/code-indexer/mcp.js";
import { userUidForInstallation } from "../../src/code-indexer/naming.js";
import { YdbRepoManifestStore } from "../../src/code-indexer/stateStore.js";
import { createMetaTableIfMissing } from "./helpers/bootstrap-meta-table.js";
import { forceLocalYdbEndpointForSdkDiscovery } from "./helpers/local-ydb-discovery.js";

const hasSdkCredentials = [
    "YDB_ACCESS_TOKEN_CREDENTIALS",
    "YDB_ANONYMOUS_CREDENTIALS",
    "YDB_METADATA_CREDENTIALS",
    "YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS",
].some((name) => process.env[name]);
if (!hasSdkCredentials && !process.env.YDB_STATIC_CREDENTIALS_USER) {
    process.env.YDB_ANONYMOUS_CREDENTIALS = "1";
}

type JsonRpcResponse = {
    error?: unknown;
    result?: {
        structuredContent?: Record<string, unknown>;
    };
};

type LocalIndexSummary = {
    chunkCount?: number;
    collection: string;
    installationId: number;
    lastIndexedSha?: string;
    repoId: number;
    root: string;
    status: string;
};

describe("local code-indexer MCP real-YDB smoke", () => {
    const embeddingProvider = new HashEmbeddingProvider(64);
    const manifestStore = new YdbRepoManifestStore();
    const store = new YdbQdrantIndexStore({ includeTextInPayload: true });
    let root = "";
    let indexed: LocalIndexSummary | null = null;

    beforeAll(async () => {
        forceLocalYdbEndpointForSdkDiscovery();
        await createMetaTableIfMissing();
        root = await realpath(
            await mkdtemp(join(tmpdir(), "ydb-qdrant-local-mcp-"))
        );
        await mkdir(join(root, "src"), { recursive: true });
        await writeFile(
            join(root, "src", "identity.ts"),
            [
                "export function resolveTenantScopedIdentity() {",
                '    return "tenant scoped local mcp identity resolver";',
                "}",
            ].join("\n")
        );
    }, 60_000);

    afterAll(async () => {
        if (indexed) {
            const userUid = userUidForInstallation(indexed.installationId);
            await Promise.allSettled([
                store.deleteCollection({
                    collection: indexed.collection,
                    userUid,
                }),
                manifestStore.delete({
                    collection: indexed.collection,
                    userUid,
                }),
            ]);
        }
        if (root) {
            await rm(root, { force: true, recursive: true });
        }
    }, 60_000);

    it("indexes a temp repository through MCP and searches indexed code", async () => {
        const localIndexer = new LocalCodeIndexer({
            allowedRoots: [root],
            embeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        });
        const server = new CodeIndexerMcpServer({
            embeddingProvider,
            localIndexer,
            store,
        });

        const indexResponse = await callTool(server, 1, "index_repository", {});
        indexed = readIndex(indexResponse, "index");
        expect(indexed).toMatchObject({
            root,
            status: "ready",
        });

        const statusResponse = await callTool(server, 2, "get_index_status", {});
        const indexes = statusResponse.result?.structuredContent?.indexes;
        expect(indexes).toEqual([
            expect.objectContaining({
                repoId: indexed.repoId,
                root,
                status: "ready",
            }),
        ]);

        const searchResponse = await callTool(server, 3, "search_code", {
            installationId: indexed.installationId,
            query: "tenant scoped local mcp identity resolver",
            repoId: indexed.repoId,
            top: 3,
        });
        const points = searchResponse.result?.structuredContent?.points;
        expect(hasPointPath(points, "src/identity.ts")).toBe(true);

        const restartedIndexer = new LocalCodeIndexer({
            allowedRoots: [root],
            embeddingProvider,
            manifestStore,
            store,
            workspaceRoot: root,
        });
        const restartedServer = new CodeIndexerMcpServer({
            embeddingProvider,
            localIndexer: restartedIndexer,
            store,
        });
        const restartedStatus = await callTool(
            restartedServer,
            4,
            "get_index_status",
            {}
        );
        expect(restartedStatus.result?.structuredContent?.indexes).toEqual([
            expect.objectContaining({
                chunkCount: indexed.chunkCount,
                collection: indexed.collection,
                installationId: indexed.installationId,
                lastIndexedSha: indexed.lastIndexedSha,
                repoId: indexed.repoId,
                root,
                status: "ready",
            }),
        ]);

        const restartedListing = await callTool(
            restartedServer,
            5,
            "list_repository_indexes",
            {}
        );
        const repository =
            restartedListing.result?.structuredContent?.repository;
        if (!isRecord(repository) || !isRecord(repository.defaultBranch)) {
            throw new Error("repository listing is missing");
        }
        expect(repository.defaultBranch.branch).toBe("local");
        expect(repository.defaultBranch.chunkCount).toBe(indexed.chunkCount);
        expect(repository.defaultBranch.collection).toBe(indexed.collection);
        expect(repository.defaultBranch.lastIndexedSha).toBe(
            indexed.lastIndexedSha
        );
        expect(repository.defaultBranch.status).toBe("ready");
        expect(repository.installationId).toBe(indexed.installationId);
        expect(repository.repoId).toBe(indexed.repoId);
    }, 60_000);
});

async function callTool(
    server: CodeIndexerMcpServer,
    id: number,
    name: string,
    args: Record<string, unknown>
): Promise<JsonRpcResponse> {
    const raw = await server.handleJsonRpcMessage(
        JSON.stringify({
            id,
            jsonrpc: "2.0",
            method: "tools/call",
            params: {
                arguments: args,
                name,
            },
        })
    );
    expect(raw).not.toBeNull();
    const response = raw as JsonRpcResponse;
    expect(response.error).toBeUndefined();
    return response;
}

function readIndex(response: JsonRpcResponse, key: string): LocalIndexSummary {
    const value = response.result?.structuredContent?.[key];
    if (!isRecord(value)) {
        throw new Error(`${key} is missing`);
    }
    return {
        ...(readOptionalNumber(value.chunkCount) === undefined
            ? {}
            : { chunkCount: readOptionalNumber(value.chunkCount) }),
        collection: readRequiredString(value.collection, "collection"),
        installationId: readRequiredNumber(value.installationId, "installationId"),
        ...(readOptionalString(value.lastIndexedSha) === undefined
            ? {}
            : { lastIndexedSha: readOptionalString(value.lastIndexedSha) }),
        repoId: readRequiredNumber(value.repoId, "repoId"),
        root: readRequiredString(value.root, "root"),
        status: readRequiredString(value.status, "status"),
    };
}

function hasPointPath(value: unknown, path: string): boolean {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.some((point) => {
        if (!isRecord(point) || !isRecord(point.payload)) {
            return false;
        }
        return point.payload.path === path;
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readOptionalString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function readRequiredNumber(value: unknown, label: string): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    throw new Error(`${label} must be a number`);
}

function readRequiredString(value: unknown, label: string): string {
    if (typeof value === "string") {
        return value;
    }
    throw new Error(`${label} must be a string`);
}
