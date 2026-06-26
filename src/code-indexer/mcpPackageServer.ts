process.env.YDB_QDRANT_LOG_TARGET = "stderr";

import { loadCodeIndexerSearchConfig } from "./config.js";
import { YdbQdrantIndexStore } from "./indexStore.js";
import { LocalCodeIndexer } from "./localIndexer.js";
import { startMcpStdioServer } from "./mcp.js";
import { createEmbeddingProviderFromConfig } from "./runtime.js";
import { YdbRepoManifestStore } from "./stateStore.js";

export function startCodeIndexerLocalMcpServer(): void {
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
