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

vi.mock("../../src/services/PointsService.js", () => ({
  upsertPoints: vi.fn().mockResolvedValue({ upserted: 1 }),
  searchPoints: vi.fn().mockResolvedValue({ points: [] }),
  queryPoints: vi.fn().mockResolvedValue({ points: [] }),
  deletePoints: vi.fn().mockResolvedValue({ deleted: 1 }),
}));

import { pointsRouter } from "../../src/routes/points.js";
import * as pointsService from "../../src/services/PointsService.js";
import { QdrantServiceError } from "../../src/services/errors.js";
import { logger } from "../../src/logging/logger.js";
import {
  findHandler,
  createMockRes,
  createRequest,
} from "../helpers/routeTestHelpers.js";

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

    expect(pointsService.upsertPoints).toHaveBeenCalledWith(
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

    expect(pointsService.upsertPoints).toHaveBeenCalledWith(
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

    expect(pointsService.searchPoints).toHaveBeenCalledWith(
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

    expect(pointsService.queryPoints).toHaveBeenCalledWith(
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

    expect(pointsService.deletePoints).toHaveBeenCalledWith(
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

    const error = new QdrantServiceError(
      400,
      { status: "error", error: "bad search" },
      "bad search"
    );

    vi.mocked(pointsService.searchPoints).mockRejectedValueOnce(error);

    await searchHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ status: "error", error: "bad search" });
  });

  it("returns 400 and payload for vector dimension mismatch on upsert", async () => {
    const putHandler = findHandler(pointsRouter, "put", "/:collection/points");
    const req = createRequest({
      method: "PUT",
      collection: "col",
      body: {
        points: [{ id: "p1", vector: [0, 0, 0, 1] }],
      },
      tenantHeader: "tenant",
    });
    const res = createMockRes();

    const error = new QdrantServiceError(
      400,
      {
        status: "error",
        error:
          "Vector dimension mismatch for id=p1: got 4096, expected 3072",
      },
      "Vector dimension mismatch for id=p1: got 4096, expected 3072"
    );

    vi.mocked(pointsService.upsertPoints).mockRejectedValueOnce(error);

    await putHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      status: "error",
      error:
        "Vector dimension mismatch for id=p1: got 4096, expected 3072",
    });
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

    vi.mocked(pointsService.deletePoints).mockRejectedValueOnce(new Error("boom"));

    await deleteHandler(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      status: "error",
      error: "boom",
    });
  });
});
