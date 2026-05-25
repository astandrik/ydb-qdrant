import { logger } from "../logging/logger.js";
import type {
    DeliveryStore,
    IndexingJob,
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
    private readonly jobs: IndexingJob[] = [];
    private readonly processJob: (job: IndexingJob) => Promise<void>;

    constructor(processJob: (job: IndexingJob) => Promise<void>) {
        this.processJob = processJob;
    }

    enqueue(job: IndexingJob): Promise<void> {
        this.jobs.push(job);
        this.drain();
        return Promise.resolve();
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
                const job = this.jobs.shift();
                if (!job) {
                    continue;
                }
                try {
                    logger.info(
                        {
                            deliveryId: job.deliveryId,
                            installationId: job.installationId,
                            jobKind: job.kind,
                            repoId: job.repository.repoId,
                        },
                        "code-indexer: processing job"
                    );
                    await this.processJob(job);
                    logger.info(
                        {
                            deliveryId: job.deliveryId,
                            installationId: job.installationId,
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
