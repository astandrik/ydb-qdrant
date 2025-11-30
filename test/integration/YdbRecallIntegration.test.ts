import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/api.js";

type Vec = number[];

type GoldenPoint = {
  id: string;
  vector: Vec;
  clusterIndex: number;
};

type GoldenQuery = {
  name: string;
  vector: Vec;
  relevantIds: string[];
};

const RECALL_DIM = 16;
const CLUSTERS_COUNT = 4;
const POINTS_PER_CLUSTER = 100;
const RECALL_K = 80;
const MIN_MEAN_RECALL = 0.8;
const RNG_SEED = 42;

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function normalize(vec: Vec): Vec {
  const norm = Math.hypot(...vec) || 1;
  return vec.map((x) => x / norm);
}

function buildGoldenDataset(): {
  points: GoldenPoint[];
  queries: GoldenQuery[];
} {
  const centers: Vec[] = Array.from(
    { length: CLUSTERS_COUNT },
    (_, idx): Vec => {
      const base: Vec = Array.from({ length: RECALL_DIM }, () => 0);
      base[idx] = 1;
      return base;
    }
  );

  const rng = createSeededRng(RNG_SEED);
  const points: GoldenPoint[] = [];

  centers.forEach((center, clusterIndex) => {
    for (let i = 0; i < POINTS_PER_CLUSTER; i += 1) {
      const noise: Vec = Array.from(
        { length: RECALL_DIM },
        () => (rng() - 0.5) * 0.1
      );
      const v: Vec = normalize(center.map((value, idx) => value + noise[idx]));
      points.push({
        id: `c${clusterIndex}_${i}`,
        vector: v,
        clusterIndex,
      });
    }
  });

  const queries: GoldenQuery[] = centers.map((center, clusterIndex) => ({
    name: `cluster_${clusterIndex}`,
    vector: center,
    relevantIds: points
      .filter((p) => p.clusterIndex === clusterIndex)
      .map((p) => p.id),
  }));

  return { points, queries };
}

function computeRecall(relevantIds: string[], retrievedIds: string[]): number {
  const found = relevantIds.filter((id) => retrievedIds.includes(id)).length;
  return found / relevantIds.length;
}

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

    const { points, queries } = buildGoldenDataset();

    await client.upsertPoints(recallCollection, {
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
      })),
    });

    const k = RECALL_K;
    const minMeanRecall = MIN_MEAN_RECALL;

    const recalls: number[] = [];

    for (const query of queries) {
      const result = await client.searchPoints(recallCollection, {
        vector: query.vector,
        top: k,
        with_payload: false,
      });

      const retrievedIds = (result.points ?? []).map((p) => p.id);
      const recall = computeRecall(query.relevantIds, retrievedIds);
      recalls.push(recall);
    }

    const meanRecall = recalls.reduce((sum, r) => sum + r, 0) / recalls.length;

    // Used by CI to build a dynamic Shields.io badge with the actual recall value.
    console.log(`RECALL_MEAN_MULTI_TABLE ${meanRecall.toFixed(4)}`);

    expect(meanRecall).toBeGreaterThanOrEqual(minMeanRecall);
  }, 30000);
});
