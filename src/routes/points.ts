import { Router, Request, Response } from "express";
import {
    upsertPoints,
    searchPoints,
    queryPoints,
    deletePoints,
    retrievePoints,
} from "../services/PointsService.js";
import { QdrantServiceError } from "../services/errors.js";
import { logger } from "../logging/logger.js";
import { isCompilationTimeoutError } from "../ydb/client.js";
import { scheduleExit } from "../utils/exit.js";
import { isUpsertRequestTimedOut } from "../middleware/upsertRequestTimeout.js";
import type {
    QdrantScoredPoint,
    YdbQdrantScoredPoint,
} from "../qdrant/QdrantRestTypes.js";
import { qdrantResponse } from "../utils/qdrantResponse.js";
import {
    elapsedMsSince,
    getElapsedMsSinceRequestStart,
    getMonotonicTimeNs,
} from "../logging/requestContext.js";
import {
    resolveRequestSigningKey,
    resolveRequestUserUid,
} from "../utils/requestIdentity.js";

export const pointsRouter = Router();

function buildPointsContext(req: Request): {
    apiKey: string;
    collection: string;
    userAgent?: string;
    userUid: string;
} {
    const userUid = resolveRequestUserUid(req);
    return {
        userUid,
        collection: String(req.params.collection),
        apiKey: resolveRequestSigningKey(req, userUid),
        userAgent: req.header("User-Agent") ?? undefined,
    };
}

function shouldSkipResponse(req: Request, res: Response): boolean {
    return res.headersSent || res.writableEnded || isUpsertRequestTimedOut(req);
}

function toQdrantScoredPoint(p: YdbQdrantScoredPoint): QdrantScoredPoint {
    // We don't currently track per-point versions or return vectors/shard keys,
    // but many Qdrant clients expect these fields to exist in the response.
    return {
        id: p.id,
        version: 0,
        score: p.score,
        payload: p.payload ?? null,
        vector: null,
        shard_key: null,
        order_value: null,
    } as unknown as QdrantScoredPoint;
}

function logUpsertHandlerEntry(alias: "put" | "post"): void {
    logger.info(
        {
            phase: "upsertEntry",
            alias,
            timeToHandlerMs: getElapsedMsSinceRequestStart(),
        },
        "upsert: handler entry"
    );
}

function logUpsertFailure(args: {
    alias: "put" | "post";
    routeStartNs: bigint;
    err: unknown;
}): void {
    if (args.err instanceof QdrantServiceError) {
        return;
    }
    logger.error(
        {
            err:
                args.err instanceof Error
                    ? args.err
                    : new Error(String(args.err)),
            phase: "upsertFailed",
            alias: args.alias,
            routeElapsedMs: elapsedMsSince(args.routeStartNs),
            timeToHandlerMs: getElapsedMsSinceRequestStart(),
        },
        "upsert: failed"
    );
}

