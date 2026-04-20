import type { NextFunction, Request, Response } from "express";
import { UPSERT_BODY_TIMEOUT_MS } from "../config/env.js";
import { logger } from "../logging/logger.js";
import {
    elapsedMsBetween,
    elapsedMsFromRequestStart,
    getRequestStartNs,
    getMonotonicTimeNs,
} from "../logging/requestContext.js";
import {
    isUpsertRequestTarget,
    isUpsertRequestTimedOut,
    markUpsertBodyPhaseCompleted,
    respondUpsertRequestTimedOut,
} from "./upsertRequestTimeout.js";

const UPSERT_BODY_PHASE_STATE = Symbol("upsertBodyPhaseState");

type UpsertBodyPhaseState = {
    observedBodyBytes: number;
    parsedBodyBytes?: number;
    firstChunkAtNs?: bigint;
    bodyBufferedAtNs?: bigint;
    bodyParsedAtNs?: bigint;
    bodyParseCompleted: boolean;
    bodyPhaseLogged: boolean;
};

type UpsertBodyAwareRequest = Request & {
    [UPSERT_BODY_PHASE_STATE]?: UpsertBodyPhaseState;
};

function asUpsertBodyAwareRequest(req: Request): UpsertBodyAwareRequest {
    return req as UpsertBodyAwareRequest;
}

function getUpsertBodyPhaseState(
    req: Request
): UpsertBodyPhaseState | undefined {
    return asUpsertBodyAwareRequest(req)[UPSERT_BODY_PHASE_STATE];
}

function getOrCreateUpsertBodyPhaseState(req: Request): UpsertBodyPhaseState {
    const request = asUpsertBodyAwareRequest(req);
    request[UPSERT_BODY_PHASE_STATE] ??= {
        observedBodyBytes: 0,
        bodyParseCompleted: false,
        bodyPhaseLogged: false,
    };
    return request[UPSERT_BODY_PHASE_STATE];
}

function appendObservedBodyBytes(state: UpsertBodyPhaseState, chunk: unknown): void {
    if (typeof chunk === "string") {
        state.observedBodyBytes += Buffer.byteLength(chunk);
        return;
    }
    if (chunk instanceof Uint8Array) {
        state.observedBodyBytes += chunk.byteLength;
    }
}

