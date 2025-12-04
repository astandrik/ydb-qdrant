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

export function mapDistanceToIndexParam(distance: DistanceKind): string {
  switch (distance) {
    case "Cosine":
      return "cosine";
    case "Dot":
      return "inner_product";
    case "Euclid":
      return "euclidean";
    case "Manhattan":
      return "manhattan";
    default:
      return "cosine";
  }
}

/**
 * Maps a user-specified distance metric to a YDB Knn distance function
 * suitable for bit-quantized vectors (Phase 1 approximate candidate selection).
 * Always returns a distance function (lower is better, ASC ordering).
 * For Dot, falls back to CosineDistance as a proxy since there is no
 * direct distance equivalent for inner product.
 */
export function mapDistanceToBitKnnFn(distance: DistanceKind): {
  fn: string;
  order: "ASC";
} {
  switch (distance) {
    case "Cosine":
      return { fn: "Knn::CosineDistance", order: "ASC" };
    case "Dot":
      // No direct distance equivalent; use Cosine as proxy
      return { fn: "Knn::CosineDistance", order: "ASC" };
    case "Euclid":
      return { fn: "Knn::EuclideanDistance", order: "ASC" };
    case "Manhattan":
      return { fn: "Knn::ManhattanDistance", order: "ASC" };
    default:
      return { fn: "Knn::CosineDistance", order: "ASC" };
  }
}
