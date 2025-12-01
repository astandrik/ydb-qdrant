import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/api.js";
import {
  RECALL_DIM,
  RECALL_K,
  MIN_MEAN_RECALL,
  DATASET_SIZE,
  QUERY_COUNT,
  buildRealisticDataset,
  computeRecall,
  computeF1,
} from "./helpers/recall-test-utils.js";

const RNG_SEED = 42;

/**
 * Recall benchmark following ANN-benchmarks methodology.
 *
 * Key differences from trivial one-hot cluster tests:
 * 1. Random vectors instead of orthogonal clusters
 * 2. Ground truth computed via exact brute-force k-NN
 * 3. Higher dimensionality (768D) matching transformer embeddings
 * 4. Larger dataset (5000 points, 50 queries)
 *
 * Reference: https://github.com/erikbern/ann-benchmarks
 * Reference: Aumüller et al., "ANN-Benchmarks: A Benchmarking Tool for
 *            Approximate Nearest Neighbor Algorithms", SISAP 2017
 */
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

  it(`achieves reasonable Recall@${RECALL_K} on ${DATASET_SIZE} random ${RECALL_DIM}D vectors`, async () => {
    recallCollection = `${collectionBase}_recall_realistic_${Date.now()}`;

    await client.createCollection(recallCollection, {
      vectors: {
        size: RECALL_DIM,
        distance: "Cosine",
        data_type: "float",
      },
    });

    // Build realistic dataset with random vectors and exact ground truth
    const { points, queries } = buildRealisticDataset(RNG_SEED);

    // Upsert all points (may take longer with 768D vectors)
    await client.upsertPoints(recallCollection, {
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
      })),
    });

    const recalls: number[] = [];
    const f1s: number[] = [];

    // Run all queries and compute recall against exact ground truth
    for (const query of queries) {
      const result = await client.searchPoints(recallCollection, {
        vector: query.vector,
        top: RECALL_K,
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
    const minRecall = Math.min(...recalls);
    const maxRecall = Math.max(...recalls);

    // Output for CI badges and monitoring
    console.log(`RECALL_MEAN_MULTI_TABLE ${meanRecall.toFixed(4)}`);
    console.log(`F1_MEAN_MULTI_TABLE ${meanF1.toFixed(4)}`);
    console.log(
      `Recall@${RECALL_K} stats: mean=${meanRecall.toFixed(4)}, min=${minRecall.toFixed(4)}, max=${maxRecall.toFixed(4)}`
    );
    console.log(
      `Dataset: ${DATASET_SIZE} points, ${QUERY_COUNT} queries, ${RECALL_DIM}D vectors`
    );

    expect(meanRecall).toBeGreaterThanOrEqual(MIN_MEAN_RECALL);
  }, 120000); // Increased timeout for larger dataset with 768D vectors
});
