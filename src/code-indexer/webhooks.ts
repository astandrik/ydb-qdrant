import type { Request, Response } from "express";

import { CHECK_RUN_NAME } from "./checkRuns.js";
import { verifyWebhookSignature } from "./webhookSignature.js";
import type {
    DeliveryStore,
    GitHubRepositoryRef,
    IndexingJob,
    IndexingQueue,
} from "./types.js";

type WebhookDependencies = {
    deliveryStore: DeliveryStore;
    lifecycleStore?: WebhookLifecycleStore;
    queue: IndexingQueue;
    webhookSecret: string;
};

export type WebhookLifecycleStore = {
    markRepositoryStatus(params: {
        defaultBranch?: string;
        installationId?: number | string;
        lastError?: string;
        owner?: string;
        repo?: string;
        repoId: number | string;
        status: "queued" | "indexing" | "ready" | "failed" | "deleted";
    }): Promise<void>;
    upsertInstallation(params: {
        accountLogin: string;
        accountType: string;
        installationId: number | string;
        status: string;
    }): Promise<void>;
    upsertRepository(params: {
        defaultBranch: string;
        installationId: number | string;
        owner: string;
        repo: string;
        repoId: number | string;
        status: "queued" | "indexing" | "ready" | "failed" | "deleted";
    }): Promise<void>;
};

type GitHubRepositoryPayload = {
    default_branch?: unknown;
    full_name?: unknown;
    id?: unknown;
    name?: unknown;
    owner?: unknown;
};

const SHA_RE = /^[a-f0-9]{40}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function readRepository(value: unknown): GitHubRepositoryRef | null {
    if (!isRecord(value)) {
        return null;
    }
    const repo = value as GitHubRepositoryPayload;
    const fullName =
        typeof repo.full_name === "string" ? repo.full_name.split("/") : [];
    const owner = isRecord(repo.owner) ? repo.owner.login : fullName[0];
    const name = typeof repo.name === "string" ? repo.name : fullName[1];
    const defaultBranch =
        typeof repo.default_branch === "string" ? repo.default_branch : "HEAD";
    if (
        typeof repo.id !== "number" ||
        typeof name !== "string" ||
        typeof owner !== "string"
    ) {
        return null;
    }
    return {
        defaultBranch,
        owner,
        repo: name,
        repoId: repo.id,
    };
}

function readInstallationId(payload: unknown): number | null {
    if (!isRecord(payload) || !isRecord(payload.installation)) {
        return null;
    }
    const id = payload.installation.id;
    return typeof id === "number" ? id : null;
}

function readRepositoryList(payload: unknown, key: string): GitHubRepositoryRef[] {
    if (!isRecord(payload) || !Array.isArray(payload[key])) {
        return [];
    }
    return payload[key]
        .map(readRepository)
        .filter((repo): repo is GitHubRepositoryRef => repo !== null);
}

function readInstallationAccount(
    payload: unknown
): { login: string; type: string } | null {
    if (!isRecord(payload) || !isRecord(payload.installation)) {
        return null;
    }
    const account = payload.installation.account;
    if (!isRecord(account)) {
        return null;
    }
    const login = account.login;
    const type = account.type;
    return typeof login === "string" && typeof type === "string"
        ? { login, type }
        : null;
}

function pushJobs(payload: unknown, deliveryId: string): IndexingJob[] {
    if (!isRecord(payload)) {
        return [];
    }
    const installationId = readInstallationId(payload);
    const repository = readRepository(payload.repository);
    if (installationId === null || repository === null) {
        return [];
    }
    const ref = typeof payload.ref === "string" ? payload.ref : "";
    const expectedRef = `refs/heads/${repository.defaultBranch}`;
    if (ref !== expectedRef) {
        return [];
    }
    const deleted = payload.deleted === true;
    if (deleted) {
        return [
            {
                deliveryId,
                installationId,
                kind: "delete-repo-index",
                reason: "default-branch-deleted",
                repository,
            },
        ];
    }
    const before = typeof payload.before === "string" ? payload.before : "";
    const after = typeof payload.after === "string" ? payload.after : "";
    if (!after) {
        return [];
    }
    return [
        {
            after,
            before,
            created: payload.created === true,
            deleted,
            deliveryId,
            forced: payload.forced === true,
            installationId,
            kind: "incremental-push",
            ref,
            repository,
        },
    ];
}

function pullRequestJobs(payload: unknown, deliveryId: string): IndexingJob[] {
    if (!isRecord(payload) || !isRecord(payload.pull_request)) {
        return [];
    }
    const installationId = readInstallationId(payload);
    const repository = readRepository(payload.repository);
    const pr = payload.pull_request;
    if (installationId === null || repository === null) {
        return [];
    }
    const action = typeof payload.action === "string" ? payload.action : "";
    const number = typeof pr.number === "number" ? pr.number : undefined;
    if (typeof number !== "number") {
        return [];
    }
    if (action === "closed") {
        return [
            {
                deliveryId,
                installationId,
                kind: "delete-pr-index",
                prNumber: number,
                reason: "pull-request-closed",
                repository,
            },
        ];
    }
    if (!["opened", "reopened", "synchronize"].includes(action)) {
        return [];
    }
    const head = isRecord(pr.head) ? pr.head : {};
    const base = isRecord(pr.base) ? pr.base : {};
    const sourceRepository = readRepository(head.repo) ?? repository;
    const headRef = typeof head.ref === "string" ? head.ref : "";
    const headSha = typeof head.sha === "string" ? head.sha : "";
    const baseRef = typeof base.ref === "string" ? base.ref : "";
    if (!headRef || !headSha) {
        return [];
    }
    return [
        {
            baseRef,
            deliveryId,
            headRef,
            headSha,
            installationId,
            kind: "pr-index",
            prNumber: number,
            repository,
            sourceRepository,
        },
    ];
}

function readStringRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {};
}

function readCheckRunPrJob(params: {
    checkRun: Record<string, unknown>;
    deliveryId: string;
    installationId: number;
    repository: GitHubRepositoryRef;
}): IndexingJob | null {
    const pullRequests = Array.isArray(params.checkRun.pull_requests)
        ? params.checkRun.pull_requests
        : [];
    const pr = pullRequests.find(isRecord);
    if (!pr) {
        return null;
    }
    const number = typeof pr.number === "number" ? pr.number : undefined;
    const head = readStringRecord(pr.head);
    const base = readStringRecord(pr.base);
    const sourceRepository = readRepository(head.repo) ?? params.repository;
    const headRef = typeof head.ref === "string" ? head.ref : "";
    const headSha =
        typeof head.sha === "string" ? head.sha : params.checkRun.head_sha;
    const baseRef = typeof base.ref === "string" ? base.ref : "";

    if (
        typeof number !== "number" ||
        !headRef ||
        !baseRef ||
        typeof headSha !== "string" ||
        !SHA_RE.test(headSha)
    ) {
        return null;
    }

    return {
        baseRef,
        deliveryId: params.deliveryId,
        headRef,
        headSha,
        installationId: params.installationId,
        kind: "pr-index",
        prNumber: number,
        repository: params.repository,
        sourceRepository,
    };
}

function checkRunJobs(payload: unknown, deliveryId: string): IndexingJob[] {
    if (!isRecord(payload) || !isRecord(payload.check_run)) {
        return [];
    }
    const action = typeof payload.action === "string" ? payload.action : "";
    if (action !== "rerequested") {
        return [];
    }
    const installationId = readInstallationId(payload);
    const repository = readRepository(payload.repository);
    const checkRun = payload.check_run;
    if (
        installationId === null ||
        repository === null ||
        checkRun.name !== CHECK_RUN_NAME
    ) {
        return [];
    }

    const prJob = readCheckRunPrJob({
        checkRun,
        deliveryId,
        installationId,
        repository,
    });
    if (prJob) {
        return [prJob];
    }

    const headSha =
        typeof checkRun.head_sha === "string" ? checkRun.head_sha : "";
    const checkSuite = readStringRecord(checkRun.check_suite);
    const headBranch =
        typeof checkRun.head_branch === "string"
            ? checkRun.head_branch
            : checkSuite.head_branch;
    if (
        typeof headBranch !== "string" ||
        headBranch !== repository.defaultBranch ||
        !SHA_RE.test(headSha)
    ) {
        return [];
    }

    return [
        {
            deliveryId,
            installationId,
            kind: "full-index",
            reason: "check-run-rerequested",
            ref: repository.defaultBranch,
            repository,
            sha: headSha,
        },
    ];
}

function installationJobs(payload: unknown, deliveryId: string): IndexingJob[] {
    const installationId = readInstallationId(payload);
    if (installationId === null) {
        return [];
    }
    const action =
        isRecord(payload) && typeof payload.action === "string"
            ? payload.action
            : "created";
    if (action === "suspend") {
        return [];
    }
    const repositories = readRepositoryList(payload, "repositories");
    if (action === "deleted") {
        return repositories.map((repository) => ({
            deliveryId,
            installationId,
            kind: "delete-repo-index" as const,
            reason: "installation-deleted",
            repository,
        }));
    }
    if (action === "unsuspend") {
        return repositories.map((repository) => ({
            deliveryId,
            installationId,
            kind: "full-index" as const,
            reason: "installation-unsuspended",
            ref: repository.defaultBranch,
            repository,
        }));
    }
    if (action !== "created") {
        return [];
    }
    return readRepositoryList(payload, "repositories").map((repository) => ({
        deliveryId,
        installationId,
        kind: "full-index" as const,
        reason: "installation",
        ref: repository.defaultBranch,
        repository,
    }));
}

function installationRepositoriesJobs(
    payload: unknown,
    deliveryId: string
): IndexingJob[] {
    const installationId = readInstallationId(payload);
    if (installationId === null) {
        return [];
    }
    const added = readRepositoryList(payload, "repositories_added").map(
        (repository) => ({
            deliveryId,
            installationId,
            kind: "full-index" as const,
            reason: "installation-repositories-added",
            ref: repository.defaultBranch,
            repository,
        })
    );
    const removed = readRepositoryList(payload, "repositories_removed").map(
        (repository) => ({
            deliveryId,
            installationId,
            kind: "delete-repo-index" as const,
            reason: "installation-repositories-removed",
            repository,
        })
    );
    return [...added, ...removed];
}

