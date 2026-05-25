import { randomBytes, randomUUID } from "node:crypto";

import express, { type Request, type Response } from "express";

import { logger } from "../logging/logger.js";
import {
    CodeIndexerAccessError,
    resolveDashboardSession,
    requireInstallationAccess,
    requireRepositoryAccess,
    type CodeIndexerAccessContext,
    type CodeIndexerAccessStore,
} from "./accessControl.js";
import {
    defaultBranchCollectionForRepo,
    userUidForInstallation,
} from "./naming.js";
import type {
    CodeIndexerApiTokenRecord,
    CodeIndexerRepositoryRecord,
} from "./saasStore.js";
import type {
    CodeIndexStore,
    GitHubRepositoryRef,
    IndexingQueue,
} from "./types.js";

export type CodeIndexerPublicApiStore = CodeIndexerAccessStore & {
    createApiToken(params: {
        githubUserId: number | string;
        name: string;
        plaintextToken: string;
        tokenId: string;
    }): Promise<void>;
    deleteApiTokensForUser(githubUserId: number | string): Promise<void>;
    deleteGitHubUser(githubUserId: number | string): Promise<void>;
    deleteInstallation(installationId: number | string): Promise<void>;
    deleteRepositoriesForInstallation(
        installationId: number | string
    ): Promise<void>;
    deleteSessionsForUser(githubUserId: number | string): Promise<void>;
    listApiTokens(
        githubUserId: number | string
    ): Promise<CodeIndexerApiTokenRecord[]>;
    listRepositoriesForInstallation(
        installationId: number | string
    ): Promise<CodeIndexerRepositoryRecord[]>;
    revokeApiToken(params: {
        githubUserId: number | string;
        tokenId: string;
    }): Promise<void>;
};

export type CodeIndexerPublicApiDeps = {
    createPlaintextToken?: () => string;
    createTokenId?: () => string;
    indexStore: CodeIndexStore;
    queue: IndexingQueue;
    store: CodeIndexerPublicApiStore;
};

class CodeIndexerPublicApiError extends Error {
    readonly code: string;
    readonly statusCode: number;

    constructor(params: { code: string; message: string; statusCode: number }) {
        super(params.message);
        this.name = "CodeIndexerPublicApiError";
        this.code = params.code;
        this.statusCode = params.statusCode;
    }
}

function apiError(
    code: string,
    message: string,
    statusCode: number
): CodeIndexerPublicApiError {
    return new CodeIndexerPublicApiError({ code, message, statusCode });
}

function readQueryString(value: unknown): string | undefined {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
        return value[0];
    }
    return undefined;
}

function readBodyRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function readTokenName(value: unknown): string {
    if (typeof value !== "string") {
        return "API token";
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 120) : "API token";
}

function readPathParam(req: Request, name: string): string {
    const value = req.params[name];
    if (!value) {
        throw apiError("bad_request", `${name} is required`, 400);
    }
    return value;
}

function toSafeIntegerId(value: number | string, name: string): number {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isSafeInteger(numeric) || numeric < 0) {
        throw apiError("bad_request", `${name} must be a safe integer`, 400);
    }
    return numeric;
}

function repositoryRefFromRecord(
    repository: CodeIndexerRepositoryRecord
): GitHubRepositoryRef {
    return {
        defaultBranch: repository.defaultBranch,
        owner: repository.owner,
        repo: repository.repo,
        repoId: toSafeIntegerId(repository.repoId, "repoId"),
    };
}

function createDefaultPlaintextToken(): string {
    return `ydbqci_${randomBytes(32).toString("base64url")}`;
}

function sendApiError(res: Response, err: unknown): void {
    const knownError =
        err instanceof CodeIndexerAccessError ||
        err instanceof CodeIndexerPublicApiError;
    const statusCode = knownError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : String(err);
    if (statusCode >= 500) {
        logger.error({ err }, "code-indexer public API failed");
    } else {
        logger.warn({ err }, "code-indexer public API rejected request");
    }
    res.status(statusCode).json({ error: message, status: "error" });
}

async function requireContext(
    deps: CodeIndexerPublicApiDeps,
    req: Request
): Promise<CodeIndexerAccessContext> {
    return await resolveDashboardSession({
        cookieHeader: req.header("cookie"),
        store: deps.store,
    });
}

