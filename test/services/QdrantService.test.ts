import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/ydb/schema.js", () => ({
  ensureMetaTable: vi.fn().mockResolvedValue(undefined),
  ensureGlobalPointsTable: vi.fn().mockResolvedValue(undefined),
  GLOBAL_POINTS_TABLE: "qdrant_all_points",
}));

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/config/env.js", () => ({
  VECTOR_INDEX_BUILD_ENABLED: true,
  CollectionStorageMode: {
    MultiTable: "multi_table",
    OneTable: "one_table",
  },
  COLLECTION_STORAGE_MODE: "multi_table",
  isOneTableMode: (mode: string) => mode === "one_table",
}));

vi.mock("../../src/indexing/IndexScheduler.js", () => ({
  requestIndexBuild: vi.fn(),
}));

vi.mock("../../src/repositories/collectionsRepo.js", () => ({
  getCollectionMeta: vi.fn(),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

vi.mock("../../src/repositories/pointsRepo.js", () => ({
  upsertPoints: vi.fn(),
  searchPoints: vi.fn(),
  deletePoints: vi.fn(),
}));

import * as collectionsRepo from "../../src/repositories/collectionsRepo.js";
import * as pointsRepo from "../../src/repositories/pointsRepo.js";
import * as indexScheduler from "../../src/indexing/IndexScheduler.js";
import { logger } from "../../src/logging/logger.js";
import {
  createCollection,
  getCollection,
  deleteCollection,
  putCollectionIndex,
} from "../../src/services/CollectionService.js";
import {
  upsertPoints,
  searchPoints,
  queryPoints,
  deletePoints,
} from "../../src/services/PointsService.js";
import { QdrantServiceError } from "../../src/services/errors.js";

describe("QdrantService (with mocked YDB)", () => {
  const tenant = "tenant_a";
  const collection = "my_collection";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new collection when metadata is missing", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(null);
    vi.mocked(collectionsRepo.createCollection).mockResolvedValueOnce(
      undefined
    );

    const result = await createCollection(
      { tenant, collection },
      {
        vectors: {
          size: 128,
          distance: "Cosine",
          data_type: "float",
        },
      }
    );

    expect(result).toEqual({ name: "my_collection", tenant: "tenant_a" });
    expect(collectionsRepo.createCollection).toHaveBeenCalledTimes(1);
  });

  it("returns existing collection when config matches metadata", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 128,
      distance: "Cosine",
      vectorType: "float",
    });

    const result = await createCollection(
      { tenant, collection },
      {
        vectors: {
          size: 128,
          distance: "Cosine",
          data_type: "float",
        },
      }
    );

    expect(result).toEqual({ name: "my_collection", tenant: "tenant_a" });
    expect(collectionsRepo.createCollection).not.toHaveBeenCalled();
  });

  it("throws when creating collection with conflicting config", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 256,
      distance: "Euclid",
      vectorType: "float",
    });

    await expect(
      createCollection(
        { tenant, collection },
        {
          vectors: {
            size: 128,
            distance: "Euclid",
            data_type: "float",
          },
        }
      )
    ).rejects.toBeInstanceOf(QdrantServiceError);
  });

  it("rejects invalid create collection payload", async () => {
    await expect(
      createCollection({ tenant, collection }, { invalid: true })
    ).rejects.toHaveProperty("statusCode", 400);
    expect(collectionsRepo.getCollectionMeta).not.toHaveBeenCalled();
  });

  it("returns collection description when metadata exists", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 128,
      distance: "Cosine",
      vectorType: "float",
    });

    const result = await getCollection({ tenant, collection });

    expect(result).toEqual({
      name: "my_collection",
      vectors: {
        size: 128,
        distance: "Cosine",
        data_type: "float",
      },
    });
  });

  it("throws when getting collection that does not exist", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(null);

    await expect(getCollection({ tenant, collection })).rejects.toHaveProperty(
      "statusCode",
      404
    );
  });

  it("deletes collection via repository", async () => {
    vi.mocked(collectionsRepo.deleteCollection).mockResolvedValueOnce(
      undefined
    );

    const result = await deleteCollection({ tenant, collection });

    expect(result).toEqual({ acknowledged: true });
    expect(collectionsRepo.deleteCollection).toHaveBeenCalledWith(
      "tenant_a/my_collection"
    );
  });

  it("acknowledges putCollectionIndex when metadata exists", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 128,
      distance: "Cosine",
      vectorType: "float",
    });

    const result = await putCollectionIndex({ tenant, collection });

    expect(result).toEqual({ acknowledged: true });
    expect(collectionsRepo.getCollectionMeta).toHaveBeenCalledTimes(1);
  });

  it("throws 404 from putCollectionIndex when collection is missing", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(null);

    await expect(
      putCollectionIndex({ tenant, collection })
    ).rejects.toHaveProperty("statusCode", 404);
  });

  it("upserts points and schedules index build", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.upsertPoints).mockResolvedValueOnce(2);

    const result = await upsertPoints(
      { tenant, collection },
      {
        points: [
          { id: "p1", vector: [0, 0, 0, 1] },
          { id: "p2", vector: [0, 0, 1, 0] },
        ],
      }
    );

    expect(result).toEqual({ upserted: 2 });
    expect(pointsRepo.upsertPoints).toHaveBeenCalledTimes(1);
    expect(indexScheduler.requestIndexBuild).toHaveBeenCalledTimes(1);
  });

  it("maps vector dimension mismatch during upsert to QdrantServiceError 400", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.upsertPoints).mockRejectedValueOnce(
      new Error("Vector dimension mismatch for id=p1: got 4096, expected 3072")
    );

    await expect(
      upsertPoints(
        { tenant, collection },
        {
          points: [{ id: "p1", vector: [0, 0, 0, 1] }],
        }
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      payload: {
        status: "error",
        error: "Vector dimension mismatch for id=p1: got 4096, expected 3072",
      },
    });
  });

  it("throws 404 when upserting points into a missing collection", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(null);

    await expect(
      upsertPoints(
        { tenant, collection },
        {
          points: [{ id: "p1", vector: [0, 0, 0, 1] }],
        }
      )
    ).rejects.toHaveProperty("statusCode", 404);
  });

  it("rejects invalid upsert points payload", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });

    await expect(
      upsertPoints(
        { tenant, collection },
        {
          points: [{ id: "p1", vector: "not-a-vector" }],
        }
      )
    ).rejects.toHaveProperty("statusCode", 400);
    expect(pointsRepo.upsertPoints).not.toHaveBeenCalled();
    expect(indexScheduler.requestIndexBuild).not.toHaveBeenCalled();
  });

  it("searches points via repository and applies no threshold by default", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
      { id: "p1", score: 0.9, payload: { a: 1 } },
      { id: "p2", score: 0.7, payload: { b: 2 } },
    ]);

    const result = await searchPoints(
      { tenant, collection },
      {
        vector: [0, 0, 0, 1],
        top: 2,
        with_payload: true,
      }
    );

    expect(result.points).toHaveLength(2);
    expect(pointsRepo.searchPoints).toHaveBeenCalledTimes(1);
  });

  it("filters search results using score_threshold for similarity metrics", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Dot",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
      { id: "p1", score: 0.9, payload: { a: 1 } },
      { id: "p2", score: 0.4, payload: { b: 2 } },
    ]);

    const result = await searchPoints(
      { tenant, collection },
      {
        vector: [0, 0, 0, 1],
        top: 10,
        with_payload: true,
        score_threshold: 0.5,
      }
    );

    expect(result.points.map((p) => p.id)).toEqual(["p1"]);
  });

  it("filters search results using score_threshold for distance metrics", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Euclid",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
      { id: "p1", score: 0.3 },
      { id: "p2", score: 0.8 },
    ]);

    const result = await searchPoints(
      { tenant, collection },
      {
        vector: [0, 0, 0, 1],
        top: 10,
        with_payload: false,
        score_threshold: 0.5,
      }
    );

    expect(result.points.map((p) => p.id)).toEqual(["p1"]);
  });

  it("maps vector dimension mismatch during search to QdrantServiceError 400", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 3072,
      distance: "Cosine",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.searchPoints).mockRejectedValueOnce(
      new Error("Vector dimension mismatch: got 4096, expected 3072")
    );

    await expect(
      searchPoints(
        { tenant, collection },
        {
          vector: new Array(4096).fill(0),
          top: 1,
        }
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      payload: {
        status: "error",
        error: "Vector dimension mismatch: got 4096, expected 3072",
      },
    });
  });

  it("uses loose query normalization in queryPoints", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([]);

    await queryPoints(
      { tenant, collection },
      {
        query: {
          nearest: {
            vector: [0, 0, 0, 1],
          },
        },
        limit: 1,
        with_payload: { some: "field" },
      }
    );

    expect(pointsRepo.searchPoints).toHaveBeenCalledWith(
      "qdr_tenant_a__my_collection",
      [0, 0, 0, 1],
      1,
      true,
      "Cosine",
      4,
      undefined
    );
  });

  it("logs and throws when search payload is invalid", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });

    await expect(
      searchPoints(
        { tenant, collection },
        {
          vector: "not-a-vector",
          top: "not-a-number",
        }
      )
    ).rejects.toHaveProperty("statusCode", 400);

    expect(logger.warn).toHaveBeenCalled();
    expect(pointsRepo.searchPoints).not.toHaveBeenCalled();
  });

  it("logs and throws 404 when collection is missing during search", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(null);

    await expect(
      searchPoints(
        { tenant, collection },
        {
          vector: [0, 0, 0, 1],
          top: 1,
        }
      )
    ).rejects.toHaveProperty("statusCode", 404);

    expect(logger.warn).toHaveBeenCalled();
    expect(pointsRepo.searchPoints).not.toHaveBeenCalled();
  });

  it("deletes points via repository", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });
    vi.mocked(pointsRepo.deletePoints).mockResolvedValueOnce(3);

    const result = await deletePoints(
      { tenant, collection },
      { points: ["p1", "p2", "p3"] }
    );

    expect(result).toEqual({ deleted: 3 });
    expect(pointsRepo.deletePoints).toHaveBeenCalledTimes(1);
  });

  it("throws 404 when deleting points for a missing collection", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(null);

    await expect(
      deletePoints(
        { tenant, collection },
        {
          points: ["p1"],
        }
      )
    ).rejects.toHaveProperty("statusCode", 404);
    expect(pointsRepo.deletePoints).not.toHaveBeenCalled();
  });

  it("rejects invalid delete points payload", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 4,
      distance: "Cosine",
      vectorType: "float",
    });

    await expect(
      deletePoints(
        { tenant, collection },
        {
          points: "not-an-array",
        }
      )
    ).rejects.toHaveProperty("statusCode", 400);
    expect(pointsRepo.deletePoints).not.toHaveBeenCalled();
  });
});
