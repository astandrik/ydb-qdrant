import { loadCodeIndexerConfig } from "./config.js";
import { GitHubOAuthClient } from "./auth.js";
import { createCodeChunker } from "./chunker.js";
import {
    GitHubCheckRunReporter,
    NoopCheckRunReporter,
    withCheckRunReporting,
} from "./checkRuns.js";
import { GitHubAppClientFactory } from "./githubClient.js";
import { YdbQdrantIndexStore } from "./indexStore.js";
import { createCodeIndexerQuota } from "./quota.js";
import {
    InMemoryDeliveryStore,
    InMemoryIndexingQueue,
    InMemoryRepoManifestStore,
} from "./queue.js";
import { RepoIndexer } from "./repoIndexer.js";
import { createEmbeddingProviderFromConfig } from "./runtime.js";
import { YdbCodeIndexerSaasStore } from "./saasStore.js";
import { buildCodeIndexerServer } from "./server.js";
import {
    YdbDeliveryStore,
    YdbIndexingQueue,
    YdbIndexingProgressStore,
    YdbRepoManifestStore,
} from "./stateStore.js";
import { logger } from "../logging/logger.js";

function start(): void {
    const config = loadCodeIndexerConfig();
    const embeddingProvider = createEmbeddingProviderFromConfig(config);
    const chunker = createCodeChunker({ mode: config.chunkerMode });
    const clientFactory = new GitHubAppClientFactory({
        apiBaseUrl: config.githubApiBaseUrl,
        apiVersion: config.githubApiVersion,
        appId: config.githubAppId,
        privateKey: config.githubPrivateKey,
    });
    const store = new YdbQdrantIndexStore({
        includeTextInPayload: config.embedSnippetText,
    });
    const manifestStore =
        config.stateStore === "ydb"
            ? new YdbRepoManifestStore()
            : new InMemoryRepoManifestStore();
    const progressStore = new YdbIndexingProgressStore();
    const saasStore = new YdbCodeIndexerSaasStore({
        encryptionSecret: config.encryptionSecret,
        tokenPepper: config.tokenPepper,
    });
    const quota = createCodeIndexerQuota({
        limits: {
            chunksPerRepo: config.quotaChunksPerRepo,
            filesPerRepo: config.quotaFilesPerRepo,
            reposPerInstallation: config.quotaReposPerInstallation,
            searchesPerUserPerDay: config.quotaSearchesPerUserPerDay,
        },
        store: saasStore,
    });
    const indexer = new RepoIndexer({
        clientFactory,
        chunker,
        embeddingProvider,
        manifestStore,
        options: {
            chunkLines: config.chunkLines,
            embeddingBatchMaxChars: config.embeddingBatchMaxChars,
            embeddingBatchSize: config.embeddingBatchSize,
            embeddingConcurrency: config.embeddingConcurrency,
            fileConcurrency: config.fileConcurrency,
            maxChunkChars: config.maxChunkChars,
            maxChangedFilesForIncremental: config.maxChangedFilesForIncremental,
            maxFileBytes: config.maxFileBytes,
            overlapLines: config.overlapLines,
        },
        progressStore,
        quota,
        quotaStore: saasStore,
        statusStore: saasStore,
        store,
    });
    const checkRunReporter = config.checksEnabled
        ? new GitHubCheckRunReporter(clientFactory)
        : new NoopCheckRunReporter();
    const oauthClient = new GitHubOAuthClient({
        apiBaseUrl: config.githubApiBaseUrl,
        apiVersion: config.githubApiVersion,
        clientId: config.githubClientId,
        clientSecret: config.githubClientSecret,
        redirectUri: new URL(
            "/github/oauth/callback",
            config.publicBaseUrl
        ).toString(),
    });
    const processJob = withCheckRunReporting({
        processJob: (job, context) => indexer.processJob(job, context),
        reporter: checkRunReporter,
    });
    const deliveryStore =
        config.stateStore === "ydb"
            ? new YdbDeliveryStore()
            : new InMemoryDeliveryStore();
    const queue =
        config.stateStore === "ydb"
            ? new YdbIndexingQueue(processJob, {
                  concurrency: config.jobConcurrency,
                  maxAttempts: config.jobMaxAttempts,
                  onFinalFailure: (job, err) =>
                      indexer.reportFinalFailure(job, err),
                  progressStore,
                  retentionDays: config.stateRetentionDays,
                  retryBackoffMs: config.jobRetryBackoffMs,
              })
            : new InMemoryIndexingQueue(processJob, {
                  concurrency: config.jobConcurrency,
              });
    if (queue instanceof YdbIndexingQueue) {
        queue.start();
    }
    const app = buildCodeIndexerServer({
        auth: {
            client: oauthClient,
            oauthStateTtlSeconds: config.oauthStateTtlSeconds,
            sessionSecret: config.sessionSecret,
            sessionTtlSeconds: config.sessionTtlSeconds,
            store: saasStore,
            uiOrigin: config.uiOrigin,
        },
        deliveryStore,
        embeddingProvider,
        lifecycleStore: saasStore,
        mcp: {
            accessStore: saasStore,
            allowedOrigins: config.allowedMcpOrigins,
            embeddingProvider,
            progressStore,
            quota,
            store,
        },
        publicApi: {
            adminGithubUserIds: config.adminGithubUserIds,
            indexStore: store,
            manifestStore,
            progressStore,
            quota,
            queue,
            store: saasStore,
        },
        queue,
        repositorySource: clientFactory,
        searchApiKey: config.searchApiKey,
        store,
        webhookSecret: config.webhookSecret,
    });

    app.listen(config.port, () => {
        logger.info({ port: config.port }, "ydb-qdrant code indexer listening");
    });
}

start();
