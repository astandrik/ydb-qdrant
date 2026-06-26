import { callYdbQdrantTool } from "./handlers.js";
import {
    McpProtocolError,
    errorResponse,
    isRequest,
    response,
    type JsonRpcResponse,
} from "./protocol.js";
import { enabledTools } from "./tools.js";
import type { YdbQdrantMcpDeps } from "./types.js";

export type {
    YdbQdrantMcpCollectionSummary,
    YdbQdrantMcpDeps,
    YdbQdrantMcpEmbeddingProvider,
} from "./types.js";
export { startYdbQdrantMcpStdioServer } from "./stdio.js";

const PROTOCOL_VERSION = "2025-11-25";
const SERVER_NAME = "ydb-qdrant";
const SERVER_TITLE = "YDB Qdrant";

export class YdbQdrantMcpServer {
    private readonly deps: YdbQdrantMcpDeps;

    constructor(deps: YdbQdrantMcpDeps) {
        this.deps = deps;
    }

    async handleJsonRpcMessage(raw: string): Promise<JsonRpcResponse | null> {
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw) as unknown;
        } catch {
            return errorResponse(null, -32700, "Parse error");
        }
        if (!isRequest(parsed)) {
            return errorResponse(null, -32600, "Invalid Request");
        }
        if (parsed.id === undefined) {
            return null;
        }

        try {
            switch (parsed.method) {
                case "initialize":
                    return response(parsed.id, this.initializeResult());
                case "tools/list":
                    return response(parsed.id, this.toolsListResult());
                case "tools/call":
                    return response(
                        parsed.id,
                        await callYdbQdrantTool(this.deps, parsed.params)
                    );
                default:
                    return errorResponse(
                        parsed.id,
                        -32601,
                        `Method not found: ${parsed.method}`
                    );
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            const code = err instanceof McpProtocolError ? err.code : -32603;
            return errorResponse(parsed.id, code, message);
        }
    }

    private initializeResult(): unknown {
        return {
            capabilities: {
                tools: {},
            },
            instructions:
                "Use this server to inspect and query the configured YDB Qdrant namespace. Prefer read-only tools unless the user explicitly asks to mutate data.",
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: {
                name: SERVER_NAME,
                title: SERVER_TITLE,
                version: process.env.npm_package_version ?? "0.0.0",
            },
        };
    }

    private toolsListResult(): unknown {
        return {
            tools: enabledTools({
                allowDestructive: this.deps.allowDestructive,
                allowWrites: this.deps.allowWrites,
                hasEmbedding: this.deps.embeddingProvider !== undefined,
            }),
        };
    }
}
