import { describe, expect, it, vi } from "vitest";

import { InMemoryIndexingQueue } from "../../src/code-indexer/queue.js";

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

describe("InMemoryIndexingQueue", () => {
    it("processes jobs for different repositories concurrently", async () => {
        const first = createDeferred();
        const second = createDeferred();
        const blockers = new Map([
            ["delivery-a:memory", first],
            ["delivery-b:memory", second],
        ]);
        const processJob = vi.fn((_job, context: { jobId: string }) => {
            return blockers.get(context.jobId)?.promise ?? Promise.resolve();
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
        const processJob = vi.fn((_job, context: { jobId: string }) =>
            context.jobId === "delivery-a:memory"
                ? first.promise
                : Promise.resolve()
        );
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
