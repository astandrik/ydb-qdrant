import "dotenv/config";

import express from "express";

import { logger } from "../logging/logger.js";
import {
    createYdbQdrantMcpDepsFromConfig,
    loadYdbQdrantMcpConfig,
} from "./config.js";
import { createYdbQdrantMcpHttpRouter } from "./http.js";

export async function startYdbQdrantMcpHttpServer(): Promise<void> {
    const config = loadYdbQdrantMcpConfig(undefined, {
        requireBearerToken: true,
    });
    if (!config.bearerToken) {
        throw new Error("YDB_QDRANT_MCP_BEARER_TOKEN is required");
    }
    const deps = await createYdbQdrantMcpDepsFromConfig(config);
    const app = express();
    app.use(
        "/mcp",
        createYdbQdrantMcpHttpRouter({
            allowedOrigins: config.allowedOrigins,
            bearerToken: config.bearerToken,
            deps,
        })
    );
    app.listen(config.port, () => {
        logger.info({ port: config.port }, "ydb-qdrant MCP HTTP listening");
    });
}
