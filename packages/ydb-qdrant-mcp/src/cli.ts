export type Mode = "code-indexer" | "core" | "core-http";

export async function run(args: string[]): Promise<void> {
    const mode = readMode(args);
    switch (mode) {
        case "code-indexer": {
            const { startCodeIndexerLocalMcpServer } = await import(
                "ydb-qdrant/code-indexer/mcp-package"
            );
            await startCodeIndexerLocalMcpServer();
            return;
        }
        case "core": {
            const [
                { createYdbQdrantMcpDepsFromConfig, loadYdbQdrantMcpConfig },
                { startYdbQdrantMcpStdioServer },
            ] = await Promise.all([
                import("ydb-qdrant/mcp/config"),
                import("ydb-qdrant/mcp/stdio"),
            ]);
            const config = loadYdbQdrantMcpConfig();
            const deps = await createYdbQdrantMcpDepsFromConfig(config);
            startYdbQdrantMcpStdioServer({ deps });
            return;
        }
        case "core-http":
            await import("ydb-qdrant/mcp/http-server");
            return;
    }
}

export function readMode(args: string[]): Mode {
    const modeFlagIndex = args.indexOf("--mode");
    const modeEqualsValue = args
        .find((arg) => arg.startsWith("--mode="))
        ?.slice("--mode=".length)
        .trim();
    const value =
        modeEqualsValue ??
        (modeFlagIndex === -1
            ? "code-indexer"
            : args[modeFlagIndex + 1]?.trim());
    if (value === "code-indexer" || value === "core" || value === "core-http") {
        return value;
    }
    throw new Error(
        "Unsupported mode. Use one of: code-indexer, core, core-http"
    );
}
