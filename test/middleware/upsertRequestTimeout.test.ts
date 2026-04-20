import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createUpsertRequest(): Request {
    return {
        method: "PUT",
        originalUrl: "/collections/col/points?wait=true",
    } as Request;
}

function createResponse(args?: {
    headersSent?: boolean;
    writableEnded?: boolean;
}): Response {
    const res = {
        headersSent: args?.headersSent ?? false,
        writableEnded: args?.writableEnded ?? false,
        once: vi.fn(),
        setHeader: vi.fn(),
        status: vi.fn(),
        json: vi.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return {
        ...res,
    } as unknown as Response;
}

describe("upsertRequestTimeout", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.YDB_QDRANT_ENDPOINT = "grpc://localhost:2136";
        process.env.YDB_QDRANT_DATABASE = "/local";
        process.env.YDB_ENDPOINT = "";
        process.env.YDB_DATABASE = "";
    });

    afterEach(() => {
        delete process.env.YDB_QDRANT_ENDPOINT;
        delete process.env.YDB_QDRANT_DATABASE;
        delete process.env.YDB_QDRANT_UPSERT_BODY_TIMEOUT_MS;
        delete process.env.YDB_QDRANT_UPSERT_HTTP_TIMEOUT_MS;
        vi.useRealTimers();
    });

    it("clears the armed body timer even after the request is marked timed out", async () => {
        vi.useFakeTimers();
        process.env.YDB_QDRANT_UPSERT_BODY_TIMEOUT_MS = "1000";

        const {
            markUpsertBodyPhaseCompleted,
            markUpsertRequestTimedOut,
            upsertBodyTimeout,
        } =
            await import("../../src/middleware/upsertRequestTimeout.js");
        const req = createUpsertRequest();
        const res = createResponse();
        const next = vi.fn() as unknown as NextFunction;

        upsertBodyTimeout(req, res, next);
        markUpsertRequestTimedOut(req, 1000, "body");
        expect(() => markUpsertBodyPhaseCompleted(req)).not.toThrow();
        expect(() => markUpsertBodyPhaseCompleted(req)).not.toThrow();

        await vi.advanceTimersByTimeAsync(1000);

        expect(next).toHaveBeenCalledTimes(1);
        expect(
            (res as unknown as { setHeader: ReturnType<typeof vi.fn> }).setHeader
        ).not.toHaveBeenCalled();
        expect(
            (res as unknown as { status: ReturnType<typeof vi.fn> }).status
        ).not.toHaveBeenCalled();
        expect(
            (res as unknown as { json: ReturnType<typeof vi.fn> }).json
        ).not.toHaveBeenCalled();
    });

    it("does not arm a processing timer when the processing timeout is disabled", async () => {
        vi.useFakeTimers();
        process.env.YDB_QDRANT_UPSERT_HTTP_TIMEOUT_MS = "0";

        const { upsertProcessingTimeout } = await import(
            "../../src/middleware/upsertRequestTimeout.js"
        );
        const req = createUpsertRequest();
        const res = createResponse();
        const next = vi.fn() as unknown as NextFunction;

        upsertProcessingTimeout(req, res, next);
        await vi.advanceTimersByTimeAsync(5000);

        expect(next).toHaveBeenCalledTimes(1);
        expect(
            (res as unknown as { once: ReturnType<typeof vi.fn> }).once
        ).not.toHaveBeenCalled();
        expect(
            (res as unknown as { setHeader: ReturnType<typeof vi.fn> }).setHeader
        ).not.toHaveBeenCalled();
        expect(
            (res as unknown as { status: ReturnType<typeof vi.fn> }).status
        ).not.toHaveBeenCalled();
        expect(
            (res as unknown as { json: ReturnType<typeof vi.fn> }).json
        ).not.toHaveBeenCalled();
    });

    it("does not call next when the response has already started", async () => {
        const { upsertProcessingTimeout } = await import(
            "../../src/middleware/upsertRequestTimeout.js"
        );
        const req = createUpsertRequest();
        const res = createResponse({ headersSent: true });
        const next = vi.fn() as unknown as NextFunction;

        upsertProcessingTimeout(req, res, next);

        expect(next).not.toHaveBeenCalled();
    });
});