// Qdrant-compatible: POST /collections/:collection/points (retrieve by IDs)
pointsRouter.post(
    "/:collection/points",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            const { points } = await retrievePoints(buildPointsContext(req), req.body);
            const result = points.map((p) => ({
                id: p.id,
                version: 0,
                payload: p.payload,
                vector: null,
                shard_key: null,
                order_value: null,
            }));
            res.json(qdrantResponse(result, start));
        } catch (err: unknown) {
            if (err instanceof QdrantServiceError) {
                return res.status(err.statusCode).json(err.payload);
            }
            logger.error({ err }, "retrieve points failed");
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

// Fix #6: Upsert → UpdateResult shape
// Qdrant-compatible: PUT /collections/:collection/points (upsert)
pointsRouter.put(
    "/:collection/points",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        const routeStartNs = getMonotonicTimeNs();
        try {
            logUpsertHandlerEntry("put");
            if (shouldSkipResponse(req, res)) {
                return;
            }
            await upsertPoints(buildPointsContext(req), req.body);
            if (shouldSkipResponse(req, res)) {
                return;
            }
            res.json(qdrantResponse({ operation_id: 0, status: "completed" }, start));
        } catch (err: unknown) {
            logUpsertFailure({ alias: "put", routeStartNs, err });
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            const isCompilationTimeout = isCompilationTimeoutError(err);
            if (isCompilationTimeout) {
                logger.error(
                    { err },
                    "YDB compilation timeout during upsert points (PUT); scheduling process exit"
                );
                scheduleExit(1);
                if (shouldSkipResponse(req, res)) {
                    return;
                }
                res.status(500).json({ status: "error", error: errorMessage });
                return;
            }
            if (shouldSkipResponse(req, res)) {
                return;
            }
            if (err instanceof QdrantServiceError) {
                return res.status(err.statusCode).json(err.payload);
            }
            logger.error({ err }, "upsert points (PUT) failed");
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

// Fix #6: Upsert → UpdateResult shape
pointsRouter.post(
    "/:collection/points/upsert",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        const routeStartNs = getMonotonicTimeNs();
        try {
            logUpsertHandlerEntry("post");
            if (shouldSkipResponse(req, res)) {
                return;
            }
            await upsertPoints(buildPointsContext(req), req.body);
            if (shouldSkipResponse(req, res)) {
                return;
            }
            res.json(qdrantResponse({ operation_id: 0, status: "completed" }, start));
        } catch (err: unknown) {
            logUpsertFailure({ alias: "post", routeStartNs, err });
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            const isCompilationTimeout = isCompilationTimeoutError(err);
            if (isCompilationTimeout) {
                logger.error(
                    { err },
                    "YDB compilation timeout during upsert points; scheduling process exit"
                );
                scheduleExit(1);
                if (shouldSkipResponse(req, res)) {
                    return;
                }
                res.status(500).json({ status: "error", error: errorMessage });
                return;
            }
            if (shouldSkipResponse(req, res)) {
                return;
            }
            if (err instanceof QdrantServiceError) {
                return res.status(err.statusCode).json(err.payload);
            }
            logger.error({ err }, "upsert points failed");
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

pointsRouter.post(
    "/:collection/points/search",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            const { points } = await searchPoints(buildPointsContext(req), req.body);
            res.json(qdrantResponse(points.map(toQdrantScoredPoint), start));
        } catch (err: unknown) {
            if (err instanceof QdrantServiceError) {
                return res.status(err.statusCode).json(err.payload);
            }
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            if (isCompilationTimeoutError(err)) {
                logger.error(
                    { err },
                    "YDB compilation timeout during search points; scheduling process exit"
                );
                res.status(500).json({ status: "error", error: errorMessage });
                scheduleExit(1);
                return;
            }
            logger.error({ err }, "search points failed");
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

// Compatibility: some clients call POST /collections/:collection/points/query
pointsRouter.post(
    "/:collection/points/query",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            const { points } = await queryPoints(buildPointsContext(req), req.body);
            // Qdrant-compatible: /points/query returns QueryResponse with { points: ScoredPoint[] }.
            res.json(qdrantResponse({ points: points.map(toQdrantScoredPoint) }, start));
        } catch (err: unknown) {
            if (err instanceof QdrantServiceError) {
                return res.status(err.statusCode).json(err.payload);
            }
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            if (isCompilationTimeoutError(err)) {
                logger.error(
                    { err },
                    "YDB compilation timeout during search points (query); scheduling process exit"
                );
                res.status(500).json({ status: "error", error: errorMessage });
                scheduleExit(1);
                return;
            }
            logger.error({ err }, "search points (query) failed");
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);

// Fix #7: Delete → UpdateResult shape
pointsRouter.post(
    "/:collection/points/delete",
    async (req: Request, res: Response) => {
        const start = process.hrtime();
        try {
            await deletePoints(buildPointsContext(req), req.body);
            res.json(qdrantResponse({ operation_id: 0, status: "completed" }, start));
        } catch (err: unknown) {
            if (err instanceof QdrantServiceError) {
                return res.status(err.statusCode).json(err.payload);
            }
            logger.error({ err }, "delete points failed");
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            res.status(500).json({ status: "error", error: errorMessage });
        }
    }
);
