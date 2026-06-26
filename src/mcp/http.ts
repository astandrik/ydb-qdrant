import express, { type Request, type Response } from "express";

import { YdbQdrantMcpServer } from "./mcp.js";
import type { YdbQdrantMcpDeps } from "./types.js";

export type YdbQdrantMcpHttpDeps = {
    allowedOrigins: string[];
    bearerToken: string;
    deps: YdbQdrantMcpDeps;
};

class McpHttpError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = "McpHttpError";
        this.statusCode = statusCode;
    }
}

const CORS_ALLOW_HEADERS =
    "Authorization, Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id";
const CORS_ALLOW_METHODS = "GET, POST, OPTIONS";
const CORS_EXPOSE_HEADERS = "Mcp-Session-Id";

function readBearerToken(req: Request): string | null {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }
    const token = authorization.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
}

function applyCorsHeaders(
    req: Request,
    res: Response,
    allowedOrigins: string[]
): void {
    const origin = req.header("origin");
    if (origin && !allowedOrigins.includes(origin)) {
        throw new McpHttpError(403, "origin is not allowed");
    }
    if (!origin) {
        return;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
    res.setHeader("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
    res.setHeader("Access-Control-Expose-Headers", CORS_EXPOSE_HEADERS);
    res.vary("Origin");
}

function authenticate(req: Request, bearerToken: string): void {
    if (readBearerToken(req) !== bearerToken) {
        throw new McpHttpError(401, "unauthorized");
    }
}

function sendHttpError(res: Response, err: unknown): void {
    const statusCode = err instanceof McpHttpError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : String(err);
    res.status(statusCode).json({ error: message, status: "error" });
}

export function createYdbQdrantMcpHttpRouter(params: YdbQdrantMcpHttpDeps) {
    const router = express.Router();
    const server = new YdbQdrantMcpServer(params.deps);

    router.options("/", (req: Request, res: Response): void => {
        try {
            applyCorsHeaders(req, res, params.allowedOrigins);
            res.status(204).send();
        } catch (err: unknown) {
            sendHttpError(res, err);
        }
    });

    router.get("/", (req: Request, res: Response): void => {
        try {
            applyCorsHeaders(req, res, params.allowedOrigins);
            authenticate(req, params.bearerToken);
            res.status(200)
                .type("text/event-stream")
                .send(": ydb-qdrant\n\n");
        } catch (err: unknown) {
            sendHttpError(res, err);
        }
    });

    router.post(
        "/",
        express.json({ limit: "1mb" }),
        async (req: Request, res: Response): Promise<void> => {
            try {
                applyCorsHeaders(req, res, params.allowedOrigins);
                authenticate(req, params.bearerToken);
                const result = await server.handleJsonRpcMessage(
                    JSON.stringify(req.body)
                );
                if (!result) {
                    res.status(202).json({ status: "accepted" });
                    return;
                }
                res.status(200).type("application/json").send(JSON.stringify(result));
            } catch (err: unknown) {
                sendHttpError(res, err);
            }
        }
    );

    return router;
}
