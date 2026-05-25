import { describe, expect, it, vi } from "vitest";

import {
    CodeIndexerQuotaError,
    createCodeIndexerQuota,
    type CodeIndexerQuotaLimits,
} from "../../src/code-indexer/quota.js";

const limits: CodeIndexerQuotaLimits = {
    chunksPerRepo: 50,
    filesPerRepo: 10,
    reposPerInstallation: 3,
    searchesPerUserPerDay: 5,
};

function quotaLogger() {
    return {
        warn: vi.fn(),
    };
}

function expectQuotaError(
    callback: () => void,
    expected: Record<string, unknown>
): void {
    try {
        callback();
    } catch (err: unknown) {
        expect(err).toMatchObject(expected);
        return;
    }
    throw new Error("expected quota error");
}

describe("code-indexer quota enforcement", () => {
    it("allows repository counts at limit - 1 and limit, then rejects limit + 1 with 422", () => {
        const logger = quotaLogger();
        const quota = createCodeIndexerQuota({ limits, logger });

        expect(() =>
            quota.assertRepositoriesPerInstallation({
                githubUserId: 123,
                installationId: 777,
                repoCount: limits.reposPerInstallation - 1,
            })
        ).not.toThrow();
        expect(() =>
            quota.assertRepositoriesPerInstallation({
                githubUserId: 123,
                installationId: 777,
                repoCount: limits.reposPerInstallation,
            })
        ).not.toThrow();
        expectQuotaError(
            () =>
                quota.assertRepositoriesPerInstallation({
                    githubUserId: 123,
                    installationId: 777,
                    repoCount: limits.reposPerInstallation + 1,
                }),
            {
                code: "quota_repos_per_installation_exceeded",
                limit: limits.reposPerInstallation,
                metric: "repos_per_installation",
                statusCode: 422,
            }
        );
        expect(logger.warn).toHaveBeenCalledWith(
            {
                count: limits.reposPerInstallation + 1,
                githubUserId: 123,
                installationId: 777,
                limit: limits.reposPerInstallation,
                metric: "repos_per_installation",
            },
            "code-indexer quota denied"
        );
    });

    it("allows file counts at limit - 1 and limit, then rejects limit + 1 with 422", () => {
        const quota = createCodeIndexerQuota({
            limits,
            logger: quotaLogger(),
        });

        expect(() =>
            quota.assertFilesPerRepo({
                fileCount: limits.filesPerRepo - 1,
                installationId: 777,
                repoId: 456,
            })
        ).not.toThrow();
        expect(() =>
            quota.assertFilesPerRepo({
                fileCount: limits.filesPerRepo,
                installationId: 777,
                repoId: 456,
            })
        ).not.toThrow();
        expectQuotaError(
            () =>
                quota.assertFilesPerRepo({
                    fileCount: limits.filesPerRepo + 1,
                    installationId: 777,
                    repoId: 456,
                }),
            {
                code: "quota_files_per_repo_exceeded",
                limit: limits.filesPerRepo,
                metric: "files_per_repo",
                statusCode: 422,
            }
        );
    });

    it("allows chunk counts at limit - 1 and limit, then rejects limit + 1 with 422", () => {
        const quota = createCodeIndexerQuota({
            limits,
            logger: quotaLogger(),
        });

        expect(() =>
            quota.assertChunksPerRepo({
                chunkCount: limits.chunksPerRepo - 1,
                installationId: 777,
                repoId: 456,
            })
        ).not.toThrow();
        expect(() =>
            quota.assertChunksPerRepo({
                chunkCount: limits.chunksPerRepo,
                installationId: 777,
                repoId: 456,
            })
        ).not.toThrow();
        expectQuotaError(
            () =>
                quota.assertChunksPerRepo({
                    chunkCount: limits.chunksPerRepo + 1,
                    installationId: 777,
                    repoId: 456,
                }),
            {
                code: "quota_chunks_per_repo_exceeded",
                limit: limits.chunksPerRepo,
                metric: "chunks_per_repo",
                statusCode: 422,
            }
        );
    });

    it("counts searches before search work and rejects limit + 1 with 429", async () => {
        const incrementDailyUsage = vi
            .fn()
            .mockResolvedValueOnce(limits.searchesPerUserPerDay - 1)
            .mockResolvedValueOnce(limits.searchesPerUserPerDay)
            .mockResolvedValueOnce(limits.searchesPerUserPerDay + 1);
        const quota = createCodeIndexerQuota({
            limits,
            logger: quotaLogger(),
            store: { incrementDailyUsage },
        });

        await expect(
            quota.recordSearch({
                githubUserId: 123,
                installationId: 777,
                repoId: 456,
            })
        ).resolves.toBeUndefined();
        await expect(
            quota.recordSearch({
                githubUserId: 123,
                installationId: 777,
                repoId: 456,
            })
        ).resolves.toBeUndefined();
        await expect(
            quota.recordSearch({
                githubUserId: 123,
                installationId: 777,
                repoId: 456,
            })
        ).rejects.toMatchObject({
            code: "quota_searches_per_user_per_day_exceeded",
            limit: limits.searchesPerUserPerDay,
            metric: "searches_per_user_per_day",
            statusCode: 429,
        });
        expect(incrementDailyUsage).toHaveBeenCalledTimes(3);
        expect(incrementDailyUsage).toHaveBeenCalledWith({
            githubUserId: 123,
            metric: "search",
        });
    });

    it("keeps quota errors deterministic and bounded", () => {
        const err = new CodeIndexerQuotaError({
            count: 51,
            limit: 50,
            metric: "chunks_per_repo",
            statusCode: 422,
        });

        expect(err).toMatchObject({
            code: "quota_chunks_per_repo_exceeded",
            limit: 50,
            metric: "chunks_per_repo",
            name: "CodeIndexerQuotaError",
            statusCode: 422,
        });
        expect(err.message).toBe(
            "quota chunks_per_repo exceeded: 51 exceeds limit 50"
        );
    });
});
