import express, { type Request, type Response } from "express";

import { logger } from "../logging/logger.js";
import { parseCodeSearchRequest, searchCode } from "./searchAdapter.js";
import { createWebhookHandler } from "./webhooks.js";
import type {
    CodeIndexStore,
    DeliveryStore,
    EmbeddingProvider,
    IndexingQueue,
} from "./types.js";

type CodeIndexerServerDeps = {
    deliveryStore: DeliveryStore;
    embeddingProvider: EmbeddingProvider;
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

export function buildCodeIndexerServer(deps: CodeIndexerServerDeps) {
    const app = express();

    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    app.post(
        "/github/webhook",
        express.raw({ limit: "5mb", type: "application/json" }),
        createWebhookHandler({
            deliveryStore: deps.deliveryStore,
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
                const status = /required|top must/i.test(message) ? 400 : 500;
                res.status(status).json({ error: message, status: "error" });
            }
        }
    );

    return app;
}
