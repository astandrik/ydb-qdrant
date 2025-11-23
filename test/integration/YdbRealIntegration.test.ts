import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/Api.js";

const hasEndpoint = !!process.env.YDB_ENDPOINT;
const hasDatabase = !!process.env.YDB_DATABASE;
const integrationFlag = process.env.YDB_QDRANT_INTEGRATION === "1";

const runIntegration = hasEndpoint && hasDatabase && integrationFlag;

const describeIf = runIntegration ? describe : describe.skip;

describeIf("YDB integration (real database via programmatic API)", () => {
  const tenant = process.env.YDB_QDRANT_INTEGRATION_TENANT ?? "itest_tenant";
  const collectionBase =
    process.env.YDB_QDRANT_INTEGRATION_COLLECTION ?? "itest_collection";
  const collection = `${collectionBase}_${Date.now()}`;

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

  it("creates collection, upserts points, and performs search against real YDB", async () => {
    await client.createCollection(collection, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await client.upsertPoints(collection, {
      points: [
        {
          id: "p1",
          vector: [0, 0, 0, 1],
          payload: { label: "p1" },
        },
        {
          id: "p2",
          vector: [0, 0, 1, 0],
          payload: { label: "p2" },
        },
      ],
    });

    const result = await client.searchPoints(collection, {
      vector: [0, 0, 0, 1],
      top: 2,
      with_payload: true,
    });

    expect(result.points).toBeDefined();
    expect(result.points?.length).toBeGreaterThanOrEqual(1);
    const ids = (result.points ?? []).map((p) => p.id);
    expect(ids).toContain("p1");
  });
});


