import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/services/errors.js", () => {
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
  };
});

vi.mock("../../src/services/CollectionService.js", () => ({
  createCollection: vi
    .fn()
    .mockResolvedValue({ name: "col", tenant: "tenant_id" }),
  getCollection: vi.fn().mockResolvedValue({
    name: "col",
    vectors: { size: 4, distance: "Cosine", data_type: "float" },
  }),
  deleteCollection: vi.fn().mockResolvedValue({ acknowledged: true }),
  putCollectionIndex: vi.fn().mockResolvedValue({ acknowledged: true }),
}));

import { collectionsRouter } from "../../src/routes/collections.js";
import * as collectionService from "../../src/services/CollectionService.js";
import { QdrantServiceError } from "../../src/services/errors.js";
import {
  findHandler,
  createMockRes,
  createRequest,
} from "../helpers/routeTestHelpers.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("collectionsRouter (HTTP, mocked service)", () => {
  it("creates collection with raw tenant, collection and apiKey", async () => {
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

    expect(collectionService.createCollection).toHaveBeenCalledWith(
      { tenant: "Tenant-Id", collection: "My-Collection", apiKey: undefined },
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

    const error = new QdrantServiceError(
      422,
      { status: "error", error: "invalid" },
      "invalid"
    );

    vi.mocked(collectionService.createCollection).mockRejectedValueOnce(error);

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

    expect(collectionService.getCollection).toHaveBeenCalledWith({
      tenant: "Tenant-Id",
      collection: "My-Collection",
      apiKey: undefined,
    });
    expect(getRes.statusCode).toBe(200);

    const deleteReq = createRequest({
      method: "DELETE",
      collection: "My-Collection",
      tenantHeader: "Tenant-Id",
    });
    const deleteRes = createMockRes();

    await deleteHandler(deleteReq, deleteRes);

    expect(collectionService.deleteCollection).toHaveBeenCalledWith({
      tenant: "Tenant-Id",
      collection: "My-Collection",
      apiKey: undefined,
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it("invokes putCollectionIndex with raw tenant, collection and apiKey from request", async () => {
    const handler = findHandler(collectionsRouter, "put", "/:collection/index");
    const req = createRequest({
      method: "PUT",
      collection: "raw-col",
      tenantHeader: "raw-tenant",
    });
    const res = createMockRes();

    await handler(req, res);

    expect(collectionService.putCollectionIndex).toHaveBeenCalledWith({
      tenant: "raw-tenant",
      collection: "raw-col",
      apiKey: undefined,
    });
    expect(res.statusCode).toBe(200);
  });
});
