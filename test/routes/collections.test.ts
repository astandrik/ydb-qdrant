import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/services/QdrantService.js", () => {
  class QdrantServiceError extends Error {
    statusCode: number;
    payload: { status: "error"; error: unknown };

    constructor(
      statusCode: number,
      payload: { status: "error"; error: unknown },
      message?: string
    ) {
      super(message ?? String(payload.error));
      this.statusCode = statusCode;
      this.payload = payload;
    }
  }

  return {
    QdrantServiceError,
    createCollection: vi
      .fn()
      .mockResolvedValue({ name: "col", tenant: "tenant_id" }),
    getCollection: vi.fn().mockResolvedValue({
      name: "col",
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    }),
    deleteCollection: vi.fn().mockResolvedValue({ acknowledged: true }),
    putCollectionIndex: vi.fn().mockResolvedValue({ acknowledged: true }),
  };
});

import { collectionsRouter } from "../../src/routes/collections.js";
import * as service from "../../src/services/QdrantService.js";

type RouteHandler = (req: Request, res: Response) => unknown;

type Layer = {
  route?: {
    path?: string;
    methods?: Record<string, boolean>;
    stack?: Array<{ handle: RouteHandler }>;
  };
};

function findHandler(
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

type MockBody = {
  status: string;
  result?: unknown;
  error?: unknown;
  message?: string;
};

type MockResponse = Response & { statusCode: number; body?: MockBody };

function createMockRes(): MockResponse {
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

function createRequest(options: {
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("collectionsRouter (HTTP, mocked service)", () => {
  it("creates collection with sanitized tenant and collection name", async () => {
    const handler = findHandler(collectionsRouter, "put", "/:collection");
    const req = createRequest({
      method: "PUT",
      collection: "My-Collection",
      body: {
        vectors: { size: 4, distance: "Cosine", data_type: "float" },
      },
      tenantHeader: "Tenant-Id",
    });
    const res = createMockRes();

    await handler(req, res);

    expect(service.createCollection).toHaveBeenCalledWith(
      { tenant: "tenant_id", collection: "my_collection" },
      {
        vectors: { size: 4, distance: "Cosine", data_type: "float" },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("returns QdrantServiceError payload and status code on collection error", async () => {
    const handler = findHandler(collectionsRouter, "put", "/:collection");
    const req = createRequest({
      method: "PUT",
      collection: "col",
      body: {
        vectors: { size: 4, distance: "Cosine", data_type: "float" },
      },
      tenantHeader: "tenant",
    });
    const res = createMockRes();

    const error = new service.QdrantServiceError(
      422,
      { status: "error", error: "invalid" },
      "invalid"
    );

    vi.mocked(service.createCollection).mockRejectedValueOnce(error);

    await handler(req, res);
    expect(res.statusCode).toBe(422);
    expect(res.body).toMatchObject({ status: "error", error: "invalid" });
  });

  it("handles get and delete collection through service", async () => {
    const getHandler = findHandler(collectionsRouter, "get", "/:collection");
    const deleteHandler = findHandler(
      collectionsRouter,
      "delete",
      "/:collection"
    );

    const getReq = createRequest({
      method: "GET",
      collection: "My-Collection",
      tenantHeader: "Tenant-Id",
    });
    const getRes = createMockRes();

    await getHandler(getReq, getRes);

    expect(service.getCollection).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: "tenant_id",
        collection: "my_collection",
      })
    );
    expect(getRes.statusCode).toBe(200);

    const deleteReq = createRequest({
      method: "DELETE",
      collection: "My-Collection",
      tenantHeader: "Tenant-Id",
    });
    const deleteRes = createMockRes();

    await deleteHandler(deleteReq, deleteRes);

    expect(service.deleteCollection).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: "tenant_id",
        collection: "my_collection",
      })
    );
    expect(deleteRes.statusCode).toBe(200);
  });

  it("invokes putCollectionIndex with raw tenant and collection from request", async () => {
    const handler = findHandler(collectionsRouter, "put", "/:collection/index");
    const req = createRequest({
      method: "PUT",
      collection: "raw-col",
      tenantHeader: "raw-tenant",
    });
    const res = createMockRes();

    await handler(req, res);

    expect(service.putCollectionIndex).toHaveBeenCalledWith({
      tenant: "raw-tenant",
      collection: "raw-col",
    });
    expect(res.statusCode).toBe(200);
  });
});