export function createPublicApiRouter(deps: CodeIndexerPublicApiDeps) {
    const router = express.Router();
    router.use(express.json({ limit: "64kb" }));

    router.get("/me", async (req: Request, res: Response): Promise<void> => {
        try {
            const context = await requireContext(deps, req);
            res.json({ status: "ok", user: context.user });
        } catch (err: unknown) {
            sendApiError(res, err);
        }
    });

    router.get(
        "/installations",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const installations = await deps.store.listInstallationsForUser(
                    context.user.githubUserId
                );
                res.json({ installations, status: "ok" });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.get(
        "/repositories",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const installationId = readQueryString(req.query.installationId);
                if (!installationId) {
                    throw apiError(
                        "bad_request",
                        "installationId is required",
                        400
                    );
                }
                await requireInstallationAccess({
                    context,
                    installationId,
                    store: deps.store,
                });
                const repositories =
                    await deps.store.listRepositoriesForInstallation(
                        installationId
                    );
                res.json({ repositories, status: "ok" });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.post(
        "/repositories/:repoId/reindex",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const repository = await requireRepositoryAccess({
                    context,
                    repoId: readPathParam(req, "repoId"),
                    store: deps.store,
                });
                await deps.queue.enqueue({
                    installationId: toSafeIntegerId(
                        repository.installationId,
                        "installationId"
                    ),
                    kind: "full-index",
                    reason: "manual-reindex",
                    ref: repository.defaultBranch,
                    repository: repositoryRefFromRecord(repository),
                });
                res.status(202).json({ status: "ok" });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.post("/tokens", async (req: Request, res: Response): Promise<void> => {
        try {
            const context = await requireContext(deps, req);
            const body = readBodyRecord(req.body);
            const name = readTokenName(body.name);
            const tokenId = deps.createTokenId?.() ?? randomUUID();
            const plaintextToken =
                deps.createPlaintextToken?.() ?? createDefaultPlaintextToken();
            await deps.store.createApiToken({
                githubUserId: context.user.githubUserId,
                name,
                plaintextToken,
                tokenId,
            });
            res.status(201).json({
                status: "ok",
                token: {
                    name,
                    plaintextToken,
                    tokenId,
                },
            });
        } catch (err: unknown) {
            sendApiError(res, err);
        }
    });

    router.get("/tokens", async (req: Request, res: Response): Promise<void> => {
        try {
            const context = await requireContext(deps, req);
            const tokens = await deps.store.listApiTokens(
                context.user.githubUserId
            );
            res.json({ status: "ok", tokens });
        } catch (err: unknown) {
            sendApiError(res, err);
        }
    });

    router.delete(
        "/tokens/:tokenId",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                await deps.store.revokeApiToken({
                    githubUserId: context.user.githubUserId,
                    tokenId: readPathParam(req, "tokenId"),
                });
                res.status(204).send();
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    router.post(
        "/privacy/delete-my-data",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const context = await requireContext(deps, req);
                const installations = await deps.store.listInstallationsForUser(
                    context.user.githubUserId
                );
                let deletedRepositories = 0;
                for (const installation of installations) {
                    const repositories =
                        await deps.store.listRepositoriesForInstallation(
                            installation.installationId
                        );
                    for (const repository of repositories) {
                        const installationId = toSafeIntegerId(
                            repository.installationId,
                            "installationId"
                        );
                        const repoId = toSafeIntegerId(
                            repository.repoId,
                            "repoId"
                        );
                        await deps.indexStore.deleteCollection({
                            collection: defaultBranchCollectionForRepo(repoId),
                            userUid: userUidForInstallation(installationId),
                        });
                        await deps.queue.enqueue({
                            installationId,
                            kind: "delete-repo-index",
                            reason: "privacy-delete",
                            repository: repositoryRefFromRecord(repository),
                        });
                        deletedRepositories += 1;
                    }
                    await deps.store.deleteRepositoriesForInstallation(
                        installation.installationId
                    );
                    await deps.store.deleteInstallation(
                        installation.installationId
                    );
                }
                await deps.store.deleteSessionsForUser(
                    context.user.githubUserId
                );
                await deps.store.deleteApiTokensForUser(
                    context.user.githubUserId
                );
                await deps.store.deleteGitHubUser(context.user.githubUserId);
                res.json({
                    deletedInstallations: installations.length,
                    deletedRepositories,
                    status: "ok",
                });
            } catch (err: unknown) {
                sendApiError(res, err);
            }
        }
    );

    return router;
}
