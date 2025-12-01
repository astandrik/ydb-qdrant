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

// =============================================================================
// Realistic benchmark parameters (ANN-benchmarks methodology)
// Reference: https://github.com/erikbern/ann-benchmarks
// Reference: https://ann-benchmarks.com/
// =============================================================================

// Dimensions: 768 matches common transformer embeddings (e.g., sentence-transformers)
// For comparison: GloVe uses 25-200, SIFT uses 128, GIST uses 960, Fashion-MNIST uses 784
export const RECALL_DIM = 768;

// Dataset size: 5,000 points (similar scale to Fashion-MNIST's 60K but faster for CI)
// For comparison: GloVe uses 1.18M, SIFT uses 1M, NYTimes uses 290K
export const DATASET_SIZE = 5000;

// Query count: 50 queries for statistical significance
// For comparison: ANN-benchmarks uses 10,000 queries
export const QUERY_COUNT = 50;

// K: Number of nearest neighbors to retrieve
// Standard in ANN-benchmarks is K=10 or K=100
export const RECALL_K = 10;

// Minimum acceptable recall threshold
// Note: With approximate search (quantization, indexes), expect 30-70% recall
// This is a pass/fail threshold, not a target - actual recall is reported
export const MIN_MEAN_RECALL = 0.3;

// Legacy constants for backwards compatibility with buildGoldenDataset
export const CLUSTERS_COUNT = 16;
export const POINTS_PER_CLUSTER = 80;

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

/**
 * Compute cosine similarity between two normalized vectors (dot product).
 * ANN-benchmarks uses angular distance for GloVe/DEEP1B datasets.
 * For normalized vectors: cosine_similarity = dot_product
 */
export function cosineSimilarity(a: Vec, b: Vec): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Generate a random normalized vector using the seeded RNG.
 * Following ANN-benchmarks methodology where vectors are unit-normalized
 * for angular/cosine distance metrics.
 */
function generateRandomVector(dim: number, rng: () => number): Vec {
  const raw = Array.from({ length: dim }, () => rng() - 0.5);
  return normalize(raw);
}

/**
 * Build a realistic dataset following ANN-benchmarks methodology.
 *
 * Key differences from the legacy buildGoldenDataset:
 * 1. Random vectors instead of orthogonal one-hot clusters
 * 2. Ground truth computed via exact brute-force k-NN (cosine similarity)
 * 3. Higher dimensionality (768) matching transformer embeddings
 *
 * Reference: https://github.com/erikbern/ann-benchmarks
 * Reference: Aumüller et al., "ANN-Benchmarks: A Benchmarking Tool for
 *            Approximate Nearest Neighbor Algorithms", SISAP 2017
 */
export function buildRealisticDataset(seed: number): {
  points: GoldenPoint[];
  queries: GoldenQuery[];
} {
  const rng = createSeededRng(seed);

  // Generate random normalized dataset points
  const points: GoldenPoint[] = Array.from({ length: DATASET_SIZE }, (_, i) => ({
    id: `p_${i}`,
    vector: generateRandomVector(RECALL_DIM, rng),
    clusterIndex: 0, // Not used in realistic benchmark
  }));

  // Generate random query vectors and compute exact ground truth via brute-force
  const queries: GoldenQuery[] = Array.from({ length: QUERY_COUNT }, (_, i) => {
    const queryVector = generateRandomVector(RECALL_DIM, rng);

    // Compute cosine similarity to all points (brute-force exact k-NN)
    const scored = points.map((p) => ({
      id: p.id,
      score: cosineSimilarity(queryVector, p.vector),
    }));

    // Sort by descending similarity and take top-K as ground truth
    scored.sort((a, b) => b.score - a.score);
    const relevantIds = scored.slice(0, RECALL_K).map((s) => s.id);

    return {
      name: `query_${i}`,
      vector: queryVector,
      relevantIds,
    };
  });

  return { points, queries };
}

/**
 * Legacy function: Build a trivial dataset with one-hot cluster centers.
 * Uses fixed 16-dimensional vectors for backwards compatibility.
 *
 * WARNING: This dataset is trivially easy (100% recall expected) because:
 * - One-hot cluster centers are orthogonal (maximally separated)
 * - Minimal noise means near-zero inter-cluster similarity
 *
 * @deprecated Use buildRealisticDataset for meaningful recall benchmarks
 */
export function buildGoldenDataset(seed: number): {
  points: GoldenPoint[];
  queries: GoldenQuery[];
} {
  // Use fixed legacy dimension (16) to maintain one-hot structure
  const legacyDim = 16;

  const centers: Vec[] = Array.from(
    { length: CLUSTERS_COUNT },
    (_, idx): Vec => {
      const base: Vec = Array.from({ length: legacyDim }, () => 0);
      base[idx] = 1;
      return base;
    }
  );

  const rng = createSeededRng(seed);
  const points: GoldenPoint[] = [];

  centers.forEach((center, clusterIndex) => {
    for (let i = 0; i < POINTS_PER_CLUSTER; i += 1) {
      const noise: Vec = Array.from(
        { length: legacyDim },
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

// Metrics follow standard IR definitions (see Manning et al.,
// "Introduction to Information Retrieval", Chapter 8: Evaluation in information retrieval —
// https://nlp.stanford.edu/IR-book/pdf/08eval.pdf).
export function computeRecall(
  relevantIds: string[],
  retrievedIds: string[]
): number {
  const retrievedSet = new Set(retrievedIds);
  const found = relevantIds.filter((id) => retrievedSet.has(id)).length;
  return found / relevantIds.length;
}

export function computePrecisionAndRecall(
  relevantIds: string[],
  retrievedIds: string[]
): { precision: number; recall: number } {
  const retrievedSet = new Set(retrievedIds);
  const found = relevantIds.filter((id) => retrievedSet.has(id)).length;

  const precision = retrievedIds.length === 0 ? 0 : found / retrievedIds.length;
  const recall = relevantIds.length === 0 ? 0 : found / relevantIds.length;

  return { precision, recall };
}

export function computeF1(
  relevantIds: string[],
  retrievedIds: string[]
): number {
  const { precision, recall } = computePrecisionAndRecall(
    relevantIds,
    retrievedIds
  );
  if (precision === 0 && recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}
