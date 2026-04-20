import type { Request, Response } from "express";

export type RouteHandler = (req: Request, res: Response) => unknown;

export type Layer = {
    route?: {
        path?: string;
        methods?: Record<string, boolean>;
        stack?: Array<{ handle: RouteHandler }>;
    };
};

export function findHandler(
    router: unknown,
    method: "get" | "put" | "post" | "delete",
    path: string
): RouteHandler {
    const stack = (router as { stack: Layer[] }).stack;
    const layer = stack.find(
        (entry) => entry.route?.path === path && entry.route.methods?.[method]
    );
    if (!layer?.route?.stack?.[0]?.handle) {
        throw new Error(
            `Route handler for ${method.toUpperCase()} ${path} not found`
        );
    }
    return layer.route.stack[0].handle;
}

export type MockBody = {
    status: string;
    result?: unknown;
    error?: unknown;
    message?: string;
    time?: number;
    usage?: unknown;
};

export type MockResponse = Response & { statusCode: number; body?: MockBody };

export function createMockRes(options?: { authUserUid?: string }): MockResponse {
    const authUserUid = options?.authUserUid;
    const res: {
        statusCode: number;
        body?: MockBody;
        headersSent: boolean;
        locals: Record<string, unknown>;
        status: (code: number) => Response;
        setHeader: (_name: string, _value: unknown) => Response;
        writableEnded: boolean;
        json: (payload: unknown) => Response;
    } = {
        statusCode: 200,
        headersSent: false,
        locals: authUserUid ? { authUserUid } : {},
        status(code: number) {
            res.statusCode = code;
            return res as unknown as Response;
        },
        setHeader(name: string, value: unknown) {
            void name;
            void value;
            return res as unknown as Response;
        },
        writableEnded: false,
        json(payload: unknown) {
            res.body = payload as MockBody;
            res.writableEnded = true;
            return res as unknown as Response;
        },
    };
    return res as unknown as MockResponse;
}

export function createRequest(options: {
    method: "PUT" | "GET" | "POST" | "DELETE";
    collection: string;
    body?: unknown;
    headers?: Record<string, string | undefined>;
    originalUrl?: string;
}): Request {
    const { method, collection, body, headers, originalUrl } = options;
    const reqLike = {
        method,
        originalUrl: originalUrl ?? `/collections/${collection}`,
        params: { collection },
        body,
        query: {},
        socket: {
            bytesRead: 0,
            remoteAddress: "127.0.0.1",
        },
        header(name: string) {
            const normalized = name.toLowerCase();
            if (headers && normalized in headers) {
                return headers[normalized] ?? undefined;
            }
            if (normalized === "api-key") {
                return "test-api-key";
            }
            return undefined;
        },
    };
    return reqLike as unknown as Request;
}
