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
};

export type MockResponse = Response & { statusCode: number; body?: MockBody };

export function createMockRes(): MockResponse {
  const res: {
    statusCode: number;
    body?: MockBody;
    status: (code: number) => Response;
    json: (payload: unknown) => Response;
  } = {
    statusCode: 200,
    status(code: number) {
      res.statusCode = code;
      return res as unknown as Response;
    },
    json(payload: unknown) {
      res.body = payload as MockBody;
      return res as unknown as Response;
    },
  };
  return res as unknown as MockResponse;
}

export function createRequest(options: {
  method: "PUT" | "GET" | "POST" | "DELETE";
  collection: string;
  body?: unknown;
  tenantHeader?: string;
}): Request {
  const { method, collection, body, tenantHeader } = options;
  const reqLike = {
    method,
    params: { collection },
    body,
    header(name: string) {
      if (name.toLowerCase() === "x-tenant-id") {
        return tenantHeader;
      }
      return undefined;
    },
  };
  return reqLike as unknown as Request;
}


