import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../logging/logger.js";
import {
    getUpsertRequestTimeoutPhase,
    getUpsertRequestTimeoutMs,
    isUpsertRequestTimedOut,
} from "./upsertRequestTimeout.js";
import { getUpsertBodyPhaseTimeoutLogFields } from "./upsertBodyPhase.js";
import {
    runWithRequestContext,
    type RequestContext,
    getMonotonicTimeNs,
} from "../logging/requestContext.js";

const MAX_REQUEST_ID_LENGTH = 128;
const SAFE_REQUEST_ID_RE = /^[A-Za-z0-9._:-]+$/;

function normalizeRequestId(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    if (!trimmed) {
        return undefined;
    }
    if (trimmed.length > MAX_REQUEST_ID_LENGTH) {
        return undefined;
    }
    return SAFE_REQUEST_ID_RE.test(trimmed) ? trimmed : undefined;
}

function parseClientIpFromXForwardedFor(
    value: string | undefined
): string | undefined {
    if (!value) {
        return undefined;
    }
    const first = value.split(",")[0]?.trim();
    return first && first.length > 0 ? first : undefined;
}

function parseXForwardedForChainLen(value: string | undefined): number {
    if (!value) {
        return 0;
    }
    return value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0).length;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const traceparent = req.header("traceparent") ?? undefined;
    const amznTraceId = req.header("X-Amzn-Trace-Id") ?? undefined;
    const requestIdFromHeader = normalizeRequestId(
        req.header("X-Request-Id") ?? undefined
    );
    const requestId = requestIdFromHeader ?? randomUUID();
    res.setHeader("X-Request-Id", requestId);
    const userAgent = req.header("User-Agent") ?? undefined;
    const { method, originalUrl } = req;
    const requestContext: RequestContext = {
        requestId,
        method,
        url: originalUrl,
        traceparent,
        amznTraceId,
        requestStartNs: getMonotonicTimeNs(),
    };

    const contentLength = req.header("content-length");
    const xForwardedFor = req.header("x-forwarded-for");
    const queryKeys = Object.keys(req.query || {});
    let finished = false;
    let aborted = false;
    let closedLogged = false;

    runWithRequestContext(requestContext, () => {
        logger.info(
            {
                userAgent,
                contentLength,
                clientIp:
                    parseClientIpFromXForwardedFor(xForwardedFor) ??
                    req.socket.remoteAddress ??
                    undefined,
                ipChainLen: parseXForwardedForChainLen(xForwardedFor),
                hasXForwardedFor: xForwardedFor !== undefined,
                queryKeys,
            },
            "req"
        );

        req.on("aborted", () => {
            aborted = true;
        });

        res.on("finish", () => {
            runWithRequestContext(requestContext, () => {
                finished = true;
                const ms = Date.now() - start;
                const timeoutMs = getUpsertRequestTimeoutMs(req);
                const timeoutPhase = getUpsertRequestTimeoutPhase(req);
                if (isUpsertRequestTimedOut(req) && timeoutMs !== undefined) {
                    logger.warn(
                        {
                            userAgent,
                            contentLength,
                            status: res.statusCode,
                            ms,
                            bytesRead: req.socket.bytesRead,
                            timeoutMs,
                            timeoutPhase,
                            ...getUpsertBodyPhaseTimeoutLogFields(req),
                        },
                        "req timed out"
                    );
                    return;
                }
                const payload = {
                    userAgent,
                    status: res.statusCode,
                    ms,
                };

                if (res.statusCode >= 500) {
                    logger.error(payload, "res");
                    return;
                }
                if (res.statusCode >= 300) {
                    logger.warn(payload, "res");
                    return;
                }
                logger.info(payload, "res");
            });
        });

        res.on("close", () => {
            runWithRequestContext(requestContext, () => {
                if (finished || closedLogged) {
                    return;
                }
                closedLogged = true;

                const ms = Date.now() - start;
                const bytesRead = req.socket.bytesRead;
                const payload = {
                    userAgent,
                    contentLength,
                    status: res.statusCode,
                    ms,
                    bytesRead,
                    aborted,
                };

                const timeoutMs = getUpsertRequestTimeoutMs(req);
                const timeoutPhase = getUpsertRequestTimeoutPhase(req);
                if (isUpsertRequestTimedOut(req) && timeoutMs !== undefined) {
                    logger.warn(
                        {
                            ...payload,
                            timeoutMs,
                            timeoutPhase,
                            ...getUpsertBodyPhaseTimeoutLogFields(req),
                        },
                        "req timed out"
                    );
                    return;
                }

                if (aborted) {
                    logger.warn(payload, "req aborted");
                    return;
                }
                logger.warn(payload, "req closed before response finished");
            });
        });

        next();
    });
}
