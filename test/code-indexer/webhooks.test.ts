import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { CHECK_RUN_NAME } from "../../src/code-indexer/checkRuns.js";
import {
    createWebhookHandler,
    mapWebhookToJobs,
} from "../../src/code-indexer/webhooks.js";
import { createWebhookSignature } from "../../src/code-indexer/webhookSignature.js";
import type {
    DeliveryStore,
    IndexingJob,
    IndexingQueue,
} from "../../src/code-indexer/types.js";

function repositoryPayload() {
    return {
        default_branch: "main",
        id: 42,
        name: "demo",
        owner: { login: "octo" },
    };
}

function repository() {
    return {
        defaultBranch: "main",
        owner: "octo",
        repo: "demo",
        repoId: 42,
    };
}

describe("code-indexer webhook mapping", () => {
    it("maps installation repository summaries to full index jobs", () => {
        const jobs = mapWebhookToJobs({
            deliveryId: "delivery-install",
            event: "installation",
            payload: {
                action: "created",
                installation: { id: 7 },
                repositories: [
                    {
                        full_name: "octo/demo",
                        id: 42,
                        name: "demo",
                    },
                ],
            },
        });

        expect(jobs).toEqual([
            {
                deliveryId: "delivery-install",
                installationId: 7,
                kind: "full-index",
                reason: "installation",
                ref: "HEAD",
                repository: {
                    defaultBranch: "HEAD",
                    owner: "octo",
                    repo: "demo",
                    repoId: 42,
                },
            },
        ]);
    });

    it("maps installation lifecycle events for uninstall and suspension", () => {
        const deleted = mapWebhookToJobs({
            deliveryId: "delivery-install-delete",
            event: "installation",
            payload: {
                action: "deleted",
                installation: { id: 7 },
                repositories: [repositoryPayload()],
            },
        });
        const suspended = mapWebhookToJobs({
            deliveryId: "delivery-install-suspend",
            event: "installation",
            payload: {
                action: "suspend",
                installation: { id: 7 },
                repositories: [repositoryPayload()],
            },
        });
        const unsuspended = mapWebhookToJobs({
            deliveryId: "delivery-install-unsuspend",
            event: "installation",
            payload: {
                action: "unsuspend",
                installation: { id: 7 },
                repositories: [repositoryPayload()],
            },
        });

        expect(deleted).toEqual([
            {
                deliveryId: "delivery-install-delete",
                installationId: 7,
                kind: "delete-repo-index",
                reason: "installation-deleted",
                repository: repository(),
            },
        ]);
        expect(suspended).toEqual([]);
        expect(unsuspended).toEqual([
            {
                deliveryId: "delivery-install-unsuspend",
                installationId: 7,
                kind: "full-index",
                reason: "installation-unsuspended",
                ref: "main",
                repository: repository(),
            },
        ]);
    });

    it("maps default-branch push events to incremental jobs", () => {
        const jobs = mapWebhookToJobs({
            deliveryId: "delivery-1",
            event: "push",
            payload: {
                after: "b".repeat(40),
                before: "a".repeat(40),
                created: false,
                deleted: false,
                forced: false,
                installation: { id: 7 },
                ref: "refs/heads/main",
                repository: repositoryPayload(),
            },
        });

        expect(jobs).toEqual([
            {
                after: "b".repeat(40),
                before: "a".repeat(40),
                created: false,
                deleted: false,
                deliveryId: "delivery-1",
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
            },
        ]);
    });

    it("ignores non-default branch pushes", () => {
        const jobs = mapWebhookToJobs({
            deliveryId: "delivery-1",
            event: "push",
            payload: {
                after: "b".repeat(40),
                before: "a".repeat(40),
                installation: { id: 7 },
                ref: "refs/heads/feature",
                repository: repositoryPayload(),
            },
        });

        expect(jobs).toEqual([]);
    });

    it("maps pull_request lifecycle events", () => {
        const opened = mapWebhookToJobs({
            deliveryId: "delivery-opened",
            event: "pull_request",
            payload: {
                action: "opened",
                installation: { id: 7 },
                pull_request: {
                    base: { ref: "main" },
                    head: {
                        ref: "feature",
                        repo: {
                            default_branch: "main",
                            id: 99,
                            name: "fork",
                            owner: { login: "contrib" },
                        },
                        sha: "c".repeat(40),
                    },
                    number: 3,
                },
                repository: repositoryPayload(),
            },
        });
        const closed = mapWebhookToJobs({
            deliveryId: "delivery-closed",
            event: "pull_request",
            payload: {
                action: "closed",
                installation: { id: 7 },
                pull_request: {
                    base: { ref: "main" },
                    head: { ref: "feature", sha: "c".repeat(40) },
                    number: 3,
                },
                repository: repositoryPayload(),
            },
        });

        expect(opened[0]).toMatchObject({
            headRef: "feature",
            headSha: "c".repeat(40),
            kind: "pr-index",
            prNumber: 3,
            sourceRepository: {
                defaultBranch: "main",
                owner: "contrib",
                repo: "fork",
                repoId: 99,
            },
        });
        expect(closed[0]).toMatchObject({
            kind: "delete-pr-index",
            prNumber: 3,
        });
    });

    it("maps check_run rerequests for the indexer check", () => {
        const defaultBranch = mapWebhookToJobs({
            deliveryId: "delivery-check",
            event: "check_run",
            payload: {
                action: "rerequested",
                check_run: {
                    head_branch: "main",
                    head_sha: "d".repeat(40),
                    name: CHECK_RUN_NAME,
                    pull_requests: [],
                },
                installation: { id: 7 },
                repository: repositoryPayload(),
            },
        });
        const pr = mapWebhookToJobs({
            deliveryId: "delivery-pr-check",
            event: "check_run",
            payload: {
                action: "rerequested",
                check_run: {
                    head_branch: "feature",
                    head_sha: "c".repeat(40),
                    name: CHECK_RUN_NAME,
                    pull_requests: [
                        {
                            base: { ref: "main" },
                            head: {
                                ref: "feature",
                                repo: { id: 42, name: "demo" },
                                sha: "c".repeat(40),
                            },
                            number: 3,
                        },
                    ],
                },
                installation: { id: 7 },
                repository: repositoryPayload(),
            },
        });

        expect(defaultBranch).toEqual([
            {
                deliveryId: "delivery-check",
                installationId: 7,
                kind: "full-index",
                reason: "check-run-rerequested",
                ref: "main",
                repository: {
                    defaultBranch: "main",
                    owner: "octo",
                    repo: "demo",
                    repoId: 42,
                },
                sha: "d".repeat(40),
            },
        ]);
        expect(pr[0]).toMatchObject({
            baseRef: "main",
            headRef: "feature",
            headSha: "c".repeat(40),
            kind: "pr-index",
            prNumber: 3,
            sourceRepository: {
                defaultBranch: "main",
                owner: "octo",
                repo: "demo",
                repoId: 42,
            },
        });
    });

    it("ignores unsupported check_run events", () => {
        const wrongName = mapWebhookToJobs({
            deliveryId: "delivery-check",
            event: "check_run",
            payload: {
                action: "rerequested",
                check_run: {
                    head_branch: "main",
                    head_sha: "d".repeat(40),
                    name: "Other Check",
                },
                installation: { id: 7 },
                repository: repositoryPayload(),
            },
        });
        const completed = mapWebhookToJobs({
            deliveryId: "delivery-check",
            event: "check_run",
            payload: {
                action: "completed",
                check_run: {
                    head_branch: "main",
                    head_sha: "d".repeat(40),
                    name: CHECK_RUN_NAME,
                },
                installation: { id: 7 },
                repository: repositoryPayload(),
            },
        });

        expect(wrongName).toEqual([]);
        expect(completed).toEqual([]);
    });
});

