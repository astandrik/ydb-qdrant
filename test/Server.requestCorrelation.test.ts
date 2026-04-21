import http from "node:http";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CapturedLog = {
    level: string;
    fields: Record<string, unknown>;
    message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

const mocks = vi.hoisted(() => ({
    logs: [] as CapturedLog[],
    routeHandler: vi.fn(),
}));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.logs.length = 0;
});

async function startServer(): Promise<{
    server: http.Server;
    baseUrl: string;
}> {
    vi.doMock("../src/logging/logger.js", async () => {
        const { getRequestContextLogFields } = await import(
            "../src/logging/requestContext.js"
        );

        function record(level: string) {
            return (arg0?: unknown, arg1?: unknown) => {
                const fields = isRecord(arg0) ? { ...arg0 } : {};
                const message =
                    typeof arg0 === "string"
                        ? arg0
                        : typeof arg1 === "string"
                        ? arg1
                        : undefined;

                mocks.logs.push({
                    level,
                    fields: {
                        ...fields,
                        ...getRequestContextLogFields(),
                    },
                    message,
                });
            };
        }

        return {
            logger: {
                info: record("info"),
                warn: record("warn"),
                error: record("error"),
                debug: record("debug"),
                fatal: record("fatal"),
            },
        };
    });

    vi.doMock("../src/routes/collections.js", () => ({
        collectionsRouter: express.Router(),
    }));

    vi.doMock("../src/routes/points.js", () => {
        const router = express.Router();
        router.post(
            "/:collection/points/delete",
            async (
                req: Request,
                res: Response,
                next: NextFunction
            ): Promise<void> => {
                await mocks.routeHandler(req, res, next);
            }
        );
        return { pointsRouter: router };
    });

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

async function stopServer(server: http.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
}

describe("request log correlation", () => {
    it("propagates request fields to route-level business logs", async () => {
        const { server, baseUrl } = await startServer();
        const requestId = "req-delete-123";
        const path = "/collections/ws-f1f23ce743708ee1/points/delete";

        mocks.routeHandler.mockImplementation(
            async (_req: Request, res: Response) => {
            const { logger } = await import("../src/logging/logger.js");
            logger.info(
                {
                    collection: "ws-f1f23ce743708ee1",
                    deleteRequestBody: {
                        filter: {
                            must: [
                                {
                                    key: "pathSegments.0",
                                    match: { value: "contrib" },
                                },
                            ],
                        },
                    },
                },
                "delete points request body"
            );
            res.json({ ok: true });
            }
        );

        try {
            const res = await httpRequest({
                baseUrl,
                method: "POST",
                path,
                headers: {
                    "content-type": "application/json",
                    "x-request-id": requestId,
                },
                body: JSON.stringify({
                    filter: {
                        must: [{ key: "pathSegments.0", match: { value: "contrib" } }],
                    },
                }),
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers["x-request-id"]).toBe(requestId);

            await vi.waitFor(() => {
                expect(
                    mocks.logs.find(
                        (log) => log.message === "delete points request body"
                    )
                ).toBeDefined();
            });

            const businessLog = mocks.logs.find(
                (log) => log.message === "delete points request body"
            );
            if (!businessLog) {
                throw new Error("expected route-level business log");
            }

            expect(businessLog.fields.requestId).toBe(requestId);
            expect(businessLog.fields.method).toBe("POST");
            expect(businessLog.fields.url).toBe(path);
            expect(businessLog.fields.collection).toBe("ws-f1f23ce743708ee1");
        } finally {
            await stopServer(server);
        }
    });

    it("replaces unsafe X-Request-Id values before echoing or logging", async () => {
        const { server, baseUrl } = await startServer();
        const unsafeRequestId = "bad request id";
        const path = "/collections/ws-f1f23ce743708ee1/points/delete";

        mocks.routeHandler.mockImplementation(
            async (_req: Request, res: Response) => {
                const { logger } = await import("../src/logging/logger.js");
                logger.info("delete points request body");
                res.json({ ok: true });
            }
        );

        try {
            const res = await httpRequest({
                baseUrl,
                method: "POST",
                path,
                headers: {
                    "content-type": "application/json",
                    "x-request-id": unsafeRequestId,
                },
                body: JSON.stringify({ filter: { must: [] } }),
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers["x-request-id"]).not.toBe(unsafeRequestId);
            expect(res.headers["x-request-id"]).toMatch(
                /^[0-9a-f-]{36}$/i
            );

            await vi.waitFor(() => {
                expect(
                    mocks.logs.find(
                        (log) => log.message === "delete points request body"
                    )
                ).toBeDefined();
            });

            const businessLog = mocks.logs.find(
                (log) => log.message === "delete points request body"
            );
            if (!businessLog) {
                throw new Error("expected route-level business log");
            }

            expect(businessLog.fields.requestId).toBe(
                res.headers["x-request-id"]
            );
        } finally {
            await stopServer(server);
        }
    });

    it("propagates request fields to the Express catch-all error log", async () => {
        const { server, baseUrl } = await startServer();
        const requestId = "req-error-456";
        const path = "/collections/ws-f1f23ce743708ee1/points/delete";

        mocks.routeHandler.mockImplementation(() => {
            throw new Error("kaboom");
        });

        try {
            const res = await httpRequest({
                baseUrl,
                method: "POST",
                path,
                headers: {
                    "content-type": "application/json",
                    "x-request-id": requestId,
                },
                body: JSON.stringify({}),
            });

            expect(res.statusCode).toBe(500);
            expect(res.headers["x-request-id"]).toBe(requestId);

            await vi.waitFor(() => {
                expect(
                    mocks.logs.find(
                        (log) =>
                            log.message === "Unhandled error in Express middleware"
                    )
                ).toBeDefined();
            });

            const errorLog = mocks.logs.find(
                (log) => log.message === "Unhandled error in Express middleware"
            );
            if (!errorLog) {
                throw new Error("expected catch-all Express error log");
            }

            expect(errorLog.fields.requestId).toBe(requestId);
            expect(errorLog.fields.method).toBe("POST");
            expect(errorLog.fields.url).toBe(path);
            expect(errorLog.fields.err).toBeInstanceOf(Error);
        } finally {
            await stopServer(server);
        }
    });
});
