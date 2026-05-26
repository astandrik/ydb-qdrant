import express, { type Request, type Response } from "express";

import { logger } from "../logging/logger.js";
import {
    CodeIndexerAuthError,
    buildUiRedirectUrl,
    clearOAuthStateCookie,
    clearSessionCookie,
    createOAuthState,
    createOAuthStateCookie,
    createRandomSessionId,
    createSessionCookie,
    readOAuthStateCookie,
    readSessionCookie,
    verifyOAuthState,
    type CodeIndexerAuthDeps,
    type GitHubUserInstallation,
} from "./auth.js";
import {
    createPublicApiRouter,
    type CodeIndexerPublicApiDeps,
} from "./publicApi.js";
import {
    createMcpHttpRouter,
    type CodeIndexerMcpHttpDeps,
} from "./mcpHttp.js";
import {
    CodeSearchRequestError,
    parseCodeSearchRequest,
    searchCode,
} from "./searchAdapter.js";
import { createWebhookHandler, type WebhookLifecycleStore } from "./webhooks.js";
import type {
    CodeIndexStore,
    DeliveryStore,
    EmbeddingProvider,
    IndexingQueue,
} from "./types.js";

type CodeIndexerServerDeps = {
    auth?: CodeIndexerAuthDeps;
    deliveryStore: DeliveryStore;
    embeddingProvider: EmbeddingProvider;
    lifecycleStore?: WebhookLifecycleStore;
    mcp?: CodeIndexerMcpHttpDeps;
    publicApi?: CodeIndexerPublicApiDeps;
    queue: IndexingQueue;
    searchApiKey?: string;
    store: CodeIndexStore;
    webhookSecret: string;
};

function isSearchAuthorized(req: Request, searchApiKey: string | undefined): boolean {
    if (!searchApiKey) {
        return true;
    }
    return req.header("Authorization") === `Bearer ${searchApiKey}`;
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

function sendAuthError(res: Response, err: unknown): void {
    const statusCode =
        err instanceof CodeIndexerAuthError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : String(err);
    if (statusCode >= 500) {
        logger.error({ err }, "code-indexer auth failed");
    } else {
        logger.warn({ err }, "code-indexer auth rejected request");
    }
    res.status(statusCode).json({ error: message, status: "error" });
}

function registerUiCors(
    app: ReturnType<typeof express>,
    uiOrigin: string
): void {
    app.use((req: Request, res: Response, next): void => {
        const origin = req.header("origin");
        if (origin === uiOrigin) {
            res.setHeader("Access-Control-Allow-Origin", uiOrigin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader(
                "Access-Control-Allow-Methods",
                "GET,POST,DELETE,OPTIONS"
            );
            res.setHeader(
                "Access-Control-Allow-Headers",
                req.header("access-control-request-headers") ??
                    "Content-Type, Authorization"
            );
            res.vary("Origin");
        }
        if (req.method === "OPTIONS" && origin === uiOrigin) {
            res.status(204).send();
            return;
        }
        next();
    });
}

function registerAuthRoutes(
    app: ReturnType<typeof express>,
    auth: CodeIndexerAuthDeps
): void {
    app.get("/github/oauth/start", (req: Request, res: Response): void => {
        const now = auth.now?.() ?? new Date();
        const state = createOAuthState({
            installationId: readQueryString(req.query.installation_id),
            nowMs: now.getTime(),
            returnPath:
                readQueryString(req.query.return_to) ??
                readQueryString(req.query.returnPath),
            secret: auth.sessionSecret,
        });
        const statePayload = verifyOAuthState({
            nowMs: now.getTime(),
            secret: auth.sessionSecret,
            state,
            ttlSeconds: auth.oauthStateTtlSeconds,
        });
        res.setHeader(
            "Set-Cookie",
            createOAuthStateCookie(
                statePayload.nonce,
                auth.oauthStateTtlSeconds
            )
        );
        res.redirect(auth.client.authorizationUrl({ state }));
    });

    app.get(
        "/github/oauth/callback",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const code = readQueryString(req.query.code);
                if (!code) {
                    throw new CodeIndexerAuthError({
                        code: "missing_github_oauth_code",
                        message: "missing GitHub OAuth code",
                        statusCode: 400,
                    });
                }
                const rawState = readQueryString(req.query.state);
                if (!rawState) {
                    throw new CodeIndexerAuthError({
                        code: "missing_oauth_state",
                        message: "missing OAuth state",
                        statusCode: 400,
                    });
                }
                const now = auth.now?.() ?? new Date();
                const state = verifyOAuthState({
                    nowMs: now.getTime(),
                    secret: auth.sessionSecret,
                    state: rawState,
                    ttlSeconds: auth.oauthStateTtlSeconds,
                });
                if (readOAuthStateCookie(req.header("cookie")) !== state.nonce) {
                    throw new CodeIndexerAuthError({
                        code: "invalid_oauth_state",
                        message: "invalid OAuth state",
                        statusCode: 400,
                    });
                }
                const token = await auth.client.exchangeCode(code);
                const user = await auth.client.fetchUser(token.accessToken);
                const installationsToLink: GitHubUserInstallation[] = [];
                if (state.installationId) {
                    const installation = await auth.client.findUserInstallation(
                        token.accessToken,
                        state.installationId
                    );
                    if (!installation) {
                        throw new CodeIndexerAuthError({
                            code: "github_installation_inaccessible",
                            message:
                                "installation is not accessible to the authorized GitHub user",
                            statusCode: 403,
                        });
                    }
                    installationsToLink.push(installation);
                } else {
                    installationsToLink.push(
                        ...(await auth.client.listUserInstallations(
                            token.accessToken
                        ))
                    );
                }

                await auth.store.upsertGitHubUser({
                    accessToken: token.accessToken,
                    githubUserId: user.id,
                    login: user.login,
                    ...(token.refreshToken
                        ? { refreshToken: token.refreshToken }
                        : {}),
                });
                for (const installationToLink of installationsToLink) {
                    await auth.store.upsertInstallation({
                        accountLogin: installationToLink.accountLogin,
                        accountType: installationToLink.accountType,
                        createdByGithubUserId: user.id,
                        installationId: installationToLink.id,
                        status: installationToLink.status,
                    });
                }

                const sessionId =
                    auth.createSessionId?.() ?? createRandomSessionId();
                await auth.store.createSession({
                    expiresAt: new Date(
                        now.getTime() + auth.sessionTtlSeconds * 1_000
                    ),
                    githubUserId: user.id,
                    sessionId,
                });
                res.setHeader("Set-Cookie", [
                    createSessionCookie(sessionId, auth.sessionTtlSeconds),
                    clearOAuthStateCookie(),
                ]);
                res.redirect(buildUiRedirectUrl(auth.uiOrigin, state.returnPath));
            } catch (err: unknown) {
                sendAuthError(res, err);
            }
        }
    );

    app.post("/api/logout", async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = readSessionCookie(req.header("cookie"));
            if (sessionId) {
                await auth.store.deleteSession(sessionId);
            }
            res.setHeader("Set-Cookie", clearSessionCookie());
            res.status(204).send();
        } catch (err: unknown) {
            sendAuthError(res, err);
        }
    });
}