describe("code-indexer webhook handler", () => {
    it("verifies signature, deduplicates delivery, and enqueues mapped jobs", async () => {
        const body = Buffer.from(
            JSON.stringify({
                after: "b".repeat(40),
                before: "a".repeat(40),
                installation: { id: 7 },
                ref: "refs/heads/main",
                repository: repositoryPayload(),
            })
        );
        const enqueued: IndexingJob[] = [];
        const queue: IndexingQueue = {
            enqueue: vi.fn((job: IndexingJob) => {
                enqueued.push(job);
                return Promise.resolve({
                    jobId: "job-1",
                    phase: "queued",
                    status: "pending",
                });
            }),
        };
        const seen = new Set<string>();
        const deliveryStore: DeliveryStore = {
            has: vi.fn((deliveryId: string) =>
                Promise.resolve(seen.has(deliveryId))
            ),
            mark: vi.fn((deliveryId: string) => {
                seen.add(deliveryId);
                return Promise.resolve();
            }),
        };
        const handler = createWebhookHandler({
            deliveryStore,
            queue,
            webhookSecret: "secret",
        });
        const req = {
            body,
            header(name: string): string | undefined {
                const headers: Record<string, string> = {
                    "X-GitHub-Delivery": "delivery-1",
                    "X-GitHub-Event": "push",
                    "X-Hub-Signature-256": createWebhookSignature(
                        "secret",
                        body
                    ),
                };
                return headers[name];
            },
        } as unknown as Request;
        const json = vi.fn();
        const res = {
            json,
            status: vi.fn(() => res),
        } as unknown as Response;

        await handler(req, res);
        await handler(req, res);

        expect(enqueued).toHaveLength(1);
        expect(json).toHaveBeenNthCalledWith(1, {
            enqueued: 1,
            status: "accepted",
        });
        expect(json).toHaveBeenNthCalledWith(2, {
            enqueued: 0,
            status: "duplicate",
        });
    });

    it("records lifecycle status before enqueueing uninstall jobs", async () => {
        const body = Buffer.from(
            JSON.stringify({
                action: "deleted",
                installation: {
                    account: { login: "octo", type: "User" },
                    id: 7,
                },
                repositories: [repositoryPayload()],
            })
        );
        const enqueue = vi.fn(() =>
            Promise.resolve({
                jobId: "job-1",
                phase: "queued",
                status: "pending",
            })
        );
        const lifecycleStore = {
            markRepositoryStatus: vi.fn(() => Promise.resolve()),
            upsertInstallation: vi.fn(() => Promise.resolve()),
            upsertRepository: vi.fn(() => Promise.resolve()),
        };
        const handler = createWebhookHandler({
            deliveryStore: {
                has: vi.fn(() => Promise.resolve(false)),
                mark: vi.fn(() => Promise.resolve()),
            },
            lifecycleStore,
            queue: { enqueue },
            webhookSecret: "secret",
        });
        const req = {
            body,
            header(name: string): string | undefined {
                const headers: Record<string, string> = {
                    "X-GitHub-Delivery": "delivery-delete",
                    "X-GitHub-Event": "installation",
                    "X-Hub-Signature-256": createWebhookSignature(
                        "secret",
                        body
                    ),
                };
                return headers[name];
            },
        } as unknown as Request;
        const res = {
            json: vi.fn(),
            status: vi.fn(() => res),
        } as unknown as Response;

        await handler(req, res);

        expect(lifecycleStore.upsertInstallation).toHaveBeenCalledWith({
            accountLogin: "octo",
            accountType: "User",
            installationId: 7,
            status: "deleted",
        });
        expect(lifecycleStore.upsertRepository).toHaveBeenCalledWith({
            defaultBranch: "main",
            installationId: 7,
            owner: "octo",
            repo: "demo",
            repoId: 42,
            status: "deleted",
        });
        expect(enqueue).toHaveBeenCalledWith({
            deliveryId: "delivery-delete",
            installationId: 7,
            kind: "delete-repo-index",
            reason: "installation-deleted",
            repository: repository(),
        });
    });

    it("rejects invalid signatures before enqueueing", async () => {
        const enqueue = vi.fn(() =>
            Promise.resolve({
                jobId: "job-1",
                phase: "queued",
                status: "pending",
            })
        );
        const queue: IndexingQueue = {
            enqueue,
        };
        const deliveryStore: DeliveryStore = {
            has: vi.fn(() => Promise.resolve(false)),
            mark: vi.fn(() => Promise.resolve()),
        };
        const handler = createWebhookHandler({
            deliveryStore,
            queue,
            webhookSecret: "secret",
        });
        const req = {
            body: Buffer.from("{}"),
            header(name: string): string | undefined {
                const headers: Record<string, string> = {
                    "X-GitHub-Delivery": "delivery-1",
                    "X-GitHub-Event": "push",
                    "X-Hub-Signature-256": "sha256=bad",
                };
                return headers[name];
            },
        } as unknown as Request;
        const status = vi.fn(() => res);
        const res = {
            json: vi.fn(),
            status,
        } as unknown as Response;

        await handler(req, res);

        expect(status).toHaveBeenCalledWith(401);
        expect(enqueue).not.toHaveBeenCalled();
    });
});
