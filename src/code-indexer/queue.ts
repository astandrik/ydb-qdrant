import { randomUUID } from "node:crypto";

import { logger } from "../logging/logger.js";
import type {
    DeliveryStore,
    IndexingProgressStore,
    IndexingJob,
    IndexingJobExecutionContext,
    IndexingJobProgressUpdate,
    IndexingQueue,
    RepoIndexManifest,
    RepoManifestStore,
} from "./types.js";

export class InMemoryDeliveryStore implements DeliveryStore {
    private readonly deliveryIds = new Set<string>();

    has(deliveryId: string): Promise<boolean> {
        return Promise.resolve(this.deliveryIds.has(deliveryId));
    }

    mark(deliveryId: string): Promise<void> {
        this.deliveryIds.add(deliveryId);
        return Promise.resolve();
    }

    release(deliveryId: string): Promise<void> {
        this.deliveryIds.delete(deliveryId);
        return Promise.resolve();
    }

    reserve(deliveryId: string): Promise<boolean> {
        if (this.deliveryIds.has(deliveryId)) {
            return Promise.resolve(false);
        }
        this.deliveryIds.add(deliveryId);
        return Promise.resolve(true);
    }
}

export class InMemoryRepoManifestStore implements RepoManifestStore {
    private readonly manifests = new Map<string, RepoIndexManifest>();

    delete(params: { collection: string; userUid: string }): Promise<void> {
        this.manifests.delete(this.keyFor(params));
        return Promise.resolve();
    }

    get(params: {
        collection: string;
        userUid: string;
    }): Promise<RepoIndexManifest | null> {
        return Promise.resolve(this.manifests.get(this.keyFor(params)) ?? null);
    }

    listCollectionsByPrefix(params: {
        collectionPrefix: string;
        userUid: string;
    }): Promise<string[]> {
        const keyPrefix = `${params.userUid}/${params.collectionPrefix}`;
        return Promise.resolve(
            [...this.manifests.keys()]
                .filter((key) => key.startsWith(keyPrefix))
                .map((key) => key.slice(`${params.userUid}/`.length))
                .sort()
        );
    }

    save(manifest: RepoIndexManifest): Promise<void> {
        this.manifests.set(this.keyFor(manifest), manifest);
        return Promise.resolve();
    }

    private keyFor(params: { collection: string; userUid: string }): string {
        return `${params.userUid}/${params.collection}`;
    }
}

export class InMemoryIndexingQueue implements IndexingQueue {
    private activeCount = 0;
    private readonly concurrency: number;
    private readonly jobs: QueuedMemoryJob[] = [];
    private readonly processJob: (
        job: IndexingJob,
        context: IndexingJobExecutionContext
    ) => Promise<void>;
    private readonly progressStore?: IndexingProgressStore;
    private nextJobSequence = 0;
    private readonly repoIdleWaiters = new Map<string, Array<() => void>>();
    private readonly runningRepoKeys = new Set<string>();

    constructor(
        processJob: (
            job: IndexingJob,
            context: IndexingJobExecutionContext
        ) => Promise<void>,
        options: InMemoryIndexingQueueOptions = {}
    ) {
        this.processJob = processJob;
        this.concurrency = Math.max(1, Math.floor(options.concurrency ?? 1));
        this.progressStore = options.progressStore;
    }

    async enqueue(job: IndexingJob): Promise<{
        jobId: string;
        phase: "queued";
        status: "pending";
    }> {
        const jobId = job.deliveryId
            ? `${job.deliveryId}:memory:${this.nextJobSequence++}`
            : `memory:${randomUUID()}`;
        await this.progressStore?.createJobProgress({ job, jobId });
        this.jobs.push({ context: { jobId }, job });
        this.drain();
        return { jobId, phase: "queued", status: "pending" };
    }

    async deleteRepositoryJobs(params: {
        installationId: number | string;
        repoId: number | string;
    }): Promise<number> {
        const repoKey = `${params.installationId}/${params.repoId}`;
        let deleted = 0;
        while (true) {
            deleted += this.deleteQueuedRepositoryJobs(repoKey);
            await this.waitForRepoIdle(repoKey);
            deleted += this.deleteQueuedRepositoryJobs(repoKey);
            if (!this.runningRepoKeys.has(repoKey)) {
                return deleted;
            }
        }
    }