function parseContentLength(req: Request): number | undefined {
    const raw = req.header("content-length");
    if (!raw) {
        return undefined;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function buildUpsertBodyPhaseLogFields(
    req: Request,
    state: UpsertBodyPhaseState
): Record<string, unknown> {
    const timeToBodyParsedMs = elapsedMsFromRequestStart(state.bodyParsedAtNs);
    const timeToBodyBufferedMs = elapsedMsFromRequestStart(
        state.bodyBufferedAtNs
    );
    const timeToFirstChunkMs = elapsedMsFromRequestStart(state.firstChunkAtNs);
    const bodyReadMs =
        state.firstChunkAtNs !== undefined && state.bodyBufferedAtNs !== undefined
            ? elapsedMsBetween(state.firstChunkAtNs, state.bodyBufferedAtNs)
            : undefined;
    const jsonParseMs =
        state.bodyBufferedAtNs !== undefined && state.bodyParsedAtNs !== undefined
            ? elapsedMsBetween(state.bodyBufferedAtNs, state.bodyParsedAtNs)
            : undefined;

    return {
        phase: "upsertBody",
        timeToFirstChunkMs,
        timeToBodyBufferedMs,
        timeToBodyParsedMs,
        bodyReadMs,
        jsonParseMs,
        observedBodyBytes: state.observedBodyBytes,
        parsedBodyBytes: state.parsedBodyBytes,
        bodyParseCompleted: state.bodyParseCompleted,
        contentLength: parseContentLength(req),
    };
}

function didBodyBudgetExpire(state: UpsertBodyPhaseState): boolean {
    if (UPSERT_BODY_TIMEOUT_MS <= 0 || state.bodyParsedAtNs === undefined) {
        return false;
    }

    const requestStartNs = getRequestStartNs();
    if (requestStartNs === undefined) {
        return false;
    }

    return (
        state.bodyParsedAtNs - requestStartNs >=
        BigInt(UPSERT_BODY_TIMEOUT_MS) * 1000000n
    );
}

function extractBodyErrorType(err: unknown): string | undefined {
    if (!err || typeof err !== "object") {
        return undefined;
    }

    return "type" in err && typeof err.type === "string" ? err.type : undefined;
}

function extractBodyErrorStatus(err: unknown): number | undefined {
    if (!err || typeof err !== "object") {
        return undefined;
    }

    if ("statusCode" in err && typeof err.statusCode === "number") {
        return err.statusCode;
    }

    return "status" in err && typeof err.status === "number"
        ? err.status
        : undefined;
}

export function instrumentUpsertRequestBody(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!isUpsertRequestTarget(req)) {
        next();
        return;
    }

    const state = getOrCreateUpsertBodyPhaseState(req);

    // This must stay immediately before express.json() and call next()
    // synchronously: attaching a "data" listener switches the request stream
    // into flowing mode before body-parser attaches its own listeners.
    req.on("data", (chunk: unknown) => {
        if (state.firstChunkAtNs === undefined) {
            state.firstChunkAtNs = getMonotonicTimeNs();
        }
        appendObservedBodyBytes(state, chunk);
    });

    next();
}

export function verifyUpsertRequestBody(
    req: Request,
    _res: Response,
    buf: Buffer
): void {
    if (!isUpsertRequestTarget(req)) {
        return;
    }

    const state = getOrCreateUpsertBodyPhaseState(req);
    state.bodyBufferedAtNs = getMonotonicTimeNs();
    state.parsedBodyBytes = buf.byteLength;
    markUpsertBodyPhaseCompleted(req);
}

export function logUpsertBodyPhase(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!isUpsertRequestTarget(req)) {
        next();
        return;
    }

    const state = getUpsertBodyPhaseState(req);
    if (!state || state.bodyPhaseLogged) {
        next();
        return;
    }

    if (isUpsertRequestTimedOut(req)) {
        // Timeout response already went out. Preserve parse timing for the
        // timeout log path, but suppress the normal success log and stop here.
        state.bodyParsedAtNs = getMonotonicTimeNs();
        state.bodyParseCompleted = true;
        markUpsertBodyPhaseCompleted(req);
        return;
    }

    state.bodyParsedAtNs = getMonotonicTimeNs();
    state.bodyParseCompleted = true;

    if (didBodyBudgetExpire(state)) {
        respondUpsertRequestTimedOut({
            req,
            res,
            timeoutMs: UPSERT_BODY_TIMEOUT_MS,
            timeoutPhase: "parse",
        });
        return;
    }

    state.bodyPhaseLogged = true;

    logger.info(buildUpsertBodyPhaseLogFields(req, state), "upsert: body phase");
    next();
}

export function logUpsertBodyPhaseError(
    err: unknown,
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!isUpsertRequestTarget(req)) {
        next(err);
        return;
    }

    const state = getUpsertBodyPhaseState(req);
    if (!state || state.bodyPhaseLogged) {
        next(err);
        return;
    }

    if (isUpsertRequestTimedOut(req)) {
        markUpsertBodyPhaseCompleted(req);
        next(err);
        return;
    }

    state.bodyPhaseLogged = true;
    markUpsertBodyPhaseCompleted(req);

    logger.warn(
        {
            ...buildUpsertBodyPhaseLogFields(req, state),
            bodyErrorType: extractBodyErrorType(err),
            bodyErrorStatus: extractBodyErrorStatus(err),
        },
        "upsert: body phase failed"
    );
    next(err);
}

export function getUpsertBodyPhaseTimeoutLogFields(
    req: Request
): Record<string, unknown> {
    if (!isUpsertRequestTarget(req)) {
        return {};
    }

    const state = getUpsertBodyPhaseState(req);
    if (!state) {
        return {};
    }

    return {
        ...buildUpsertBodyPhaseLogFields(req, state),
        bodyPhaseLogged: state.bodyPhaseLogged,
    };
}