export function mapWebhookToJobs(params: {
    deliveryId: string;
    event: string;
    payload: unknown;
}): IndexingJob[] {
    switch (params.event) {
        case "installation":
            return installationJobs(params.payload, params.deliveryId);
        case "installation_repositories":
            return installationRepositoriesJobs(params.payload, params.deliveryId);
        case "push":
            return pushJobs(params.payload, params.deliveryId);
        case "pull_request":
            return pullRequestJobs(params.payload, params.deliveryId);
        case "check_run":
            return checkRunJobs(params.payload, params.deliveryId);
        default:
            return [];
    }
}

export function createWebhookHandler(deps: WebhookDependencies) {
    return async (req: Request, res: Response): Promise<void> => {
        const body = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(String(req.body ?? ""), "utf8");
        const deliveryId = req.header("X-GitHub-Delivery")?.trim();
        const event = req.header("X-GitHub-Event")?.trim();

        if (!deliveryId || !event) {
            res.status(400).json({
                error: "missing GitHub delivery or event header",
                status: "error",
            });
            return;
        }

        const verified = verifyWebhookSignature({
            body,
            secret: deps.webhookSecret,
            signatureHeader: req.header("X-Hub-Signature-256") ?? undefined,
        });
        if (!verified) {
            res.status(401).json({ error: "invalid signature", status: "error" });
            return;
        }

        let payload: unknown;
        try {
            payload = JSON.parse(body.toString("utf8")) as unknown;
        } catch {
            res.status(400).json({ error: "invalid json", status: "error" });
            return;
        }

        const usedAtomicReservation = deps.deliveryStore.reserve !== undefined;
        const reserved = usedAtomicReservation
            ? await deps.deliveryStore.reserve?.(deliveryId)
            : !(await deps.deliveryStore.has(deliveryId));
        if (!reserved) {
            res.json({ enqueued: 0, status: "duplicate" });
            return;
        }

        try {
            const jobs = mapWebhookToJobs({ deliveryId, event, payload });
            if (deps.lifecycleStore) {
                await recordWebhookLifecycle({
                    event,
                    jobs,
                    payload,
                    store: deps.lifecycleStore,
                });
            }
            for (const job of jobs) {
                await deps.queue.enqueue(job);
            }
            if (!usedAtomicReservation) {
                await deps.deliveryStore.mark(deliveryId);
            }
            res.json({ enqueued: jobs.length, status: "accepted" });
        } catch (err: unknown) {
            if (usedAtomicReservation) {
                await deps.deliveryStore.release?.(deliveryId).catch(() => undefined);
            }
            throw err;
        }
    };
}

async function recordWebhookLifecycle(params: {
    event: string;
    jobs: IndexingJob[];
    payload: unknown;
    store: WebhookLifecycleStore;
}): Promise<void> {
    await recordInstallationLifecycle(params);
    for (const job of params.jobs) {
        await recordJobQueuedOrDeleted(params.store, job);
    }
}

async function recordInstallationLifecycle(params: {
    event: string;
    jobs: IndexingJob[];
    payload: unknown;
    store: WebhookLifecycleStore;
}): Promise<void> {
    if (params.event !== "installation") {
        return;
    }
    const installationId = readInstallationId(params.payload);
    const account = readInstallationAccount(params.payload);
    const action =
        isRecord(params.payload) && typeof params.payload.action === "string"
            ? params.payload.action
            : "";
    if (installationId === null || !account) {
        return;
    }
    const statusByAction: Record<string, string> = {
        created: "active",
        deleted: "deleted",
        suspend: "suspended",
        unsuspend: "active",
    };
    const status = statusByAction[action];
    if (!status) {
        return;
    }
    await params.store.upsertInstallation({
        accountLogin: account.login,
        accountType: account.type,
        installationId,
        status,
    });
}

async function recordJobQueuedOrDeleted(
    store: WebhookLifecycleStore,
    job: IndexingJob
): Promise<void> {
    if (job.kind === "delete-repo-index") {
        await store.upsertRepository({
            defaultBranch: job.repository.defaultBranch,
            installationId: job.installationId,
            owner: job.repository.owner,
            repo: job.repository.repo,
            repoId: job.repository.repoId,
            status: "deleted",
        });
        return;
    }
    if (
        job.kind === "full-index" &&
        (job.reason === "installation" ||
            job.reason === "installation-repositories-added")
    ) {
        await store.upsertRepository({
            defaultBranch: job.repository.defaultBranch,
            installationId: job.installationId,
            owner: job.repository.owner,
            repo: job.repository.repo,
            repoId: job.repository.repoId,
            status: "queued",
        });
        return;
    }
    if (job.kind === "full-index" || job.kind === "incremental-push") {
        await store.markRepositoryStatus({
            defaultBranch: job.repository.defaultBranch,
            installationId: job.installationId,
            owner: job.repository.owner,
            repo: job.repository.repo,
            repoId: job.repository.repoId,
            status: "queued",
        });
    }
}
