import express from "express";
import type { NextFunction, Request, Response } from "express";
import { collectionsRouter } from "./routes/collections.js";
import { pointsRouter } from "./routes/points.js";
import { requestLogger } from "./middleware/requestLogger.js";
import {
    isUpsertRequestTimedOut,
    upsertBodyTimeout,
    upsertProcessingTimeout,
} from "./middleware/upsertRequestTimeout.js";
import {
    instrumentUpsertRequestBody,
    logUpsertBodyPhase,
    logUpsertBodyPhaseError,
    verifyUpsertRequestBody,
} from "./middleware/upsertBodyPhase.js";
import { isYdbAvailable, isCompilationTimeoutError } from "./ydb/client.js";
import { verifyCollectionsQueryCompilationForStartup } from "./repositories/collectionsRepo.js";
import { logger } from "./logging/logger.js";
import { scheduleExit } from "./utils/exit.js";

export async function healthHandler(
    _req: Request,
    res: Response
): Promise<void> {
    const ok = await isYdbAvailable();
    if (!ok) {
        logger.error("YDB unavailable during health check");
        res.status(503).json({ status: "error", error: "YDB unavailable" });
        scheduleExit(1);
        return;
    }

    try {
        await verifyCollectionsQueryCompilationForStartup();
    } catch (err: unknown) {
        const isTimeout = isCompilationTimeoutError(err);
        logger.error(
            { err },
            isTimeout
                ? "YDB compilation timeout during health probe"
                : "YDB health probe failed"
        );
        res.status(503).json({
            status: "error",
            error: "YDB health probe failed",
        });
        scheduleExit(1);
        return;
    }

    res.json({ status: "ok" });
}

export function rootHandler(_req: Request, res: Response): void {
    const version = process.env.npm_package_version ?? "unknown";
    res.json({ title: "ydb-qdrant", version });
}

export function buildServer() {
    const app = express();
    app.use(requestLogger);
    app.use(upsertBodyTimeout);
    app.use(instrumentUpsertRequestBody);
    app.use(
        express.json({
            limit: "20mb",
            verify: verifyUpsertRequestBody,
        })
    );
    app.use(logUpsertBodyPhaseError);
    app.use(logUpsertBodyPhase);
    app.use(upsertProcessingTimeout);
    app.get("/", rootHandler);
    app.get("/health", healthHandler);
    app.use("/collections", collectionsRouter);
    app.use("/collections", pointsRouter);

    app.use(
        (
            err: unknown,
            req: Request,
            res: Response,
            next: NextFunction
        ): void => {
            if (!isRequestAbortedError(err)) {
                next(err);
                return;
            }

            // Client closed the connection while the request body was being read.
            // Avoid Express default handler printing a stacktrace to stderr.
            if (res.headersSent || res.writableEnded) {
                return;
            }
            res.status(400).json({ status: "error", error: "request aborted" });
        }
    );

    // Catch-all error handler: avoid Express default handler printing stacktraces to stderr
    // and provide consistent JSON error responses.
    app.use(
        (
            err: unknown,
            req: Request,
            res: Response,
            _next: NextFunction
        ): void => {
            void _next;

            if (res.headersSent || res.writableEnded) {
                if (shouldSuppressLateMiddlewareError(req, err)) {
                    return;
                }
                logger.error({ err }, "Late middleware error after response sent");
                return;
            }

            logger.error({ err }, "Unhandled error in Express middleware");

            const statusCode = extractHttpStatusCode(err) ?? 500;
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            res.status(statusCode).json({
                status: "error",
                error: errorMessage,
            });
        }
    );

    return app;
}

function isRequestAbortedError(err: unknown): boolean {
    if (!err || typeof err !== "object") {
        return false;
    }

    const typeValue =
        "type" in err && typeof err.type === "string" ? err.type : undefined;
    if (typeValue === "request.aborted") {
        return true;
    }

    if ("message" in err && typeof err.message === "string") {
        return err.message.includes("request aborted");
    }

    return false;
}

function isBodyParserRequestReadError(err: unknown): boolean {
    if (!err || typeof err !== "object") {
        return false;
    }

    const typeValue =
        "type" in err && typeof err.type === "string" ? err.type : undefined;
    if (!typeValue) {
        return false;
    }

    return (
        typeValue === "entity.parse.failed" ||
        typeValue === "entity.too.large" ||
        typeValue === "request.size.invalid" ||
        typeValue === "charset.unsupported" ||
        typeValue === "encoding.unsupported" ||
        typeValue === "stream.encoding.set" ||
        typeValue === "stream.not.readable"
    );
}

function shouldSuppressLateMiddlewareError(req: Request, err: unknown): boolean {
    if (isRequestAbortedError(err)) {
        return true;
    }

    return isUpsertRequestTimedOut(req) && isBodyParserRequestReadError(err);
}

function extractHttpStatusCode(err: unknown): number | undefined {
    if (!err || typeof err !== "object") {
        return undefined;
    }

    const obj = err as Record<string, unknown>;
    let statusCodeValue: number | undefined;
    if (typeof obj.statusCode === "number") {
        statusCodeValue = obj.statusCode;
    } else if (typeof obj.status === "number") {
        statusCodeValue = obj.status;
    }

    if (
        statusCodeValue === undefined ||
        !Number.isInteger(statusCodeValue) ||
        statusCodeValue < 400 ||
        statusCodeValue > 599
    ) {
        return undefined;
    }

    return statusCodeValue;
}
