import { describe, expect, it, vi } from "vitest";

import {
    checkRunShaForJob,
    GitHubCheckRunReporter,
    withCheckRunReporting,
} from "../../src/code-indexer/checkRuns.js";
import type {
    CheckRunReporter,
    GitHubChecksClientFactory,
    IndexingJob,
} from "../../src/code-indexer/types.js";

function pushJob(): IndexingJob {
    return {
        after: "b".repeat(40),
        before: "a".repeat(40),
        created: false,
        deleted: false,
        forced: false,
        installationId: 7,
        kind: "incremental-push",
        ref: "refs/heads/main",
        repository: {
            defaultBranch: "main",
            owner: "octo",
            repo: "demo",
            repoId: 42,
        },
    };
}

describe("code-indexer check runs", () => {
    it("chooses check run SHAs only for supported jobs", () => {
        expect(checkRunShaForJob(pushJob())).toBe("b".repeat(40));
        expect(
            checkRunShaForJob({
                ...pushJob(),
                after: "not-a-sha",
            })
        ).toBeNull();
        expect(
            checkRunShaForJob({
                baseRef: "main",
                headRef: "feature",
                headSha: "c".repeat(40),
                installationId: 7,
                kind: "pr-index",
                prNumber: 1,
                repository: {
                    defaultBranch: "main",
                    owner: "octo",
                    repo: "demo",
                    repoId: 42,
                },
                sourceRepository: {
                    defaultBranch: "main",
                    owner: "contrib",
                    repo: "fork",
                    repoId: 99,
                },
            })
        ).toBeNull();
    });

    it("creates and completes GitHub check runs", async () => {
        const createCheckRun = vi.fn(() => Promise.resolve({ id: 123 }));
        const updateCheckRun = vi.fn(() => Promise.resolve());
        const factory: GitHubChecksClientFactory = {
            checksForInstallation: vi.fn(() =>
                Promise.resolve({ createCheckRun, updateCheckRun })
            ),
        };
        const reporter = new GitHubCheckRunReporter(factory);
        const job = pushJob();

        const handle = await reporter.start(job);
        await reporter.complete(handle, {
            conclusion: "success",
            summary: "done",
            title: "Indexing completed",
        });

        expect(createCheckRun).toHaveBeenCalledWith({
            headSha: "b".repeat(40),
            name: "YDB Qdrant Code Index",
            owner: "octo",
            repo: "demo",
            status: "in_progress",
        });
        expect(updateCheckRun).toHaveBeenCalledWith({
            checkRunId: 123,
            conclusion: "success",
            owner: "octo",
            repo: "demo",
            status: "completed",
            summary: "done",
            title: "Indexing completed",
        });
    });

    it("wraps job processing with fail-open check reporting", async () => {
        const complete = vi.fn(() => Promise.reject(new Error("complete failed")));
        const start = vi.fn(() => Promise.reject(new Error("start failed")));
        const reporter: CheckRunReporter = {
            complete,
            start,
        };
        const processJob = vi.fn(() => Promise.resolve());
        const wrapped = withCheckRunReporting({ processJob, reporter });
        const job = pushJob();
        const context = { jobId: "job-1" };

        await expect(wrapped(job, context)).resolves.toBeUndefined();

        expect(processJob).toHaveBeenCalledWith(job, context);
        expect(start).toHaveBeenCalledWith(job);
        expect(complete).toHaveBeenCalledWith(null, {
            conclusion: "success",
            summary: "Indexed octo/demo.",
            title: "Indexing completed",
        });
    });

    it("reports failed jobs and rethrows the processing error", async () => {
        const complete = vi.fn(() => Promise.resolve());
        const start = vi.fn(() =>
            Promise.resolve({
                checkRunId: 123,
                installationId: 7,
                owner: "octo",
                repo: "demo",
            })
        );
        const reporter: CheckRunReporter = {
            complete,
            start,
        };
        const processErr = new Error("index failed");
        const wrapped = withCheckRunReporting({
            processJob: vi.fn(() => Promise.reject(processErr)),
            reporter,
        });
        const job = pushJob();
        const context = { jobId: "job-1" };

        await expect(wrapped(job, context)).rejects.toThrow("index failed");

        expect(complete).toHaveBeenCalledWith(
            {
                checkRunId: 123,
                installationId: 7,
                owner: "octo",
                repo: "demo",
            },
            {
                conclusion: "failure",
                summary: "index failed",
                title: "Indexing failed",
            }
        );
    });
});
