process.env.YDB_QDRANT_LOG_TARGET = "stderr";

async function start(): Promise<void> {
    const [
        { loadCodeIndexerSearchConfig },
        { YdbQdrantIndexStore },
        { createEmbeddingProviderFromConfig },
        { startMcpStdioServer },
    ] = await Promise.all([
        import("./config.js"),
        import("./indexStore.js"),
        import("./runtime.js"),
        import("./mcp.js"),
    ]);

    const config = loadCodeIndexerSearchConfig();
    const embeddingProvider = createEmbeddingProviderFromConfig(config);
    const store = new YdbQdrantIndexStore({
        includeTextInPayload: config.embedSnippetText,
    });

    startMcpStdioServer({
        deps: {
            embeddingProvider,
            store,
        },
    });
}

void start().catch((err: unknown) => {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
