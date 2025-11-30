export type Vec = number[];

export type GoldenPoint = {
  id: string;
  vector: Vec;
  clusterIndex: number;
};

export type GoldenQuery = {
  name: string;
  vector: Vec;
  relevantIds: string[];
};

export const RECALL_DIM = 16;
export const CLUSTERS_COUNT = 4;
export const POINTS_PER_CLUSTER = 100;
export const RECALL_K = 80;
export const MIN_MEAN_RECALL = 0.8;

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

export function normalize(vec: Vec): Vec {
  const norm = Math.hypot(...vec) || 1;
  return vec.map((x) => x / norm);
}

export function buildGoldenDataset(seed: number): {
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

  const rng = createSeededRng(seed);
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

export function computeRecall(
  relevantIds: string[],
  retrievedIds: string[]
): number {
  const retrievedSet = new Set(retrievedIds);
  const found = relevantIds.filter((id) => retrievedSet.has(id)).length;
  return found / relevantIds.length;
}
