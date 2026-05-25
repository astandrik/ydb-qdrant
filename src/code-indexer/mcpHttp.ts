import express, { type Request, type Response } from "express";

import { CodeIndexerMcpServer, type CodeIndexerMcpDeps } from "./mcp.js";
import type {
    CodeIndexerApiTokenRecord,
    CodeIndexerInstallationRecord,
    CodeIndexerRepositoryRecord,
} from "./saasStore.js";

export type CodeIndexerMcpHttpStore = {
    findApiTokenByPlaintextToken(
        plaintextToken: string
    ): Promise<CodeIndexerApiTokenRecord | null>;
    getRepository(
        repoId: number | string
    ): Promise<CodeIndexerRepositoryRecord | null>;
    listInstallationsForUser(
        githubUserId: number | string
    ): Promise<CodeIndexerInstallationRecord[]>;
    listRepositoriesForInstallation(
        installationId: number | string
    ): Promise<CodeIndexerRepositoryRecord[]>;
};

export type CodeIndexerMcpHttpDeps = CodeIndexerMcpDeps & {
    accessStore: CodeIndexerMcpHttpStore;
    allowedOrigins: string[];
};

class McpHttpError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = "McpHttpError";
        this.statusCode = statusCode;
    }
}

function readBearerToken(req: Request): string | null {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }
    const token = authorization.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
}

function validateOrigin(req: Request, allowedOrigins: string[]): void {
    const origin = req.header("origin");
    if (origin && !allowedOrigins.includes(origin)) {
        throw new McpHttpError(403, "origin is not allowed");
    }
}

async function authenticate(
    req: Request,
    store: CodeIndexerMcpHttpStore
): Promise<CodeIndexerApiTokenRecord> {
    const token = readBearerToken(req);
    if (!token) {
        throw new McpHttpError(401, "unauthorized");
    }
    const record = await store.findApiTokenByPlaintextToken(token);
    if (!record) {
        throw new McpHttpError(401, "unauthorized");
    }
    return record;
}

function sendHttpError(res: Response, err: unknown): void {
    const statusCode = err instanceof McpHttpError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : String(err);
    res.status(statusCode).json({ error: message, status: "error" });
}

function toSafeIntegerId(value: number | string): number | null {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
}

function activeInstallations(
    installations: CodeIndexerInstallationRecord[]
): CodeIndexerInstallationRecord[] {
    return installations.filter(
        (installation) =>
            installation.status !== "deleted" &&
            installation.status !== "suspended"
    );
}

function isSearchableRepository(
    repository: CodeIndexerRepositoryRecord
): boolean {
    return repository.status !== "deleted";
}

export function createMcpHttpRouter(deps: CodeIndexerMcpHttpDeps) {
    const router = express.Router();
    const server = new CodeIndexerMcpServer({
        ...deps,
        repositoryResolver: {
            resolveRepository: async (params) => {
                const installations = activeInstallations(
                    await deps.accessStore.listInstallationsForUser(
                        params.githubUserId
                    )
                );
                const accessibleInstallationIds = new Set(
                    installations.map((installation) => installation.installationId)
                );
                if (params.repoId !== undefined) {
                    const repository = await deps.accessStore.getRepository(
                        params.repoId
                    );
                    if (
                        !repository ||
                        !isSearchableRepository(repository) ||
                        !accessibleInstallationIds.has(repository.installationId) ||
                        (params.installationId !== undefined &&
                            repository.installationId !==
                                String(params.installationId))
                    ) {
                        return null;
                    }
                    const installationId = toSafeIntegerId(
                        repository.installationId
                    );
                    const repoId = toSafeIntegerId(repository.repoId);
                    return installationId === null || repoId === null
                        ? null
                        : { installationId, repoId };
                }
                if (!params.owner || !params.repo) {
                    return null;
                }
                for (const installation of installations) {
                    const repositories =
                        await deps.accessStore.listRepositoriesForInstallation(
                            installation.installationId
                        );
                    const repository = repositories.find(
                        (candidate) =>
                            isSearchableRepository(candidate) &&
                            candidate.owner === params.owner &&
                            candidate.repo === params.repo
                    );
                    if (!repository) {
                        continue;
                    }
                    const installationId = toSafeIntegerId(
                        repository.installationId
                    );
                    const repoId = toSafeIntegerId(repository.repoId);
                    return installationId === null || repoId === null
                        ? null
                        : { installationId, repoId };
                }
                return null;
            },
        },
    });

    router.get("/", async (req: Request, res: Response): Promise<void> => {
        try {
            validateOrigin(req, deps.allowedOrigins);
            await authenticate(req, deps.accessStore);
            res.status(200)
                .type("text/event-stream")
                .send(": ydb-qdrant-code-indexer\n\n");
        } catch (err: unknown) {
            sendHttpError(res, err);
        }
    });

    router.post(
        "/",
        express.json({ limit: "1mb" }),
        async (req: Request, res: Response): Promise<void> => {
            try {
                validateOrigin(req, deps.allowedOrigins);
                const token = await authenticate(req, deps.accessStore);
                const result = await server.handleJsonRpcMessage(
                    JSON.stringify(req.body),
                    { githubUserId: token.githubUserId }
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
