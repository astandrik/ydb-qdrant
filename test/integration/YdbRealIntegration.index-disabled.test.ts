import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createYdbQdrantClient } from "../../src/package/Api.js";
import { logger } from "../../src/logging/logger.js";
import { metaKeyFor } from "../../src/utils/tenant.js";
import { getCollectionMeta } from "../../src/repositories/collectionsRepo.js";
import { VECTOR_INDEX_BUILD_ENABLED } from "../../src/config/env.js";

describe("YDB integration with VECTOR_INDEX_BUILD_ENABLED=false", () => {
  const tenant = process.env.YDB_QDRANT_INTEGRATION_TENANT ?? "itest_tenant";
  const collectionBase =
    process.env.YDB_QDRANT_INTEGRATION_COLLECTION ?? "itest_collection";
  const collection = `${collectionBase}_no_index_env_false_${Date.now()}`;

  let client: Awaited<ReturnType<typeof createYdbQdrantClient>>;

  beforeAll(async () => {
    client = await createYdbQdrantClient({ defaultTenant: tenant });
  });

  afterAll(async () => {
    if (!client) {
      return;
    }

    try {
      await client.deleteCollection(collection);
    } catch {
      // ignore cleanup failures in integration tests
    }
  });

  it(
    "executes search via table scan when vector index building is disabled",
    async () => {
      // Guard: this test is meant for VECTOR_INDEX_BUILD_ENABLED=false
      expect(VECTOR_INDEX_BUILD_ENABLED).toBe(false);

      await client.createCollection(collection, {
        vectors: {
          size: 4,
          distance: "Cosine",
          data_type: "float",
        },
      });

      await client.upsertPoints(collection, {
        points: [
          { id: "p1", vector: [0, 0, 0, 1], payload: { label: "p1" } },
          { id: "p2", vector: [0, 0, 1, 0], payload: { label: "p2" } },
        ],
      });

      const metaKey = metaKeyFor(tenant, collection);
      const meta = await getCollectionMeta(metaKey);
      if (!meta) {
        throw new Error("collection meta not found for env=false test");
      }

      const infoSpy = vi.spyOn(logger, "info");
      infoSpy.mockClear();

      const result = await client.searchPoints(collection, {
        vector: [0, 0, 0, 1],
        top: 2,
        with_payload: true,
      });

      expect(result.points).toBeDefined();
      expect(result.points?.length).toBeGreaterThanOrEqual(1);

      const callsForTable = infoSpy.mock.calls.filter(([ctx]) => {
        const c = ctx as { tableName?: string } | undefined;
        return c?.tableName === meta.table;
      });

      const usedIndex = callsForTable.some(
        ([, msg]) => msg === "vector index found; using index for search"
      );
      const fellBack = callsForTable.some(
        ([, msg]) =>
          msg ===
          "vector index not available (missing or building); falling back to table scan"
      );

      expect(usedIndex).toBe(false);
      expect(fellBack).toBe(false);

      infoSpy.mockRestore();
    },
    30000
  );
});