    private deleteQueuedRepositoryJobs(repoKey: string): number {
        let deleted = 0;
        for (let index = this.jobs.length - 1; index >= 0; index -= 1) {
            const item = this.jobs[index];
            if (item && repoKeyForJob(item.job) === repoKey) {
                this.jobs.splice(index, 1);
                deleted += 1;
            }
        }
        return deleted;
    }

    private waitForRepoIdle(repoKey: string): Promise<void> {
        if (!this.runningRepoKeys.has(repoKey)) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            const waiters = this.repoIdleWaiters.get(repoKey) ?? [];
            waiters.push(resolve);
            this.repoIdleWaiters.set(repoKey, waiters);
        });
    }

    private notifyRepoIdle(repoKey: string): void {
        if (this.runningRepoKeys.has(repoKey)) {
            return;
        }
        const waiters = this.repoIdleWaiters.get(repoKey);
        if (!waiters) {
            return;
        }
        this.repoIdleWaiters.delete(repoKey);
        for (const resolve of waiters) {
            resolve();
        }
    }

    private drain(): void {
        while (this.activeCount < this.concurrency) {
            const nextIndex = this.jobs.findIndex(
                (item) => !this.runningRepoKeys.has(repoKeyForJob(item.job))
            );
            if (nextIndex < 0) {
                return;
            }
            const [item] = this.jobs.splice(nextIndex, 1);
            if (!item) {
                return;
            }
            this.activeCount += 1;
            this.runningRepoKeys.add(repoKeyForJob(item.job));
            void this.processQueuedJob(item);
        }
    }

    private async processQueuedJob(item: QueuedMemoryJob): Promise<void> {
        const { context, job } = item;
        try {
            try {
                await this.updateProgress(context.jobId, {
                    phase: "claiming",
                    startedAt: new Date(),
                    status: "running",
                });
                logger.info(
                    {
                        deliveryId: job.deliveryId,
                        installationId: job.installationId,
                        jobId: context.jobId,
                        jobKind: job.kind,
                        repoId: job.repository.repoId,
                    },
                    "code-indexer: processing job"
                );
                await this.processJob(job, context);
                await this.updateProgress(context.jobId, {
                    finishedAt: new Date(),
                    lastError: null,
                    message: null,
                    phase: "completed",
                    status: "completed",
                });
                logger.info(
                    {
                        deliveryId: job.deliveryId,
                        installationId: job.installationId,
                        jobId: context.jobId,
                        jobKind: job.kind,
                        repoId: job.repository.repoId,
                    },
                    "code-indexer: job completed"
                );
            } catch (err: unknown) {
                await this.updateProgress(context.jobId, {
                    finishedAt: new Date(),
                    lastError: sanitizeError(err),
                    message: "Indexing failed.",
                    phase: "failed",
                    status: "failed",
                });
                logger.error(
                    {
                        deliveryId: job.deliveryId,
                        err,
                        installationId: job.installationId,
                        jobId: context.jobId,
                        jobKind: job.kind,
                        repoId: job.repository.repoId,
                    },
                    "code-indexer: job failed"
                );
            }
        } finally {
            const repoKey = repoKeyForJob(job);
            this.runningRepoKeys.delete(repoKey);
            this.notifyRepoIdle(repoKey);
            this.activeCount -= 1;
            this.drain();
        }
    }

    private async updateProgress(
        jobId: string,
        update: IndexingJobProgressUpdate
    ): Promise<void> {
        await this.progressStore?.updateJobProgress({ jobId, update });
    }
}

type InMemoryIndexingQueueOptions = {
    concurrency?: number;
    progressStore?: IndexingProgressStore;
};

type QueuedMemoryJob = {
    context: IndexingJobExecutionContext;
    job: IndexingJob;
};

function repoKeyForJob(job: IndexingJob): string {
    return `${job.installationId}/${job.repository.repoId}`;
}

function sanitizeError(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
}
