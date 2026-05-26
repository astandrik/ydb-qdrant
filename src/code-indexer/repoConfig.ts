import type { ChunkingOptions } from "./chunker.js";
import type { GitHubContentClient, GitHubRepositoryRef } from "./types.js";

export const REPO_CONFIG_PATH = ".ydb-qdrant-code-indexer.json";

export type RepoIndexingConfig = ChunkingOptions;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringArray(value: unknown, key: string): string[] | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error(`${REPO_CONFIG_PATH}: ${key} must be an array of strings`);
    }
    return value.map((item) => item.trim()).filter((item) => item.length > 0);
}

function readPositiveInteger(value: unknown, key: string): number | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        throw new Error(`${REPO_CONFIG_PATH}: ${key} must be a positive integer`);
    }
    return value;
}

function readNonNegativeInteger(value: unknown, key: string): number | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Error(`${REPO_CONFIG_PATH}: ${key} must be a non-negative integer`);
    }
    return value;
}

export function parseRepoIndexingConfig(content: string | null): RepoIndexingConfig {
    if (content === null || content.trim().length === 0) {
        return {};
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(content) as unknown;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`${REPO_CONFIG_PATH}: invalid JSON: ${message}`);
    }
    if (!isRecord(parsed)) {
        throw new Error(`${REPO_CONFIG_PATH}: root value must be an object`);
    }

    return {
        chunkLines: readPositiveInteger(parsed.chunkLines, "chunkLines"),
        excludePatterns: readStringArray(parsed.exclude, "exclude"),
        includePatterns: readStringArray(parsed.include, "include"),
        maxChunkChars: readPositiveInteger(parsed.maxChunkChars, "maxChunkChars"),
        maxFileBytes: readPositiveInteger(parsed.maxFileBytes, "maxFileBytes"),
        overlapLines: readNonNegativeInteger(parsed.overlapLines, "overlapLines"),
    };
}

export async function loadRepoIndexingConfig(params: {
    client: GitHubContentClient;
    ref: string;
    repository: GitHubRepositoryRef;
}): Promise<RepoIndexingConfig> {
    const content = await params.client.getFileContent({
        owner: params.repository.owner,
        path: REPO_CONFIG_PATH,
        ref: params.ref,
        repo: params.repository.repo,
    });
    return parseRepoIndexingConfig(content);
}
