process.env.YDB_QDRANT_LOG_TARGET = "stderr";

export async function startCodeIndexerLocalMcpServer(): Promise<void> {
    const [
        { loadCodeIndexerSearchConfig },
        { YdbQdrantIndexStore },
        { LocalCodeIndexer },
        { startMcpStdioServer },
        { createEmbeddingProviderFromConfig },
        { YdbRepoManifestStore },
    ] = await Promise.all([
        import("./config.js"),
        import("./indexStore.js"),
        import("./localIndexer.js"),
        import("./mcp.js"),
        import("./runtime.js"),
        import("./stateStore.js"),
    ]);
    const config = loadCodeIndexerSearchConfig();
    const embeddingProvider = createEmbeddingProviderFromConfig(config);
    const store = new YdbQdrantIndexStore({
        includeTextInPayload: config.embedSnippetText,
    });
    const manifestStore = new YdbRepoManifestStore();
    const localIndexer = new LocalCodeIndexer({
        allowedRoots: readCommaSeparatedList(
            process.env.YDB_QDRANT_MCP_ALLOWED_ROOTS
        ),
        embeddingProvider,
        localNamespace:
            process.env.YDB_QDRANT_MCP_LOCAL_NAMESPACE?.trim() || undefined,
        manifestStore,
        store,
        workspaceRoot: process.env.YDB_QDRANT_MCP_WORKSPACE_ROOT?.trim() || undefined,
    });

    startMcpStdioServer({
        deps: {
            embeddingProvider,
            localIndexer,
            store,
        },
    });
}

function readCommaSeparatedList(value: string | undefined): string[] {
    return (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
