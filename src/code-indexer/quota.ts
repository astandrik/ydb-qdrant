import { logger as defaultLogger } from "../logging/logger.js";

export type CodeIndexerQuotaMetric =
    | "chunks_per_repo"
    | "files_per_repo"
    | "repos_per_installation"
    | "searches_per_user_per_day";

export type CodeIndexerQuotaLimits = {
    chunksPerRepo: number;
    filesPerRepo: number;
    reposPerInstallation: number;
    searchesPerUserPerDay: number;
};

export type CodeIndexerQuotaStore = {
    incrementDailyUsage(params: {
        githubUserId: number | string;
        metric: string;
    }): Promise<number>;
};

type QuotaLogger = {
    warn(fields: Record<string, unknown>, message: string): void;
};

type QuotaDenyParams = {
    count: number;
    githubUserId?: number | string;
    installationId?: number | string;
    limit: number;
    metric: CodeIndexerQuotaMetric;
    repoId?: number | string;
    statusCode: 422 | 429;
};

export class CodeIndexerQuotaError extends Error {
    readonly code: string;
    readonly count: number;
    readonly limit: number;
    readonly metric: CodeIndexerQuotaMetric;
    readonly statusCode: 422 | 429;

    constructor(params: {
        count: number;
        limit: number;
        metric: CodeIndexerQuotaMetric;
        statusCode: 422 | 429;
    }) {
        super(
            `quota ${params.metric} exceeded: ${params.count} exceeds limit ${params.limit}`
        );
        this.name = "CodeIndexerQuotaError";
        this.code = `quota_${params.metric}_exceeded`;
        this.count = params.count;
        this.limit = params.limit;
        this.metric = params.metric;
        this.statusCode = params.statusCode;
    }
}

export class CodeIndexerQuota {
    private readonly limits: CodeIndexerQuotaLimits;
    private readonly logger: QuotaLogger;
    private readonly store?: CodeIndexerQuotaStore;

    constructor(params: {
        limits: CodeIndexerQuotaLimits;
        logger?: QuotaLogger;
        store?: CodeIndexerQuotaStore;
    }) {
        this.limits = params.limits;
        this.logger = params.logger ?? defaultLogger;
        this.store = params.store;
    }

    assertRepositoriesPerInstallation(params: {
        githubUserId?: number | string;
        installationId: number | string;
        repoCount: number;
    }): void {
        this.assertWithinLimit({
            count: params.repoCount,
            githubUserId: params.githubUserId,
            installationId: params.installationId,
            limit: this.limits.reposPerInstallation,
            metric: "repos_per_installation",
            statusCode: 422,
        });
    }

    assertFilesPerRepo(params: {
        fileCount: number;
        installationId: number | string;
        repoId: number | string;
    }): void {
        this.assertWithinLimit({
            count: params.fileCount,
            installationId: params.installationId,
            limit: this.limits.filesPerRepo,
            metric: "files_per_repo",
            repoId: params.repoId,
            statusCode: 422,
        });
    }

    assertChunksPerRepo(params: {
        chunkCount: number;
        installationId: number | string;
        repoId: number | string;
    }): void {
        this.assertWithinLimit({
            count: params.chunkCount,
            installationId: params.installationId,
            limit: this.limits.chunksPerRepo,
            metric: "chunks_per_repo",
            repoId: params.repoId,
            statusCode: 422,
        });
    }

    async recordSearch(params: {
        githubUserId: number | string;
        installationId?: number | string;
        repoId?: number | string;
    }): Promise<void> {
        const count = await this.store?.incrementDailyUsage({
            githubUserId: params.githubUserId,
            metric: "search",
        });
        this.assertWithinLimit({
            count: count ?? 1,
            githubUserId: params.githubUserId,
            installationId: params.installationId,
            limit: this.limits.searchesPerUserPerDay,
            metric: "searches_per_user_per_day",
            repoId: params.repoId,
            statusCode: 429,
        });
    }

    private assertWithinLimit(params: QuotaDenyParams): void {
        if (params.count <= params.limit) {
            return;
        }
        this.logger.warn(
            {
                count: params.count,
                ...(params.githubUserId === undefined
                    ? {}
                    : { githubUserId: params.githubUserId }),
                ...(params.installationId === undefined
                    ? {}
                    : { installationId: params.installationId }),
                limit: params.limit,
                metric: params.metric,
                ...(params.repoId === undefined ? {} : { repoId: params.repoId }),
            },
            "code-indexer quota denied"
        );
        throw new CodeIndexerQuotaError(params);
    }
}

export function createCodeIndexerQuota(params: {
    limits: CodeIndexerQuotaLimits;
    logger?: QuotaLogger;
    store?: CodeIndexerQuotaStore;
}): CodeIndexerQuota {
    return new CodeIndexerQuota(params);
}
