import type { NextFunction, Request, Response } from "express";
import {
    UPSERT_BODY_TIMEOUT_MS,
    UPSERT_HTTP_TIMEOUT_MS,
} from "../config/env.js";

const UPSERT_REQUEST_TIMEOUT_STATE = Symbol("upsertRequestTimeoutState");
const RETRY_AFTER_SECONDS = "1";
const TIMEOUT_ERROR_MESSAGE = "upsert request timed out";
const UPSERT_POINTS_PATH_RE = /^\/collections\/[^/]+\/points\/?$/;
const UPSERT_POINTS_ALIAS_PATH_RE = /^\/collections\/[^/]+\/points\/upsert\/?$/;

export type UpsertTimeoutPhase = "body" | "parse" | "processing";

type UpsertRequestTimeoutState = {
    timedOut: boolean;
    timeoutMs?: number;
    timeoutPhase?: UpsertTimeoutPhase;
    // These callbacks must survive markUpsertRequestTimedOut() so late cleanup
    // can still clear the armed timer on the existing state object.
    clearBodyTimeout?: () => void;
    clearProcessingTimeout?: () => void;
};

type TimeoutAwareRequest = Request & {
    [UPSERT_REQUEST_TIMEOUT_STATE]?: UpsertRequestTimeoutState;
};

function asTimeoutAwareRequest(req: Request): TimeoutAwareRequest {
    return req as TimeoutAwareRequest;
}

function getRequestPath(req: Request): string {
    const originalUrl = req.originalUrl;
    if (typeof originalUrl !== "string" || originalUrl.length === 0) {
        return "";
    }
    return originalUrl.split("?", 1)[0] ?? "";
}

function getOrCreateTimeoutState(req: Request): UpsertRequestTimeoutState {
    const request = asTimeoutAwareRequest(req);
    request[UPSERT_REQUEST_TIMEOUT_STATE] ??= {
        timedOut: false,
    };
    return request[UPSERT_REQUEST_TIMEOUT_STATE];
}

function getTimeoutState(req: Request): UpsertRequestTimeoutState | undefined {
    return asTimeoutAwareRequest(req)[UPSERT_REQUEST_TIMEOUT_STATE];
}

export function isUpsertRequestTarget(req: Request): boolean {
    const path = getRequestPath(req);
    if (req.method === "PUT") {
        return UPSERT_POINTS_PATH_RE.test(path);
    }
    if (req.method === "POST") {
        return UPSERT_POINTS_ALIAS_PATH_RE.test(path);
    }
    return false;
}

export function markUpsertRequestTimedOut(
    req: Request,
    timeoutMs: number,
    timeoutPhase: UpsertTimeoutPhase
): void {
    const state = getOrCreateTimeoutState(req);
    // Preserve armed clear callbacks on the existing state object.
    state.timedOut = true;
    state.timeoutMs = timeoutMs;
    state.timeoutPhase = timeoutPhase;
}

export function isUpsertRequestTimedOut(req: Request): boolean {
    return getTimeoutState(req)?.timedOut === true;
}

export function getUpsertRequestTimeoutMs(req: Request): number | undefined {
    return getTimeoutState(req)?.timeoutMs;
}

export function getUpsertRequestTimeoutPhase(
    req: Request
): UpsertTimeoutPhase | undefined {
    return getTimeoutState(req)?.timeoutPhase;
}

function clearUpsertTimeout(req: Request, phase: UpsertTimeoutPhase): void {
    const state = getTimeoutState(req);
    if (!state) {
        return;
    }

    const clearFn =
        phase === "body" ? state.clearBodyTimeout : state.clearProcessingTimeout;
    if (clearFn) {
        clearFn();
    }

    if (phase === "body") {
        state.clearBodyTimeout = undefined;
        return;
    }
    state.clearProcessingTimeout = undefined;
}

function closeSocketAfterResponse(res: Response): void {
    const socket = res.socket;
    if (!socket || socket.destroyed) {
        return;
    }
    if (typeof socket.destroySoon === "function") {
        socket.destroySoon();
        return;
    }
    socket.end();
    const forceDestroyTimer = setTimeout(() => {
        if (!socket.destroyed) {
            socket.destroy();
        }
    }, 50);
    forceDestroyTimer.unref?.();
}

export function respondUpsertRequestTimedOut(args: {
    req: Request;
    res: Response;
    timeoutMs: number;
    timeoutPhase: UpsertTimeoutPhase;
}): boolean {
    const state = getOrCreateTimeoutState(args.req);
    if (args.res.headersSent || args.res.writableEnded || state.timedOut) {
        return false;
    }

    clearUpsertTimeout(
        args.req,
        args.timeoutPhase === "processing" ? "processing" : "body"
    );
    markUpsertRequestTimedOut(args.req, args.timeoutMs, args.timeoutPhase);
    args.res.setHeader("Retry-After", RETRY_AFTER_SECONDS);
    args.res.setHeader("Connection", "close");
    args.res.status(503).json({
        status: "error",
        error: TIMEOUT_ERROR_MESSAGE,
    });
    args.res.once("finish", () => {
        closeSocketAfterResponse(args.res);
    });
    return true;
}

function installUpsertTimeout(args: {
    req: Request;
    res: Response;
    timeoutMs: number;
    timeoutPhase: UpsertTimeoutPhase;
}): void {
    if (args.timeoutMs <= 0) {
        return;
    }

    const state = getOrCreateTimeoutState(args.req);
    let timer: NodeJS.Timeout | undefined;

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
    };

    timer = setTimeout(() => {
        respondUpsertRequestTimedOut(args);
    }, args.timeoutMs);
    timer.unref?.();

    args.res.once("finish", clearTimer);
    args.res.once("close", clearTimer);

    if (args.timeoutPhase === "body") {
        state.clearBodyTimeout = clearTimer;
        return;
    }
    state.clearProcessingTimeout = clearTimer;
}

export function markUpsertBodyPhaseCompleted(req: Request): void {
    clearUpsertTimeout(req, "body");
}

export function upsertBodyTimeout(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!isUpsertRequestTarget(req)) {
        next();
        return;
    }

    installUpsertTimeout({
        req,
        res,
        timeoutMs: UPSERT_BODY_TIMEOUT_MS,
        timeoutPhase: "body",
    });
    next();
}

export function upsertProcessingTimeout(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!isUpsertRequestTarget(req)) {
        next();
        return;
    }

    if (res.headersSent || res.writableEnded) {
        return;
    }

    installUpsertTimeout({
        req,
        res,
        timeoutMs: UPSERT_HTTP_TIMEOUT_MS,
        timeoutPhase: "processing",
    });
    next();
}
