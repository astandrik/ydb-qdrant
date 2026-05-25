import { loadCodeIndexerConfig } from "./config.js";
import { createCodeChunker } from "./chunker.js";
import {
    GitHubCheckRunReporter,
    NoopCheckRunReporter,
    withCheckRunReporting,
} from "./checkRuns.js";
import { GitHubAppClientFactory } from "./githubClient.js";
import { YdbQdrantIndexStore } from "./indexStore.js";
import {
    InMemoryDeliveryStore,
    InMemoryIndexingQueue,
    InMemoryRepoManifestStore,
} from "./queue.js";
import { RepoIndexer } from "./repoIndexer.js";
import { createEmbeddingProviderFromConfig } from "./runtime.js";
import { buildCodeIndexerServer } from "./server.js";
import {
    YdbDeliveryStore,
    YdbIndexingQueue,
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
    const indexer = new RepoIndexer({
        clientFactory,
        chunker,
        embeddingProvider,
        manifestStore,
        options: {
            chunkLines: config.chunkLines,
            maxChunkChars: config.maxChunkChars,
            maxChangedFilesForIncremental: config.maxChangedFilesForIncremental,
            maxFileBytes: config.maxFileBytes,
            overlapLines: config.overlapLines,
        },
        store,
    });
    const checkRunReporter = config.checksEnabled
        ? new GitHubCheckRunReporter(clientFactory)
        : new NoopCheckRunReporter();
    const processJob = withCheckRunReporting({
        processJob: (job) => indexer.processJob(job),
        reporter: checkRunReporter,
    });
    const deliveryStore =
        config.stateStore === "ydb"
            ? new YdbDeliveryStore()
            : new InMemoryDeliveryStore();
    const queue =
        config.stateStore === "ydb"
            ? new YdbIndexingQueue(processJob, {
                  maxAttempts: config.jobMaxAttempts,
                  retentionDays: config.stateRetentionDays,
                  retryBackoffMs: config.jobRetryBackoffMs,
              })
            : new InMemoryIndexingQueue(processJob);
    if (queue instanceof YdbIndexingQueue) {
        queue.start();
    }
    const app = buildCodeIndexerServer({
        deliveryStore,
        embeddingProvider,
        queue,
        searchApiKey: config.searchApiKey,
        store,
        webhookSecret: config.webhookSecret,
    });

    app.listen(config.port, () => {
        logger.info({ port: config.port }, "ydb-qdrant code indexer listening");
    });
}

start();
