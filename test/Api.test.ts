import { describe, it, expect, vi } from "vitest";

vi.mock("../src/ydb/client.js", () => ({
  readyOrThrow: vi.fn().mockResolvedValue(undefined),
  configureDriver: vi.fn(),
}));

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

vi.mock("../src/services/QdrantService.js", () => {
  return {
    QdrantServiceError: class QdrantServiceError extends Error {},
    createCollection: vi
      .fn()
      .mockResolvedValue({ name: "col", tenant: "tenant_default" }),
    getCollection: vi.fn().mockResolvedValue({
      name: "col",
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    }),
    deleteCollection: vi.fn().mockResolvedValue({ acknowledged: true }),
    putCollectionIndex: vi.fn().mockResolvedValue({ acknowledged: true }),
    upsertPoints: vi.fn().mockResolvedValue({ upserted: 1 }),
    searchPoints: vi.fn().mockResolvedValue({ points: [] }),
    deletePoints: vi.fn().mockResolvedValue({ deleted: 1 }),
  };
});

import * as service from "../src/services/QdrantService.js";
import { createYdbQdrantClient } from "../src/package/Api.js";

describe("YdbQdrantClient (programmatic API, mocked YDB)", () => {
  it("uses default tenant when none specified", async () => {
    const client = await createYdbQdrantClient({
      defaultTenant: "tenant_default",
    });

    await client.createCollection("col", {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });

    expect(service.createCollection).toHaveBeenCalledWith(
      { tenant: "tenant_default", collection: "col" },
      expect.anything()
    );
  });

  it("forTenant overrides the default tenant", async () => {
    const client = await createYdbQdrantClient({
      defaultTenant: "tenant_default",
    });
    const tClient = client.forTenant("tenant_other");

    await tClient.upsertPoints("col", {
      points: [{ id: "p1", vector: [0, 0, 0, 1] }],
    });

    expect(service.upsertPoints).toHaveBeenCalledWith(
      { tenant: "tenant_other", collection: "col" },
      expect.anything()
    );
  });
});
