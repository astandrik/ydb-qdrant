import type { DistanceKind } from "../qdrant/QdrantRestTypes.js";

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
