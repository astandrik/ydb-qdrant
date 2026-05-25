import { logger } from "../logging/logger.js";
import type {
    CheckRunReporter,
    GitHubCheckRunHandle,
    GitHubChecksClientFactory,
    IndexingJob,
    IndexingJobExecutionContext,
} from "./types.js";

export const CHECK_RUN_NAME = "YDB Qdrant Code Index";
const SHA_RE = /^[a-f0-9]{40}$/i;

export class NoopCheckRunReporter implements CheckRunReporter {
    complete(): Promise<void> {
        return Promise.resolve();
    }

    start(): Promise<GitHubCheckRunHandle | null> {
        return Promise.resolve(null);
    }
}

export class GitHubCheckRunReporter implements CheckRunReporter {
    private readonly checksClientFactory: GitHubChecksClientFactory;

    constructor(checksClientFactory: GitHubChecksClientFactory) {
        this.checksClientFactory = checksClientFactory;
    }

    async start(job: IndexingJob): Promise<GitHubCheckRunHandle | null> {
        const headSha = checkRunShaForJob(job);
        if (!headSha) {
            return null;
        }
        const client = await this.checksClientFactory.checksForInstallation(
            job.installationId
        );
        const checkRun = await client.createCheckRun({
            headSha,
            name: CHECK_RUN_NAME,
            owner: job.repository.owner,
            repo: job.repository.repo,
            status: "in_progress",
        });
        return {
            checkRunId: checkRun.id,
            installationId: job.installationId,
            owner: job.repository.owner,
            repo: job.repository.repo,
        };
    }

    async complete(
        handle: GitHubCheckRunHandle | null,
        result: {
            conclusion: "failure" | "success";
            summary: string;
            title: string;
        }
    ): Promise<void> {
        if (!handle) {
            return;
        }
        const client = await this.checksClientFactory.checksForInstallation(
            handle.installationId
        );
        await client.updateCheckRun({
            checkRunId: handle.checkRunId,
            conclusion: result.conclusion,
            owner: handle.owner,
            repo: handle.repo,
            status: "completed",
            summary: result.summary,
            title: result.title,
        });
    }
}

export function checkRunShaForJob(job: IndexingJob): string | null {
    switch (job.kind) {
        case "incremental-push":
            return SHA_RE.test(job.after) ? job.after : null;
        case "pr-index":
            if (job.sourceRepository.repoId !== job.repository.repoId) {
                return null;
            }
            return SHA_RE.test(job.headSha) ? job.headSha : null;
        case "full-index":
            return job.sha && SHA_RE.test(job.sha) ? job.sha : null;
        case "delete-pr-index":
        case "delete-repo-index":
            return null;
    }
}

export function withCheckRunReporting(params: {
    processJob: (
        job: IndexingJob,
        context: IndexingJobExecutionContext
    ) => Promise<void>;
    reporter: CheckRunReporter;
}): ((
    job: IndexingJob,
    context: IndexingJobExecutionContext
) => Promise<void>) {
    return async (
        job: IndexingJob,
        context: IndexingJobExecutionContext
    ): Promise<void> => {
        let handle: GitHubCheckRunHandle | null = null;
        try {
            handle = await params.reporter.start(job);
        } catch (err: unknown) {
            logger.warn({ err, jobKind: job.kind }, "code-indexer check run start failed");
        }

        try {
            await params.processJob(job, context);
            try {
                await params.reporter.complete(handle, {
                    conclusion: "success",
                    summary: `Indexed ${job.repository.owner}/${job.repository.repo}.`,
                    title: "Indexing completed",
                });
            } catch (err: unknown) {
                logger.warn(
                    { err, jobKind: job.kind },
                    "code-indexer check run success update failed"
                );
            }
        } catch (err: unknown) {
            try {
                await params.reporter.complete(handle, {
                    conclusion: "failure",
                    summary: err instanceof Error ? err.message : String(err),
                    title: "Indexing failed",
                });
            } catch (reportErr: unknown) {
                logger.warn(
                    { err: reportErr, jobKind: job.kind },
                    "code-indexer check run failure update failed"
                );
            }
            throw err;
        }
    };
}