export function buildCodeIndexerServer(deps: CodeIndexerServerDeps) {
    const app = express();

    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    if (deps.auth) {
        registerUiCors(app, deps.auth.uiOrigin);
        registerAuthRoutes(app, deps.auth);
    }
    if (deps.publicApi) {
        app.use("/api", createPublicApiRouter(deps.publicApi));
    }
    if (deps.mcp) {
        app.use("/mcp", createMcpHttpRouter(deps.mcp));
    }

    app.post(
        "/github/webhook",
        express.raw({ limit: "5mb", type: "application/json" }),
        createWebhookHandler({
            deliveryStore: deps.deliveryStore,
            lifecycleStore: deps.lifecycleStore,
            queue: deps.queue,
            webhookSecret: deps.webhookSecret,
        })
    );

    app.post(
        "/search",
        express.json({ limit: "1mb" }),
        async (req: Request, res: Response): Promise<void> => {
            try {
                if (!isSearchAuthorized(req, deps.searchApiKey)) {
                    res.status(401).json({
                        error: "unauthorized",
                        status: "error",
                    });
                    return;
                }
                const request = parseCodeSearchRequest(req.body);
                const result = await searchCode({
                    embeddingProvider: deps.embeddingProvider,
                    store: deps.store,
                }, request);
                res.json({
                    collection: result.collection,
                    points: result.points,
                    status: "ok",
                    userUid: result.userUid,
                });
            } catch (err: unknown) {
                logger.error({ err }, "code-indexer search failed");
                const message = err instanceof Error ? err.message : String(err);
                const status =
                    err instanceof CodeSearchRequestError ? err.statusCode : 500;
                res.status(status).json({ error: message, status: "error" });
            }
        }
    );

    return app;
}
