import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../src/ydb/schema.js", () => ({
  ensureMetaTable: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../src/indexing/IndexScheduler.js", () => ({
  requestIndexBuild: vi.fn(),
}));

vi.mock("../src/repositories/collectionsRepo.js", () => ({
  getCollectionMeta: vi.fn(),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

vi.mock("../src/repositories/pointsRepo.js", () => ({
  upsertPoints: vi.fn(),
  searchPoints: vi.fn(),
  deletePoints: vi.fn(),
}));

import * as collectionsRepo from "../src/repositories/collectionsRepo.js";
import * as pointsRepo from "../src/repositories/pointsRepo.js";
import * as indexScheduler from "../src/indexing/IndexScheduler.js";
import {
  createCollection,
  getCollection,
  upsertPoints,
  searchPoints,
  deletePoints,
  QdrantServiceError,
} from "../src/services/QdrantService.js";

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

  it("throws when creating collection with conflicting config", async () => {
    vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
      table: "qdr_tenant_a__my_collection",
      dimension: 256,
      distance: "Euclid",
      vectorType: "uint8",
    });

    await expect(
      createCollection(
        { tenant, collection },
        {
          vectors: {
            size: 128,
            distance: "Cosine",
            data_type: "float",
          },
        }
      )
    ).rejects.toBeInstanceOf(QdrantServiceError);
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
});
