import { startYdbQdrantMcpHttpServer } from "./httpServer.js";

void startYdbQdrantMcpHttpServer().catch((err: unknown) => {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
