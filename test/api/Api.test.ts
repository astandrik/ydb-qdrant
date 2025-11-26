import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/ydb/client.js", () => ({
  readyOrThrow: vi.fn().mockResolvedValue(undefined),
  configureDriver: vi.fn(),
}));

vi.mock("../../src/ydb/schema.js", () => ({
  ensureMetaTable: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/services/errors.js", () => ({
  QdrantServiceError: class QdrantServiceError extends Error {},
}));

vi.mock("../../src/services/CollectionService.js", () => ({
  createCollection: vi
    .fn()
    .mockResolvedValue({ name: "col", tenant: "tenant_default" }),
  getCollection: vi.fn().mockResolvedValue({
    name: "col",
    vectors: { size: 4, distance: "Cosine", data_type: "float" },
  }),
  deleteCollection: vi.fn().mockResolvedValue({ acknowledged: true }),
  putCollectionIndex: vi.fn().mockResolvedValue({ acknowledged: true }),
}));

vi.mock("../../src/services/PointsService.js", () => ({
  upsertPoints: vi.fn().mockResolvedValue({ upserted: 1 }),
  searchPoints: vi.fn().mockResolvedValue({ points: [] }),
  deletePoints: vi.fn().mockResolvedValue({ deleted: 1 }),
}));

import * as ydbClient from "../../src/ydb/client.js";
import * as schema from "../../src/ydb/schema.js";
import * as collectionService from "../../src/services/CollectionService.js";
import * as pointsService from "../../src/services/PointsService.js";
import { createYdbQdrantClient } from "../../src/package/api.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("YdbQdrantClient (programmatic API, mocked YDB)", () => {
  it("uses default tenant when none specified", async () => {
    const client = await createYdbQdrantClient({
      defaultTenant: "tenant_default",
    });

    await client.createCollection("col", {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });

    expect(collectionService.createCollection).toHaveBeenCalledWith(
      { tenant: "tenant_default", collection: "col" },
      expect.anything()
    );
  });

  it("falls back to 'default' tenant when no defaultTenant is provided", async () => {
    const client = await createYdbQdrantClient();

    await client.getCollection("col_default");

    expect(collectionService.getCollection).toHaveBeenCalledWith({
      tenant: "default",
      collection: "col_default",
    });
  });

  it("forTenant overrides the default tenant", async () => {
    const client = await createYdbQdrantClient({
      defaultTenant: "tenant_default",
    });
    const tClient = client.forTenant("tenant_other");

    await tClient.upsertPoints("col", {
      points: [{ id: "p1", vector: [0, 0, 0, 1] }],
    });

    expect(pointsService.upsertPoints).toHaveBeenCalledWith(
      { tenant: "tenant_other", collection: "col" },
      expect.anything()
    );
  });

  it("forwards all client methods to service for the default tenant", async () => {
    const client = await createYdbQdrantClient({
      defaultTenant: "tenant_default",
    });

    await client.createCollection("col_all", {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });
    await client.getCollection("col_all");
    await client.deleteCollection("col_all");
    await client.putCollectionIndex("col_all");

    const upsertBody = {
      points: [{ id: "p1", vector: [0, 0, 0, 1] }],
    };
    await client.upsertPoints("col_all", upsertBody);

    const searchBody = {
      vector: [0, 0, 0, 1],
      top: 1,
    };
    await client.searchPoints("col_all", searchBody);

    const deleteBody = { points: ["p1", "p2"] };
    await client.deletePoints("col_all", deleteBody);

    expect(collectionService.createCollection).toHaveBeenCalledWith(
      { tenant: "tenant_default", collection: "col_all" },
      expect.anything()
    );
    expect(collectionService.getCollection).toHaveBeenCalledWith({
      tenant: "tenant_default",
      collection: "col_all",
    });
    expect(collectionService.deleteCollection).toHaveBeenCalledWith({
      tenant: "tenant_default",
      collection: "col_all",
    });
    expect(collectionService.putCollectionIndex).toHaveBeenCalledWith({
      tenant: "tenant_default",
      collection: "col_all",
    });
    expect(pointsService.upsertPoints).toHaveBeenCalledWith(
      { tenant: "tenant_default", collection: "col_all" },
      upsertBody
    );
    expect(pointsService.searchPoints).toHaveBeenCalledWith(
      { tenant: "tenant_default", collection: "col_all" },
      searchBody
    );
    expect(pointsService.deletePoints).toHaveBeenCalledWith(
      { tenant: "tenant_default", collection: "col_all" },
      deleteBody
    );
  });

  it("forTenant client forwards all methods to service for the specified tenant", async () => {
    const client = await createYdbQdrantClient({
      defaultTenant: "tenant_default",
    });
    const tClient = client.forTenant("tenant_other");

    await tClient.createCollection("col_all", {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });
    await tClient.getCollection("col_all");
    await tClient.deleteCollection("col_all");
    await tClient.putCollectionIndex("col_all");

    const upsertBody = {
      points: [{ id: "p1", vector: [0, 0, 0, 1] }],
    };
    await tClient.upsertPoints("col_all", upsertBody);

    const searchBody = {
      vector: [0, 0, 0, 1],
      top: 1,
    };
    await tClient.searchPoints("col_all", searchBody);

    const deleteBody = { points: ["p1", "p2"] };
    await tClient.deletePoints("col_all", deleteBody);

    expect(collectionService.createCollection).toHaveBeenCalledWith(
      { tenant: "tenant_other", collection: "col_all" },
      expect.anything()
    );
    expect(collectionService.getCollection).toHaveBeenCalledWith({
      tenant: "tenant_other",
      collection: "col_all",
    });
    expect(collectionService.deleteCollection).toHaveBeenCalledWith({
      tenant: "tenant_other",
      collection: "col_all",
    });
    expect(collectionService.putCollectionIndex).toHaveBeenCalledWith({
      tenant: "tenant_other",
      collection: "col_all",
    });
    expect(pointsService.upsertPoints).toHaveBeenCalledWith(
      { tenant: "tenant_other", collection: "col_all" },
      upsertBody
    );
    expect(pointsService.searchPoints).toHaveBeenCalledWith(
      { tenant: "tenant_other", collection: "col_all" },
      searchBody
    );
    expect(pointsService.deletePoints).toHaveBeenCalledWith(
      { tenant: "tenant_other", collection: "col_all" },
      deleteBody
    );
  });

  it("configures the YDB driver and ensures metadata table before returning a client", async () => {
    const client = await createYdbQdrantClient({
      endpoint: "grpc://localhost:2136",
      database: "/local",
    });

    expect(ydbClient.configureDriver).toHaveBeenCalledWith({
      endpoint: "grpc://localhost:2136",
      database: "/local",
      connectionString: undefined,
      authService: undefined,
    });
    expect(ydbClient.readyOrThrow).toHaveBeenCalledTimes(1);
    expect(schema.ensureMetaTable).toHaveBeenCalledTimes(1);

    await client.getCollection("col_driver");
  });
});
