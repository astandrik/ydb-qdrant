import type { DistanceKind } from "../types.js";

export function mapDistanceToKnnFn(distance: DistanceKind): {
  fn: string;
  order: "ASC" | "DESC";
} {
  switch (distance) {
    case "Cosine":
      return { fn: "Knn::CosineSimilarity", order: "DESC" };
    case "Dot":
      return { fn: "Knn::InnerProductSimilarity", order: "DESC" };
    case "Euclid":
      return { fn: "Knn::EuclideanDistance", order: "ASC" };
    case "Manhattan":
      return { fn: "Knn::ManhattanDistance", order: "ASC" };
    default:
      return { fn: "Knn::CosineSimilarity", order: "DESC" };
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
