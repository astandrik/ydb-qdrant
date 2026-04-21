import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "../../src/logging/requestContext.js";
import {
    getUpsertBodyPhaseTimeoutLogFields,
    logUpsertBodyPhase,
    logUpsertBodyPhaseError,
    verifyUpsertRequestBody,
} from "../../src/middleware/upsertBodyPhase.js";
import { markUpsertRequestTimedOut } from "../../src/middleware/upsertRequestTimeout.js";

const loggerMocks = vi.hoisted(() => ({
    info: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    warn: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    error: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    debug: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    fatal: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
}));

vi.mock("../../src/logging/logger.js", () => ({
    logger: loggerMocks,
}));

function createUpsertRequest(): Request {
    return {
        method: "PUT",
        originalUrl: "/collections/col/points?wait=true",
        header(name: string) {
            return name.toLowerCase() === "content-length" ? "64" : undefined;
        },
    } as unknown as Request;
}

describe("upsertBodyPhase", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("preserves completed parse diagnostics when body timeout fires before the body-phase log", () => {
        const req = createUpsertRequest();
        const res = {} as Response;
        const next = vi.fn() as unknown as NextFunction;
        const body = Buffer.from(
            JSON.stringify({
                points: [{ id: "p1", vector: [0, 1, 2, 3], payload: {} }],
            })
        );

        runWithRequestContext(
            {
                requestId: "req-1",
                method: req.method,
                url: req.originalUrl,
                requestStartNs: process.hrtime.bigint(),
            },
            () => {
                verifyUpsertRequestBody(req, res, body);
                markUpsertRequestTimedOut(req, 1000, "body");
                logUpsertBodyPhase(req, res, next);
                const timeoutFields = getUpsertBodyPhaseTimeoutLogFields(req);

                expect(timeoutFields).toEqual(
                    expect.objectContaining({
                        parsedBodyBytes: body.byteLength,
                        bodyParseCompleted: true,
                        bodyPhaseLogged: false,
                    })
                );
                expect(typeof timeoutFields.timeToBodyBufferedMs).toBe("number");
                expect(typeof timeoutFields.timeToBodyParsedMs).toBe("number");
            }
        );
        expect(loggerMocks.info).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("suppresses duplicate body-phase warning after timeout and forwards the late error", () => {
        const req = createUpsertRequest();
        const res = {} as Response;
        const next = vi.fn() as unknown as NextFunction;
        const err = Object.assign(new Error("request aborted"), {
            type: "request.aborted",
            status: 400,
        });

        runWithRequestContext(
            {
                requestId: "req-2",
                method: req.method,
                url: req.originalUrl,
                requestStartNs: process.hrtime.bigint(),
            },
            () => {
                markUpsertRequestTimedOut(req, 1000, "body");
                logUpsertBodyPhaseError(err, req, res, next);
            }
        );

        expect(loggerMocks.warn).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledWith(err);
    });
});
