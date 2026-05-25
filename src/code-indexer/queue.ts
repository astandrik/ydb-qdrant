import { randomUUID } from "node:crypto";

import { logger } from "../logging/logger.js";
import type {
    DeliveryStore,
    IndexingJob,
    IndexingJobExecutionContext,
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

    save(manifest: RepoIndexManifest): Promise<void> {
        this.manifests.set(this.keyFor(manifest), manifest);
        return Promise.resolve();
    }

    private keyFor(params: { collection: string; userUid: string }): string {
        return `${params.userUid}/${params.collection}`;
    }
}

export class InMemoryIndexingQueue implements IndexingQueue {
    private active = false;
    private readonly jobs: QueuedMemoryJob[] = [];
    private readonly processJob: (
        job: IndexingJob,
        context: IndexingJobExecutionContext
    ) => Promise<void>;

    constructor(
        processJob: (
            job: IndexingJob,
            context: IndexingJobExecutionContext
        ) => Promise<void>
    ) {
        this.processJob = processJob;
    }

    enqueue(job: IndexingJob): Promise<{
        jobId: string;
        phase: "queued";
        status: "pending";
    }> {
        const jobId = job.deliveryId
            ? `${job.deliveryId}:memory`
            : `memory:${randomUUID()}`;
        this.jobs.push({ context: { jobId }, job });
        this.drain();
        return Promise.resolve({ jobId, phase: "queued", status: "pending" });
    }

    private drain(): void {
        if (this.active) {
            return;
        }
        this.active = true;
        void this.drainLoop();
    }

    private async drainLoop(): Promise<void> {
        try {
            while (this.jobs.length > 0) {
                const item = this.jobs.shift();
                if (!item) {
                    continue;
                }
                const { context, job } = item;
                try {
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
            }
        } finally {
            this.active = false;
            if (this.jobs.length > 0) {
                this.drain();
            }
        }
    }
}

type QueuedMemoryJob = {
    context: IndexingJobExecutionContext;
    job: IndexingJob;
};
