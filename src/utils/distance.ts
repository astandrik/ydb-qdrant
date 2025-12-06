import type { DistanceKind } from "../types.js";

export function mapDistanceToKnnFn(distance: DistanceKind): {
  fn: string;
  order: "ASC" | "DESC";
} {
  switch (distance) {
    case "Cosine":
      return { fn: "Knn::CosineDistance", order: "ASC" };
    case "Dot":
      return { fn: "Knn::InnerProductSimilarity", order: "DESC" };
    case "Euclid":
      return { fn: "Knn::EuclideanDistance", order: "ASC" };
    case "Manhattan":
      return { fn: "Knn::ManhattanDistance", order: "ASC" };
    default:
      return { fn: "Knn::CosineDistance", order: "ASC" };
  }
}

/**
 * Maps a user-specified distance metric to a YDB Knn function
 * suitable for bit-quantized vectors (Phase 1 approximate candidate selection).
 * Cosine uses similarity (DESC); other metrics use distance (ASC).
 * For Dot, falls back to CosineDistance as a proxy since there is no
 * direct distance equivalent for inner product.
 */
export function mapDistanceToBitKnnFn(distance: DistanceKind): {
  fn: string;
  order: "ASC" | "DESC";
} {
  switch (distance) {
    case "Cosine":
      return { fn: "Knn::CosineSimilarity", order: "DESC" };
    case "Dot":
      return { fn: "Knn::CosineDistance", order: "ASC" };
    case "Euclid":
      return { fn: "Knn::EuclideanDistance", order: "ASC" };
    case "Manhattan":
      return { fn: "Knn::ManhattanDistance", order: "ASC" };
    default:
      return { fn: "Knn::CosineDistance", order: "ASC" };
  }
}
