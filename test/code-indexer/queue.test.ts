import { describe, expect, it, vi } from "vitest";

import { InMemoryIndexingQueue } from "../../src/code-indexer/queue.js";
import type {
    IndexingJob,
    IndexingProgressStore,
    IndexingJobProgressUpdate,
} from "../../src/code-indexer/types.js";

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

function makeJob(repoId: number, deliveryId: string) {
    return {
        after: "b".repeat(40),
        before: "a".repeat(40),
        created: false,
        deleted: false,
        deliveryId,
        forced: false,
        installationId: 7,
        kind: "incremental-push" as const,
        ref: "refs/heads/main",
        repository: {
            defaultBranch: "main",
            owner: "octo",
            repo: `demo-${repoId}`,
            repoId,
        },
    };
}

function createDeferred(): {
    promise: Promise<void>;
    resolve: () => void;
} {
    let resolve!: () => void;
    const promise = new Promise<void>((resolvePromise) => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
}

async function flushAsync(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
}

function hasProgressUpdate(
    updates: Array<{ jobId: string; update: IndexingJobProgressUpdate }>,
    jobId: string,
    phase: IndexingJobProgressUpdate["phase"],
    status: IndexingJobProgressUpdate["status"]
): boolean {
    return updates.some(
        (entry) =>
            entry.jobId === jobId &&
            entry.update.phase === phase &&
            entry.update.status === status
    );
}

describe("InMemoryIndexingQueue", () => {
    it("persists progress for queued, running, and completed memory jobs", async () => {
        const createdJobs: Array<{ job: IndexingJob; jobId: string }> = [];
        const progressUpdates: Array<{
            jobId: string;
            update: IndexingJobProgressUpdate;
        }> = [];
        const progressStore: IndexingProgressStore = {
            createJobProgress(params) {
                createdJobs.push(params);
                return Promise.resolve({
                    createdAt: new Date(),
                    installationId: "7",
                    jobId: params.jobId,
                    jobKind: "incremental-push",
                    owner: "octo",
                    phase: "queued",
                    processedChunks: 0,
                    processedFiles: 0,
                    repo: "demo-42",
                    repoId: "42",
                    status: "pending",
                    updatedAt: new Date(),
                });
            },
            getJobProgress: vi.fn(() => Promise.resolve(null)),
            listActiveJobsForInstallation: vi.fn(() => Promise.resolve([])),
            listJobsForRepository: vi.fn(() => Promise.resolve([])),
            updateJobProgress(params) {
                progressUpdates.push(params);
                return Promise.resolve();
            },
        };
        const processJob = vi.fn(() => Promise.resolve());
        const queue = new InMemoryIndexingQueue(processJob, {
            progressStore,
        });

        const enqueued = await queue.enqueue(makeJob(42, "delivery-a"));

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(1);
        });
        await vi.waitFor(() => {
            expect(
                hasProgressUpdate(
                    progressUpdates,
                    enqueued.jobId,
                    "completed",
                    "completed"
                )
            ).toBe(true);
        });
        expect(createdJobs).toContainEqual({
            job: makeJob(42, "delivery-a"),
            jobId: enqueued.jobId,
        });
        expect(
            hasProgressUpdate(progressUpdates, enqueued.jobId, "claiming", "running")
        ).toBe(true);
    });

    it("generates distinct job ids for multiple memory jobs from one delivery", async () => {
        const processJob = vi.fn(() => Promise.resolve());
        const queue = new InMemoryIndexingQueue(processJob, {
            concurrency: 2,
        });

        const first = await queue.enqueue(makeJob(42, "delivery-a"));
        const second = await queue.enqueue(makeJob(43, "delivery-a"));

        expect(first.jobId).not.toBe(second.jobId);
        expect(first.jobId).toMatch(/^delivery-a:memory:/);
        expect(second.jobId).toMatch(/^delivery-a:memory:/);
    });

    it("processes jobs for different repositories concurrently", async () => {
        const first = createDeferred();
        const second = createDeferred();
        const blockers = new Map([
            [42, first],
            [43, second],
        ]);
        const processJob = vi.fn((job: IndexingJob) => {
            return blockers.get(Number(job.repository.repoId))?.promise ?? Promise.resolve();
        });
        const queue = new InMemoryIndexingQueue(processJob, {
            concurrency: 2,
        });

        await queue.enqueue(makeJob(42, "delivery-a"));
        await queue.enqueue(makeJob(43, "delivery-b"));

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(2);
        });
        first.resolve();
        second.resolve();
    });

    it("serializes jobs for the same repository", async () => {
        const first = createDeferred();
        let callCount = 0;
        const processJob = vi.fn(() => {
            callCount += 1;
            return callCount === 1 ? first.promise : Promise.resolve();
        });
        const queue = new InMemoryIndexingQueue(processJob, {
            concurrency: 2,
        });

        await queue.enqueue(makeJob(42, "delivery-a"));
        await queue.enqueue(makeJob(42, "delivery-b"));

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(1);
        });
        await flushAsync();
        await flushAsync();
        expect(processJob).toHaveBeenCalledTimes(1);

        first.resolve();

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(2);
        });
    });

    it("waits for a running repository job before delete returns", async () => {
        const blocker = createDeferred();
        const processJob = vi.fn(() => blocker.promise);
        const queue = new InMemoryIndexingQueue(processJob);

        await queue.enqueue(makeJob(42, "delivery-a"));

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(1);
        });

        let settled = false;
        const deleted = queue
            .deleteRepositoryJobs({ installationId: 7, repoId: 42 })
            .then((count) => {
                settled = true;
                return count;
            });

        await flushAsync();
        expect(settled).toBe(false);

        blocker.resolve();

        await expect(deleted).resolves.toBe(0);
        expect(settled).toBe(true);
    });
});
