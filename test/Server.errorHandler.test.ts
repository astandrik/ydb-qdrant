import http from "node:http";
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";

const loggerInfoMock = vi.fn();
const loggerWarnMock = vi.fn();
const loggerErrorMock = vi.fn();
const routeHandlerMock = vi.hoisted(() => vi.fn());

vi.mock("../src/logging/logger.js", () => ({
    logger: {
        info: (...args: unknown[]) => {
            loggerInfoMock(...args);
        },
        warn: (...args: unknown[]) => {
            loggerWarnMock(...args);
        },
        error: (...args: unknown[]) => {
            loggerErrorMock(...args);
        },
        debug: vi.fn(),
    },
}));

vi.mock("../src/middleware/requestLogger.js", () => ({
    requestLogger: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../src/routes/collections.js", () => ({
    collectionsRouter: express.Router(),
}));

vi.mock("../src/routes/points.js", () => ({
    pointsRouter: (() => {
        const router = express.Router();
        router.post(
            "/:collection/points/upsert",
            async (
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ): Promise<void> => {
                await routeHandlerMock(req, res, next);
            }
        );
        return router;
    })(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    routeHandlerMock.mockReset();
    // buildServer() is imported dynamically; ensure a fresh import per test.
    vi.resetModules();
});

async function startServer(): Promise<{
    server: http.Server;
    baseUrl: string;
}> {
    const { buildServer } = await import("../src/server.js");
    const app = buildServer();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("unexpected server address");
    }

    return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function httpRequest(params: {
    baseUrl: string;
    method: "POST";
    path: string;
    headers?: Record<string, string>;
    body?: string;
}): Promise<{
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: string;
}> {
    const url = new URL(params.path, params.baseUrl);

    return await new Promise((resolve, reject) => {
        const req = http.request(
            url,
            {
                method: params.method,
                headers: params.headers,
            },
            (res) => {
                const chunks: string[] = [];
                res.setEncoding("utf8");
                res.on("data", (chunk: string) => chunks.push(chunk));
                res.on("end", () => {
                    resolve({
                        statusCode: res.statusCode ?? 0,
                        headers: res.headers,
                        body: chunks.join(""),
                    });
                });
            }
        );

        req.on("error", reject);
        if (params.body !== undefined) {
            req.write(params.body);
        }
        req.end();
    });
}

describe("buildServer() error handling", () => {
    it("returns JSON error response for invalid JSON bodies (and preserves 400)", async () => {
        const { server, baseUrl } = await startServer();
        try {
            const res = await httpRequest({
                baseUrl,
                method: "POST",
                path: "/collections/col/points/search",
                headers: {
                    "content-type": "application/json",
                },
                body: "{",
            });

            expect(res.statusCode).toBe(400);
            expect(String(res.headers["content-type"])).toContain(
                "application/json"
            );

            const parsed = JSON.parse(res.body) as {
                status?: unknown;
                error?: unknown;
            };
            expect(parsed.status).toBe("error");
            expect(typeof parsed.error).toBe("string");

            expect(loggerErrorMock).toHaveBeenCalled();
        } finally {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            });
        }
    });

    it("logs upsert body-phase failure for malformed JSON without changing the 400 response", async () => {
        const invalidBody = "{";
        const expectedBodyBytes = Buffer.byteLength(invalidBody);
        vi.doUnmock("../src/middleware/requestLogger.js");
        const { server, baseUrl } = await startServer();
        try {
            const res = await httpRequest({
                baseUrl,
                method: "POST",
                path: "/collections/col/points/upsert",
                headers: {
                    "content-type": "application/json",
                },
                body: invalidBody,
            });

            expect(res.statusCode).toBe(400);
            const parsed = JSON.parse(res.body) as {
                status?: unknown;
                error?: unknown;
            };
            expect(parsed.status).toBe("error");
            expect(typeof parsed.error).toBe("string");

            const bodyPhaseFailurePayload = loggerWarnMock.mock.calls.find(
                (call) => call[1] === "upsert: body phase failed"
            )?.[0] as Record<string, unknown> | undefined;

            expect(bodyPhaseFailurePayload).toEqual(
                expect.objectContaining({
                    phase: "upsertBody",
                    bodyErrorType: "entity.parse.failed",
                    bodyErrorStatus: 400,
                    observedBodyBytes: expectedBodyBytes,
                    parsedBodyBytes: expectedBodyBytes,
                })
            );
            expect(typeof bodyPhaseFailurePayload?.timeToBodyBufferedMs).toBe(
                "number"
            );
            expect(bodyPhaseFailurePayload?.timeToBodyParsedMs).toBeUndefined();
            expect(
                loggerInfoMock.mock.calls.some(
                    (call) => call[1] === "upsert: body phase"
                )
            ).toBe(false);
        } finally {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            });
        }
    });

    it("suppresses late body-parser noise after an upsert timeout response has already been sent", async () => {
        routeHandlerMock.mockImplementation(
            async (
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) => {
                const { markUpsertRequestTimedOut } = await import(
                    "../src/middleware/upsertRequestTimeout.js"
                );
                markUpsertRequestTimedOut(req, 1000, "processing");
                res.status(503).json({
                    status: "error",
                    error: "upsert request timed out",
                });
                next(
                    Object.assign(new Error("request entity too large"), {
                        type: "entity.too.large",
                        status: 413,
                    })
                );
            }
        );

        const { server, baseUrl } = await startServer();
        try {
            const res = await httpRequest({
                baseUrl,
                method: "POST",
                path: "/collections/col/points/upsert",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({}),
            });

            expect(res.statusCode).toBe(503);
            expect(JSON.parse(res.body)).toEqual({
                status: "error",
                error: "upsert request timed out",
            });
            expect(loggerErrorMock).not.toHaveBeenCalled();
        } finally {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            });
        }
    });

    it("logs generic late middleware errors even when the response was already sent", async () => {
        routeHandlerMock.mockImplementation(
            (
                _req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) => {
                res.status(204).end();
                setImmediate(() => {
                    next(new Error("late boom"));
                });
            }
        );

        const { server, baseUrl } = await startServer();
        try {
            const res = await httpRequest({
                baseUrl,
                method: "POST",
                path: "/collections/col/points/upsert",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({}),
            });

            expect(res.statusCode).toBe(204);
            await vi.waitFor(() => {
                expect(
                    loggerErrorMock.mock.calls.some(
                        (call) =>
                            call[1] === "Late middleware error after response sent"
                    )
                ).toBe(true);
            });
        } finally {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            });
        }
    });
});
