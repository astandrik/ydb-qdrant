import { PassThrough } from "node:stream";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import {
    elapsedMsSince,
    getElapsedMsSinceRequestStart,
    getRequestContextLogFields,
    getMonotonicTimeNs,
    runWithRequestContext,
    type RequestContext,
} from "../../src/logging/requestContext.js";

function createCaptureLogger() {
    const stream = new PassThrough();
    const lines: string[] = [];
    let buffered = "";

    stream.on("data", (chunk: Buffer | string) => {
        buffered += chunk.toString();

        let newlineIndex: number;
        while ((newlineIndex = buffered.indexOf("\n")) !== -1) {
            const line = buffered.slice(0, newlineIndex);
            buffered = buffered.slice(newlineIndex + 1);

            if (line.trim().length > 0) {
                lines.push(line);
            }
        }
    });

    const logger = pino(
        {
            mixin() {
                return getRequestContextLogFields();
            },
        },
        stream
    );

    return { logger, lines };
}

describe("request log context", () => {
    it("adds request fields only for logs emitted inside request context", async () => {
        const { logger, lines } = createCaptureLogger();
        const requestContext: RequestContext = {
            requestId: "req-123",
            method: "POST",
            url: "/collections/demo/points/delete",
            traceparent:
                "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
            amznTraceId: "Root=1-67891233-abcdef012345678912345678",
            requestStartNs: getMonotonicTimeNs(),
        };

        logger.info({ event: "outside" }, "outside");

        await runWithRequestContext(requestContext, async () => {
            await Promise.resolve();
            logger.info({ event: "inside" }, "inside");
        });

        await vi.waitFor(() => {
            expect(lines).toHaveLength(2);
        });

        const outsideLog = JSON.parse(lines[0]) as Record<string, unknown>;
        const insideLog = JSON.parse(lines[1]) as Record<string, unknown>;

        expect(outsideLog.event).toBe("outside");
        expect(outsideLog.requestId).toBeUndefined();
        expect(outsideLog.method).toBeUndefined();
        expect(outsideLog.url).toBeUndefined();
        expect(outsideLog.traceparent).toBeUndefined();
        expect(outsideLog.amznTraceId).toBeUndefined();
        expect(outsideLog.requestStartNs).toBeUndefined();

        expect(insideLog.event).toBe("inside");
        expect(insideLog.requestId).toBe(requestContext.requestId);
        expect(insideLog.method).toBe(requestContext.method);
        expect(insideLog.url).toBe(requestContext.url);
        expect(insideLog.traceparent).toBe(requestContext.traceparent);
        expect(insideLog.amznTraceId).toBe(requestContext.amznTraceId);
        expect(insideLog.requestStartNs).toBeUndefined();
    });

    it("computes request-relative elapsed time without exposing internal start fields", async () => {
        const startNs = getMonotonicTimeNs();
        const requestContext: RequestContext = {
            requestId: "req-456",
            method: "PUT",
            url: "/collections/demo/points",
            requestStartNs: startNs,
        };

        await runWithRequestContext(requestContext, async () => {
            await Promise.resolve();
            expect(typeof getElapsedMsSinceRequestStart()).toBe("number");
            expect(typeof elapsedMsSince(startNs)).toBe("number");
            expect(getRequestContextLogFields()).toEqual({
                requestId: "req-456",
                method: "PUT",
                url: "/collections/demo/points",
            });
        });
    });
});
