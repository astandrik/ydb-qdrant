import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/api.js";
import {
  RECALL_DIM,
  RECALL_K,
  MIN_MEAN_RECALL,
  buildGoldenDataset,
  computeRecall,
  computeF1,
} from "./helpers/recall-test-utils.js";

const RNG_SEED = 42;

describe("YDB recall integration (multi_table, real YDB)", () => {
  const tenant = process.env.YDB_QDRANT_INTEGRATION_TENANT ?? "itest_tenant";
  const collectionBase =
    process.env.YDB_QDRANT_INTEGRATION_COLLECTION ?? "itest_collection";

  let client: Awaited<ReturnType<typeof createYdbQdrantClient>>;
  let recallCollection: string | null = null;

  beforeAll(async () => {
    client = await createYdbQdrantClient({ defaultTenant: tenant });
  });

  afterAll(async () => {
    if (!client || !recallCollection) {
      return;
    }

    try {
      await client.deleteCollection(recallCollection);
    } catch {
      // ignore cleanup failures in integration tests
    }
  });

  it("achieves reasonable Recall@K on a seeded random clustered dataset", async () => {
    recallCollection = `${collectionBase}_recall_random_${Date.now()}`;

    await client.createCollection(recallCollection, {
      vectors: {
        size: RECALL_DIM,
        distance: "Cosine",
        data_type: "float",
      },
    });

    const { points, queries } = buildGoldenDataset(RNG_SEED);

    await client.upsertPoints(recallCollection, {
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
      })),
    });

    const k = RECALL_K;
    const minMeanRecall = MIN_MEAN_RECALL;

    const recalls: number[] = [];
    const f1s: number[] = [];

    for (const query of queries) {
      const result = await client.searchPoints(recallCollection, {
        vector: query.vector,
        top: k,
        with_payload: false,
      });

      const retrievedIds = (result.points ?? []).map((p) => p.id);
      const recall = computeRecall(query.relevantIds, retrievedIds);
      const f1 = computeF1(query.relevantIds, retrievedIds);
      recalls.push(recall);
      f1s.push(f1);
    }

    const meanRecall = recalls.reduce((sum, r) => sum + r, 0) / recalls.length;
    const meanF1 = f1s.reduce((sum, v) => sum + v, 0) / f1s.length;

    // Used by CI to build a dynamic Shields.io badge with the actual recall value.
    console.log(`RECALL_MEAN_MULTI_TABLE ${meanRecall.toFixed(4)}`);
    console.log(`F1_MEAN_MULTI_TABLE ${meanF1.toFixed(4)}`);

    expect(meanRecall).toBeGreaterThanOrEqual(minMeanRecall);
  }, 30000);
});
