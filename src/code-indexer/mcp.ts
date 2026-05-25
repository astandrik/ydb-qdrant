import readline from "node:readline";
import type { Readable, Writable } from "node:stream";

import {
    formatCodeSearchResponse,
    parseCodeSearchRequest,
    searchCode,
    type CodeSearchDeps,
} from "./searchAdapter.js";

type JsonRpcId = number | string | null;

type JsonRpcRequest = {
    id?: JsonRpcId;
    jsonrpc: "2.0";
    method: string;
    params?: unknown;
};

type JsonRpcResponse =
    | {
          id: JsonRpcId;
          jsonrpc: "2.0";
          result: unknown;
      }
    | {
          error: {
              code: number;
              message: string;
          };
          id: JsonRpcId;
          jsonrpc: "2.0";
      };

const PROTOCOL_VERSION = "2025-11-25";
const SERVER_NAME = "ydb-qdrant-code-indexer";
const TOOL_NAME = "search_code";

class McpProtocolError extends Error {
    readonly code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequest(value: unknown): value is JsonRpcRequest {
    return (
        isRecord(value) &&
        value.jsonrpc === "2.0" &&
        typeof value.method === "string" &&
        (value.id === undefined ||
            typeof value.id === "string" ||
            typeof value.id === "number" ||
            value.id === null)
    );
}

function response(id: JsonRpcId, result: unknown): JsonRpcResponse {
    return { id, jsonrpc: "2.0", result };
}

function errorResponse(
    id: JsonRpcId,
    code: number,
    message: string
): JsonRpcResponse {
    return { error: { code, message }, id, jsonrpc: "2.0" };
}

function toolInputSchema() {
    return {
        additionalProperties: false,
        properties: {
            installationId: {
                description: "GitHub App installation id.",
                type: "number",
            },
            prNumber: {
                description: "Optional pull request number for PR-scoped search.",
                type: "number",
            },
            query: {
                description: "Natural-language or code search query.",
                type: "string",
            },
            repoId: {
                description: "GitHub repository id.",
                type: "number",
            },
            top: {
                default: 10,
                description: "Maximum number of indexed chunks to return.",
                minimum: 1,
                type: "number",
            },
        },
        required: ["installationId", "repoId", "query"],
        type: "object",
    };
}

export class CodeIndexerMcpServer {
    private readonly deps: CodeSearchDeps;

    constructor(deps: CodeSearchDeps) {
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
            this.handleNotification(parsed.method);
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
                        await this.toolsCallResult(parsed.params)
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

    private handleNotification(method: string): void {
        if (method === "notifications/initialized") {
            return;
        }
    }

    private initializeResult(): unknown {
        return {
            capabilities: {
                tools: {},
            },
            instructions:
                "Use search_code to search indexed GitHub repository chunks stored in ydb-qdrant.",
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: {
                name: SERVER_NAME,
                title: "YDB Qdrant Code Indexer",
                version: process.env.npm_package_version ?? "0.0.0",
            },
        };
    }

    private toolsListResult(): unknown {
        return {
            tools: [
                {
                    annotations: {
                        readOnlyHint: true,
                    },
                    description:
                        "Search indexed GitHub repository code chunks in YDB-backed Qdrant-compatible storage.",
                    inputSchema: toolInputSchema(),
                    name: TOOL_NAME,
                    title: "Search indexed code",
                },
            ],
        };
    }

    private async toolsCallResult(params: unknown): Promise<unknown> {
        if (!isRecord(params) || params.name !== TOOL_NAME) {
            throw new McpProtocolError(
                -32602,
                `Unknown tool: ${isRecord(params) ? String(params.name) : ""}`
            );
        }
        let request;
        try {
            request = parseCodeSearchRequest(params.arguments);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            throw new McpProtocolError(-32602, message);
        }
        try {
            const result = await searchCode(this.deps, request);
            return {
                content: [
                    {
                        text: formatCodeSearchResponse(result),
                        type: "text",
                    },
                ],
                structuredContent: result,
            };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [
                    {
                        text: message,
                        type: "text",
                    },
                ],
                isError: true,
            };
        }
    }
}

export function startMcpStdioServer(params: {
    deps: CodeSearchDeps;
    input?: Readable;
    output?: Writable;
}): void {
    const server = new CodeIndexerMcpServer(params.deps);
    const input = params.input ?? process.stdin;
    const output = params.output ?? process.stdout;
    const rl = readline.createInterface({ input });

    rl.on("line", (line) => {
        void (async () => {
            const trimmed = line.trim();
            if (!trimmed) {
                return;
            }
            const result = await server.handleJsonRpcMessage(trimmed);
            if (result) {
                output.write(`${JSON.stringify(result)}\n`);
            }
        })();
    });
}
