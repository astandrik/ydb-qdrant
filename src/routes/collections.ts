import { Router, Request, Response } from "express";
import {
    putCollectionIndex,
    createCollection,
    getCollection,
    deleteCollection,
} from "../services/CollectionService.js";
import { QdrantServiceError } from "../services/errors.js";
import { logger } from "../logging/logger.js";
import { qdrantResponse } from "../utils/qdrantResponse.js";
import {
    isAnonymousIdentityError,
    resolveRequestNamespaceUserUid,
    resolveRequestSigningKey,
} from "../utils/requestIdentity.js";

export const collectionsRouter = Router();

function buildCollectionContext(req: Request): {
    apiKey: string;
    collection: string;
    userAgent?: string;
    userUid: string;
} {
    const userUid = resolveRequestNamespaceUserUid(req);
    return {
        userUid,
        collection: String(req.params.collection),
        apiKey: resolveRequestSigningKey(req, userUid),
        userAgent: req.header("User-Agent") ?? undefined,
    };
}

function sendKnownRouteError(res: Response, err: unknown): boolean {
    if (err instanceof QdrantServiceError) {
        res.status(err.statusCode).json(err.payload);
        return true;
    }
    if (isAnonymousIdentityError(err)) {
        res.status(400).json({ status: "error", error: err.message });
        return true;
    }
    return false;
}

// Fix #8: PUT index → UpdateResult shape
collectionsRouter.put(
    "/:collection/index",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            await putCollectionIndex(buildCollectionContext(req));
            res.json(qdrantResponse({ operation_id: 0, status: "completed" }, start));
        } catch (err: unknown) {
            if (sendKnownRouteError(res, err)) {
                return;
            }
            logger.error({ err }, "build index failed");
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

// Fix #4: createCollection → result: true
collectionsRouter.put(
    "/:collection",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            await createCollection(buildCollectionContext(req), req.body);
            res.json(qdrantResponse(true, start));
        } catch (err: unknown) {
            if (sendKnownRouteError(res, err)) {
                return;
            }
            logger.error({ err }, "create collection failed");
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

collectionsRouter.get(
    "/:collection",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            const result = await getCollection(buildCollectionContext(req));
            res.json(qdrantResponse(result, start));
        } catch (err: unknown) {
            if (sendKnownRouteError(res, err)) {
                return;
            }
            logger.error({ err }, "get collection failed");
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

// Fix #5: deleteCollection → result: true
collectionsRouter.delete(
    "/:collection",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            await deleteCollection(buildCollectionContext(req));
            res.json(qdrantResponse(true, start));
        } catch (err: unknown) {
            if (sendKnownRouteError(res, err)) {
                return;
            }
            logger.error({ err }, "delete collection failed");
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);
