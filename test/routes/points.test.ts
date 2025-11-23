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
    upsertPoints: vi.fn().mockResolvedValue({ upserted: 1 }),
    searchPoints: vi.fn().mockResolvedValue({ points: [] }),
    queryPoints: vi.fn().mockResolvedValue({ points: [] }),
    deletePoints: vi.fn().mockResolvedValue({ deleted: 1 }),
  };
});

import { pointsRouter } from "../../src/routes/points.js";
import * as service from "../../src/services/QdrantService.js";
import { logger } from "../../src/logging/logger.js";

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

describe("pointsRouter (HTTP, mocked service)", () => {
  it("upserts points via both PUT and POST aliases", async () => {
    const putHandler = findHandler(pointsRouter, "put", "/:collection/points");
    const postUpsertHandler = findHandler(
      pointsRouter,
      "post",
      "/:collection/points/upsert"
    );

    const body = {
      points: [{ id: "p1", vector: [0, 0, 0, 1] }],
    };

    const putReq = createRequest({
      method: "PUT",
      collection: "col",
      body,
      tenantHeader: "tenant",
    });
    const putRes = createMockRes();

    await putHandler(putReq, putRes);

    expect(service.upsertPoints).toHaveBeenCalledWith(
      { tenant: "tenant", collection: "col" },
      body
    );
    expect(putRes.statusCode).toBe(200);
    expect(putRes.body).toMatchObject({ status: "ok" });

    const postReq = createRequest({
      method: "POST",
      collection: "col",
      body,
      tenantHeader: "tenant",
    });
    const postRes = createMockRes();

    await postUpsertHandler(postReq, postRes);

    expect(service.upsertPoints).toHaveBeenCalledWith(
      { tenant: "tenant", collection: "col" },
      body
    );
    expect(postRes.statusCode).toBe(200);
    expect(postRes.body).toMatchObject({ status: "ok" });
  });

  it("searches, queries and deletes points through service", async () => {
    const searchHandler = findHandler(
      pointsRouter,
      "post",
      "/:collection/points/search"
    );
    const queryHandler = findHandler(
      pointsRouter,
      "post",
      "/:collection/points/query"
    );
    const deleteHandler = findHandler(
      pointsRouter,
      "post",
      "/:collection/points/delete"
    );

    const searchBody = {
      vector: [0, 0, 0, 1],
      top: 2,
    };
    const searchReq = createRequest({
      method: "POST",
      collection: "col",
      body: searchBody,
      tenantHeader: "tenant",
    });
    const searchRes = createMockRes();

    await searchHandler(searchReq, searchRes);

    expect(service.searchPoints).toHaveBeenCalledWith(
      { tenant: "tenant", collection: "col" },
      searchBody
    );
    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.body).toMatchObject({ status: "ok" });

    const queryBody = {
      query: { vector: [0, 0, 0, 1] },
      limit: 2,
    };
    const queryReq = createRequest({
      method: "POST",
      collection: "col",
      body: queryBody,
      tenantHeader: "tenant",
    });
    const queryRes = createMockRes();

    await queryHandler(queryReq, queryRes);

    expect(service.queryPoints).toHaveBeenCalledWith(
      { tenant: "tenant", collection: "col" },
      queryBody
    );
    expect(queryRes.statusCode).toBe(200);
    expect(queryRes.body).toMatchObject({ status: "ok" });

    const deleteBody = { points: ["p1", "p2"] };
    const deleteReq = createRequest({
      method: "POST",
      collection: "col",
      body: deleteBody,
      tenantHeader: "tenant",
    });
    const deleteRes = createMockRes();

    await deleteHandler(deleteReq, deleteRes);

    expect(service.deletePoints).toHaveBeenCalledWith(
      { tenant: "tenant", collection: "col" },
      deleteBody
    );
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toMatchObject({ status: "ok" });
  });

  it("returns QdrantServiceError payload and status for points search failures", async () => {
    const searchHandler = findHandler(
      pointsRouter,
      "post",
      "/:collection/points/search"
    );
    const req = createRequest({
      method: "POST",
      collection: "col",
      body: {
        vector: [0, 0, 0, 1],
        top: 1,
      },
      tenantHeader: "tenant",
    });
    const res = createMockRes();

    const error = new service.QdrantServiceError(
      400,
      { status: "error", error: "bad search" },
      "bad search"
    );

    vi.mocked(service.searchPoints).mockRejectedValueOnce(error);

    await searchHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ status: "error", error: "bad search" });
  });

  it("logs unexpected errors and returns 500 for delete points", async () => {
    const deleteHandler = findHandler(
      pointsRouter,
      "post",
      "/:collection/points/delete"
    );
    const req = createRequest({
      method: "POST",
      collection: "col",
      body: { points: ["p1"] },
      tenantHeader: "tenant",
    });
    const res = createMockRes();

    vi.mocked(service.deletePoints).mockRejectedValueOnce(new Error("boom"));

    await deleteHandler(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      status: "error",
      error: "boom",
    });
  });
});
