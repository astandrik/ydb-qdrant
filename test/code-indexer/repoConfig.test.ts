import { describe, expect, it } from "vitest";

import {
    parseRepoIndexingConfig,
    REPO_CONFIG_PATH,
} from "../../src/code-indexer/repoConfig.js";

describe("code-indexer repo config", () => {
    it("parses repository-level indexing config", () => {
        expect(
            parseRepoIndexingConfig(
                JSON.stringify({
                    chunkLines: 40,
                    exclude: ["dist/**", "  "],
                    include: ["src/**", "*.md"],
                    maxChunkChars: 4000,
                    maxFileBytes: 1000,
                    overlapLines: 5,
                })
            )
        ).toEqual({
            chunkLines: 40,
            excludePatterns: ["dist/**"],
            includePatterns: ["src/**", "*.md"],
            maxChunkChars: 4000,
            maxFileBytes: 1000,
            overlapLines: 5,
        });
    });

    it("returns empty config for missing content and rejects invalid config", () => {
        expect(parseRepoIndexingConfig(null)).toEqual({});
        expect(() => parseRepoIndexingConfig("{")).toThrow(
            `${REPO_CONFIG_PATH}: invalid JSON`
        );
        expect(() =>
            parseRepoIndexingConfig(JSON.stringify({ include: ["src/**", 1] }))
        ).toThrow(`${REPO_CONFIG_PATH}: include must be an array of strings`);
        expect(() =>
            parseRepoIndexingConfig(JSON.stringify({ chunkLines: 0 }))
        ).toThrow(`${REPO_CONFIG_PATH}: chunkLines must be a positive integer`);
        expect(() =>
            parseRepoIndexingConfig(JSON.stringify({ maxChunkChars: 0 }))
        ).toThrow(`${REPO_CONFIG_PATH}: maxChunkChars must be a positive integer`);
    });
});
