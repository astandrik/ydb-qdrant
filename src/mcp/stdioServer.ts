process.env.YDB_QDRANT_LOG_TARGET = "stderr";

export {};

async function start(): Promise<void> {
    const [{ createYdbQdrantMcpDepsFromConfig, loadYdbQdrantMcpConfig }, { startYdbQdrantMcpStdioServer }] =
        await Promise.all([import("./config.js"), import("./stdio.js")]);

    const config = loadYdbQdrantMcpConfig();
    const deps = await createYdbQdrantMcpDepsFromConfig(config);
    startYdbQdrantMcpStdioServer({ deps });
}

void start().catch((err: unknown) => {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
