import readline from "node:readline";
import type { Readable, Writable } from "node:stream";

import {
    CODE_SEARCH_MAX_TOP,
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
const INDEX_REPOSITORY_TOOL_NAME = "index_repository";
const GET_INDEX_STATUS_TOOL_NAME = "get_index_status";
const LIST_REPOSITORIES_TOOL_NAME = "list_repositories";
const LIST_REPOSITORY_INDEXES_TOOL_NAME = "list_repository_indexes";
const SEARCH_TOOL_NAME = "search_code";
const HOSTED_AGENT_INSTRUCTIONS = [
    "Use this server as searchable project memory for GitHub repositories indexed by YDB Qdrant Code Indexer.",
    "If the user asks about a repository and owner/repo is unknown, call list_repositories first.",
    "If working inside a local checkout, infer owner/repo from git remote and then call list_repository_indexes.",
    "Use the default branch index for general repository questions.",
    "Use a pull request index only when the user asks about a specific PR or the current task maps to a PR; pass prNumber to search_code.",
    "Call search_code with concise natural-language or code-oriented queries before answering questions that require repository context.",
].join(" ");
const STANDALONE_AGENT_INSTRUCTIONS =
    "Use search_code to search indexed GitHub repository chunks stored in ydb-qdrant.";
const LOCAL_AGENT_INSTRUCTIONS = [
    "Use index_repository to index the configured local checkout into YDB-backed code memory.",
    "Use get_index_status to inspect the current local index.",
    "Use search_code after indexing; pass the installationId and repoId returned by index_repository.",
].join(" ");

export type CodeIndexerMcpAccessContext = {
    githubUserId: number | string;
};

export type CodeIndexerMcpResolvedRepository = {
    installationId: number;
    repoId: number;
};

export type CodeIndexerMcpRepositoryResolver = {
    resolveRepository(params: {
        githubUserId: number | string;
        installationId?: number;
        owner?: string;
        repo?: string;
        repoId?: number;
    }): Promise<CodeIndexerMcpResolvedRepository | null>;
};

export type CodeIndexerMcpRepositorySummary = {
    chunkCount?: number;
    defaultBranch: string;
    installationId: number;
    lastError?: string;
    lastIndexedAt?: string;
    lastIndexedSha?: string;
    owner: string;
    repo: string;
    repoId: number;
    status: string;
};

export type CodeIndexerMcpPullRequestIndexSummary = {
    collection?: string;
    jobId?: string;
    phase?: string;
    prNumber: number;
    status: "queued" | "indexing" | "ready" | "failed" | "deleting" | "deleted";
    updatedAt?: string;
};

export type CodeIndexerMcpRepositoryIndexSummary = {
    defaultBranch: {
        branch: string;
        chunkCount?: number;
        collection: string;
        lastError?: string;
        lastIndexedAt?: string;
        lastIndexedSha?: string;
        status: string;
    };
    installationId: number;
    owner: string;
    pullRequests: CodeIndexerMcpPullRequestIndexSummary[];
    repo: string;
    repoId: number;
};

export type CodeIndexerMcpRepositoryCatalog = {
    listRepositories(params: {
        githubUserId: number | string;
    }): Promise<CodeIndexerMcpRepositorySummary[]>;
    listRepositoryIndexes(params: {
        githubUserId: number | string;
        installationId?: number;
        limit?: number;
        owner?: string;
        repo?: string;
        repoId?: number;
    }): Promise<CodeIndexerMcpRepositoryIndexSummary | null>;
};

export type CodeIndexerMcpLocalIndexer = {
    getIndexStatus(params: {
        root?: string;
    }): Promise<{
        indexes: Array<{
            chunkCount?: number;
            collection: string;
            installationId: number;
            lastError?: string;
            lastIndexedAt?: string;
            lastIndexedSha?: string;
            owner: string;
            repo: string;
            repoId: number;
            root: string;
            status: string;
        }>;
    }>;
    indexRepository(params: {
        root?: string;
    }): Promise<{
        chunkCount?: number;
        collection: string;
        installationId: number;
        lastError?: string;
        lastIndexedAt?: string;
        lastIndexedSha?: string;
        owner: string;
        repo: string;
        repoId: number;
        root: string;
        status: string;
    }>;
    listRepositoryIndexes(params: {
        root?: string;
    }): Promise<CodeIndexerMcpRepositoryIndexSummary | null>;
};

export type CodeIndexerMcpDeps = CodeSearchDeps & {
    localIndexer?: CodeIndexerMcpLocalIndexer;
    repositoryCatalog?: CodeIndexerMcpRepositoryCatalog;
    repositoryResolver?: CodeIndexerMcpRepositoryResolver;
};

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
        anyOf: [
            { required: ["owner", "repo", "query"] },
            { required: ["installationId", "repoId", "query"] },
        ],
        properties: {
            installationId: {
                description: "GitHub App installation id.",
                type: "number",
            },
            owner: {
                description: "GitHub repository owner or organization.",
                type: "string",
            },
            prNumber: {
                description: "Optional pull request number for PR-scoped search.",
                type: "number",
            },
            query: {
                description: "Natural-language or code search query.",
                type: "string",
            },
            repo: {
                description: "GitHub repository name.",
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
        type: "object",
    };
}

function listRepositoriesInputSchema() {
    return {
        additionalProperties: false,
        properties: {},
        type: "object",
    };
}

function localRootInputSchema() {
    return {
        additionalProperties: false,
        properties: {
            root: {
                description:
                    "Local repository root. Defaults to YDB_QDRANT_MCP_WORKSPACE_ROOT when configured.",
                type: "string",
            },
        },
        type: "object",
    };
}

function listRepositoryIndexesInputSchema() {
    return {
        additionalProperties: false,
        properties: {
            installationId: {
                description: "GitHub App installation id.",
                type: "number",
            },
            limit: {
                default: 25,
                description: "Maximum number of recent index jobs to inspect.",
                minimum: 1,
                type: "number",
            },
            owner: {
                description: "GitHub repository owner or organization.",
                type: "string",
            },
            repo: {
                description: "GitHub repository name.",
                type: "string",
            },
            repoId: {
                description: "GitHub repository id.",
                type: "number",
            },
            root: {
                description:
                    "Local repository root for local MCP indexing mode.",
                type: "string",
            },
        },
        type: "object",
    };
}

export class CodeIndexerMcpServer {
    private readonly deps: CodeIndexerMcpDeps;

    constructor(deps: CodeIndexerMcpDeps) {
        this.deps = deps;
    }

    async handleJsonRpcMessage(
        raw: string,
        context?: CodeIndexerMcpAccessContext
    ): Promise<JsonRpcResponse | null> {
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
                        await this.toolsCallResult(parsed.params, context)
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
            instructions: this.deps.localIndexer
                ? LOCAL_AGENT_INSTRUCTIONS
                : this.deps.repositoryCatalog
                  ? HOSTED_AGENT_INSTRUCTIONS
                  : STANDALONE_AGENT_INSTRUCTIONS,
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: {
                name: SERVER_NAME,
                title: "YDB Qdrant Code Indexer",
                version: process.env.npm_package_version ?? "0.0.0",
            },
        };
    }

    private toolsListResult(): unknown {
        const tools = [];
        if (this.deps.localIndexer) {
            tools.push(
                {
                    annotations: {
                        destructiveHint: false,
                        readOnlyHint: false,
                    },
                    description:
                        "Index a local repository checkout into YDB-backed code memory. Uses YDB_QDRANT_MCP_WORKSPACE_ROOT when root is omitted.",
                    inputSchema: localRootInputSchema(),
                    name: INDEX_REPOSITORY_TOOL_NAME,
                    title: "Index local repository",
                },
                {
                    annotations: {
                        readOnlyHint: true,
                    },
                    description:
                        "Return the latest local repository index status for the configured or provided root.",
                    inputSchema: localRootInputSchema(),
                    name: GET_INDEX_STATUS_TOOL_NAME,
                    title: "Get local index status",
                }
            );
        }
        if (this.deps.repositoryCatalog) {
            tools.push(
                {
                    annotations: {
                        readOnlyHint: true,
                    },
                    description:
                        "List GitHub repositories this MCP token can search. Call this when owner/repo is unknown or a local git remote does not map cleanly to a repository.",
                    inputSchema: listRepositoriesInputSchema(),
                    name: LIST_REPOSITORIES_TOOL_NAME,
                    title: "List indexed repositories",
                },
                {
                    annotations: {
                        readOnlyHint: true,
                    },
                    description:
                        "List the default branch index and recent PR-scoped indexes for a repository. Use this to decide whether search_code should target the default branch or a specific prNumber.",
                    inputSchema: listRepositoryIndexesInputSchema(),
                    name: LIST_REPOSITORY_INDEXES_TOOL_NAME,
                    title: "List repository indexes",
                }
            );
        }
        if (this.deps.localIndexer && !this.deps.repositoryCatalog) {
            tools.push({
                annotations: {
                    readOnlyHint: true,
                },
                description:
                    "List the local default branch index for the configured or provided checkout root.",
                inputSchema: listRepositoryIndexesInputSchema(),
                name: LIST_REPOSITORY_INDEXES_TOOL_NAME,
                title: "List repository indexes",
            });
        }
        tools.push({
            annotations: {
                readOnlyHint: true,
            },
            description: this.deps.repositoryCatalog
                ? "Search indexed GitHub repository code chunks in YDB-backed Qdrant-compatible storage. In a local checkout, infer owner/repo from git remote; use default branch search for general questions and pass prNumber for PR-scoped search."
                : "Search indexed GitHub repository code chunks in YDB-backed Qdrant-compatible storage.",
            inputSchema: toolInputSchema(),
            name: SEARCH_TOOL_NAME,
            title: "Search indexed code",
        });
        return {
            tools,
        };
    }

    private async toolsCallResult(
        params: unknown,
        context: CodeIndexerMcpAccessContext | undefined
    ): Promise<unknown> {
        if (!isRecord(params) || typeof params.name !== "string") {
            throw new McpProtocolError(
                -32602,
                `Unknown tool: ${isRecord(params) ? String(params.name) : ""}`
            );
        }
        if (params.name === INDEX_REPOSITORY_TOOL_NAME) {
            return await this.indexRepositoryResult(params.arguments);
        }
        if (params.name === GET_INDEX_STATUS_TOOL_NAME) {
            return await this.getIndexStatusResult(params.arguments);
        }
        if (params.name === LIST_REPOSITORIES_TOOL_NAME) {
            return await this.listRepositoriesResult(context);
        }
        if (params.name === LIST_REPOSITORY_INDEXES_TOOL_NAME) {
            return await this.listRepositoryIndexesResult(
                params.arguments,
                context
            );
        }
        if (params.name !== SEARCH_TOOL_NAME) {
            throw new McpProtocolError(-32602, `Unknown tool: ${params.name}`);
        }
        let request;
        try {
            request = await this.parseSearchArguments(params.arguments, context);
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

    private async indexRepositoryResult(args: unknown): Promise<unknown> {
        const localIndexer = this.localIndexer(INDEX_REPOSITORY_TOOL_NAME);
        let request;
        try {
            request = parseLocalRootArguments(args);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            throw new McpProtocolError(-32602, message);
        }
        try {
            const index = await localIndexer.indexRepository(request);
            return {
                content: [
                    {
                        text: formatLocalIndexResponse(index),
                        type: "text",
                    },
                ],
                structuredContent: {
                    index,
                },
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

    private async getIndexStatusResult(args: unknown): Promise<unknown> {
        const localIndexer = this.localIndexer(GET_INDEX_STATUS_TOOL_NAME);
        let request;
        try {
            request = parseLocalRootArguments(args);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            throw new McpProtocolError(-32602, message);
        }
        const status = await localIndexer.getIndexStatus(request);
        return {
            content: [
                {
                    text: formatLocalIndexesResponse(status.indexes),
                    type: "text",
                },
            ],
            structuredContent: status,
        };
    }

    private async listRepositoriesResult(
        context: CodeIndexerMcpAccessContext | undefined
    ): Promise<unknown> {
        const catalog = this.authenticatedCatalog(
            context,
            "list_repositories"
        );
        const githubUserId = context?.githubUserId;
        if (githubUserId === undefined) {
            throw new McpProtocolError(
                -32602,
                "list_repositories requires authenticated MCP access"
            );
        }
        const repositories = await catalog.listRepositories({
            githubUserId,
        });
        return {
            content: [
                {
                    text: formatRepositoriesResponse(repositories),
                    type: "text",
                },
            ],
            structuredContent: {
                repositories,
            },
        };
    }

    private async listRepositoryIndexesResult(
        args: unknown,
        context: CodeIndexerMcpAccessContext | undefined
    ): Promise<unknown> {
        if (!context && this.deps.localIndexer && !this.deps.repositoryCatalog) {
            let request;
            try {
                request = parseLocalRootArguments(args);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                throw new McpProtocolError(-32602, message);
            }
            const repository =
                await this.deps.localIndexer.listRepositoryIndexes(request);
            if (!repository) {
                throw new McpProtocolError(-32602, "local index not found");
            }
            return {
                content: [
                    {
                        text: formatRepositoryIndexesResponse(repository),
                        type: "text",
                    },
                ],
                structuredContent: {
                    repository,
                },
            };
        }
        const catalog = this.authenticatedCatalog(
            context,
            "list_repository_indexes"
        );
        const githubUserId = context?.githubUserId;
        if (githubUserId === undefined) {
            throw new McpProtocolError(
                -32602,
                "list_repository_indexes requires authenticated MCP access"
            );
        }
        let request;
        try {
            request = parseRepositoryIndexArguments(args, githubUserId);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            throw new McpProtocolError(-32602, message);
        }
        const repository = await catalog.listRepositoryIndexes(request);
        if (!repository) {
            throw new McpProtocolError(
                -32602,
                "repository is not accessible to the authenticated token"
            );
        }
        return {
            content: [
                {
                    text: formatRepositoryIndexesResponse(repository),
                    type: "text",
                },
            ],
            structuredContent: {
                repository,
            },
        };
    }

    private authenticatedCatalog(
        context: CodeIndexerMcpAccessContext | undefined,
        toolName: string
    ): CodeIndexerMcpRepositoryCatalog {
        if (!context || !this.deps.repositoryCatalog) {
            throw new McpProtocolError(
                -32602,
                `${toolName} requires authenticated MCP access`
            );
        }
        return this.deps.repositoryCatalog;
    }

    private localIndexer(toolName: string): CodeIndexerMcpLocalIndexer {
        if (!this.deps.localIndexer) {
            throw new McpProtocolError(
                -32602,
                `${toolName} requires local indexing to be configured`
            );
        }
        return this.deps.localIndexer;
    }

    private async parseSearchArguments(
        args: unknown,
        context: CodeIndexerMcpAccessContext | undefined
    ) {
        if (!isRecord(args)) {
            return parseCodeSearchRequest(args);
        }
        const owner = readString(args.owner);
        const repo = readString(args.repo);
        if (owner && repo) {
            if (!context || !this.deps.repositoryResolver) {
                throw new Error(
                    "owner/repo search requires authenticated MCP access"
                );
            }
            const top =
                args.top === undefined
                    ? 10
                    : readBoundedPositiveInteger(args.top, CODE_SEARCH_MAX_TOP);
            if (top === null) {
                throw new Error(
                    `top must be a positive integer no greater than ${CODE_SEARCH_MAX_TOP}`
                );
            }
            const prNumber =
                args.prNumber === undefined
                    ? null
                    : readPositiveInteger(args.prNumber);
            if (args.prNumber !== undefined && prNumber === null) {
                throw new Error("prNumber must be a positive integer");
            }
            const resolved = await this.deps.repositoryResolver.resolveRepository({
                githubUserId: context.githubUserId,
                owner,
                repo,
            });
            if (!resolved) {
                throw new Error(
                    "repository is not accessible to the authenticated token"
                );
            }
            return {
                githubUserId: context.githubUserId,
                installationId: resolved.installationId,
                ...(prNumber === null ? {} : { prNumber }),
                query: requiredString(args.query, "query"),
                repoId: resolved.repoId,
                top,
            };
        }

        const request = parseCodeSearchRequest(args);
        if (context && this.deps.repositoryResolver) {
            const resolved = await this.deps.repositoryResolver.resolveRepository({
                githubUserId: context.githubUserId,
                installationId: request.installationId,
                repoId: request.repoId,
            });
            if (!resolved) {
                throw new Error(
                    "repository is not accessible to the authenticated token"
                );
            }
            return { ...request, githubUserId: context.githubUserId };
        }
        return context ? { ...request, githubUserId: context.githubUserId } : request;
    }
}

function parseRepositoryIndexArguments(
    args: unknown,
    githubUserId: number | string
): {
    githubUserId: number | string;
    installationId?: number;
    limit?: number;
    owner?: string;
    repo?: string;
    repoId?: number;
} {
    if (!isRecord(args)) {
        throw new Error("arguments must be an object");
    }
    const limit = readNumber(args.limit);
    if (limit !== null && limit <= 0) {
        throw new Error("limit must be greater than 0");
    }
    const owner = readString(args.owner);
    const repo = readString(args.repo);
    if (owner || repo) {
        if (!owner || !repo) {
            throw new Error("owner and repo must be provided together");
        }
        return {
            githubUserId,
            ...(limit === null ? {} : { limit }),
            owner,
            repo,
        };
    }
    const installationId = readNumber(args.installationId);
    const repoId = readNumber(args.repoId);
    if (installationId === null || repoId === null) {
        throw new Error("owner/repo or installationId/repoId is required");
    }
    return {
        githubUserId,
        installationId,
        ...(limit === null ? {} : { limit }),
        repoId,
    };
}

function parseLocalRootArguments(args: unknown): { root?: string } {
    if (args === undefined || args === null) {
        return {};
    }
    if (!isRecord(args)) {
        throw new Error("arguments must be an object");
    }
    const root = readString(args.root);
    return root ? { root } : {};
}

function formatLocalIndexResponse(index: {
    chunkCount?: number;
    collection: string;
    installationId: number;
    repoId: number;
    root: string;
    status: string;
}): string {
    const details = [
        `status=${index.status}`,
        `collection=${index.collection}`,
        `installationId=${index.installationId}`,
        `repoId=${index.repoId}`,
        index.chunkCount === undefined ? undefined : `chunks=${index.chunkCount}`,
    ].filter((value): value is string => Boolean(value));
    return `Indexed ${index.root}\n${details.join(" ")}`;
}

function formatLocalIndexesResponse(
    indexes: Array<{
        chunkCount?: number;
        collection: string;
        repo: string;
        root: string;
        status: string;
    }>
): string {
    if (indexes.length === 0) {
        return "No local repository indexes found.";
    }
    const lines = ["Local repository indexes:"];
    indexes.forEach((index, position) => {
        const details = [
            `status=${index.status}`,
            `collection=${index.collection}`,
            index.chunkCount === undefined ? undefined : `chunks=${index.chunkCount}`,
        ].filter((value): value is string => Boolean(value));
        lines.push(`${position + 1}. ${index.repo} ${index.root} ${details.join(" ")}`);
    });
    return lines.join("\n");
}

function formatRepositoriesResponse(
    repositories: CodeIndexerMcpRepositorySummary[]
): string {
    if (repositories.length === 0) {
        return "No repositories are available to this MCP token. Install the GitHub App on a repository first.";
    }
    const lines = ["Accessible indexed repositories:"];
    repositories.forEach((repository, index) => {
        const details = [
            `repoId=${repository.repoId}`,
            `installationId=${repository.installationId}`,
            `defaultBranch=${repository.defaultBranch}`,
            `status=${repository.status}`,
            repository.chunkCount === undefined
                ? undefined
                : `chunks=${repository.chunkCount}`,
            repository.lastIndexedAt
                ? `lastIndexed=${repository.lastIndexedAt}`
                : undefined,
        ].filter((value): value is string => Boolean(value));
        lines.push(
            `${index + 1}. ${repository.owner}/${repository.repo} ${details.join(
                " "
            )}`
        );
    });
    return lines.join("\n");
}

function formatRepositoryIndexesResponse(
    repository: CodeIndexerMcpRepositoryIndexSummary
): string {
    const lines = [
        `${repository.owner}/${repository.repo}`,
        `Default branch ${repository.defaultBranch.branch}: status=${repository.defaultBranch.status} collection=${repository.defaultBranch.collection}${
            repository.defaultBranch.chunkCount === undefined
                ? ""
                : ` chunks=${repository.defaultBranch.chunkCount}`
        }`,
    ];
    if (repository.pullRequests.length === 0) {
        lines.push("No recent pull request indexes found.");
        return lines.join("\n");
    }
    lines.push("Recent pull request indexes:");
    repository.pullRequests.forEach((pullRequest) => {
        const details = [
            `status=${pullRequest.status}`,
            pullRequest.phase ? `phase=${pullRequest.phase}` : undefined,
            pullRequest.collection
                ? `collection=${pullRequest.collection}`
                : undefined,
            pullRequest.updatedAt ? `updated=${pullRequest.updatedAt}` : undefined,
        ].filter((value): value is string => Boolean(value));
        lines.push(`- Pull request #${pullRequest.prNumber}: ${details.join(" ")}`);
    });
    return lines.join("\n");
}

function readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readPositiveInteger(value: unknown): number | null {
    return typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0
        ? value
        : null;
}

function readBoundedPositiveInteger(value: unknown, max: number): number | null {
    const number = readPositiveInteger(value);
    return number !== null && number <= max ? number : null;
}

function readString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : null;
}

function requiredString(value: unknown, name: string): string {
    const text = readString(value);
    if (!text) {
        throw new Error(`${name} is required`);
    }
    return text;
}

export function startMcpStdioServer(params: {
    deps: CodeIndexerMcpDeps;
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
