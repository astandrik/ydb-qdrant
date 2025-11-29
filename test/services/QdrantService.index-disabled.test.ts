import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/ydb/schema.js", () => ({
  ensureMetaTable: vi.fn().mockResolvedValue(undefined),
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

vi.mock("../../src/config/env.js", () => ({
  VECTOR_INDEX_BUILD_ENABLED: false,
  CollectionStorageMode: {
    MultiTable: "multi_table",
    OneTable: "one_table",
  },
  COLLECTION_STORAGE_MODE: "multi_table",
  isOneTableMode: (mode: string) => mode === "one_table",
}));

import * as collectionsRepo from "../../src/repositories/collectionsRepo.js";
import * as pointsRepo from "../../src/repositories/pointsRepo.js";
import * as indexScheduler from "../../src/indexing/IndexScheduler.js";
import { upsertPoints } from "../../src/services/PointsService.js";

describe("QdrantService.upsertPoints with VECTOR_INDEX_BUILD_ENABLED=false", () => {
  const tenant = "tenant_a";
  const collection = "my_collection";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not schedule index build when vector index builds are disabled", async () => {
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
    expect(indexScheduler.requestIndexBuild).not.toHaveBeenCalled();
  });
});
