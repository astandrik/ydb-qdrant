import type { Schemas } from "@qdrant/js-client-rest";

/**
 * Centralized Qdrant OpenAPI-derived types (via @qdrant/js-client-rest), narrowed to the
 * subset of shapes that ydb-qdrant currently supports.
 *
 * Important:
 * - Qdrant's schema types are intentionally broad (named vectors, multi-vectors, sparse vectors, inference objects).
 * - Internally we support dense vectors only (`number[]`), so we narrow types accordingly.
 */

export type QdrantPointId = Schemas["ExtendedPointId"];

// Qdrant allows multiple vector representations; we currently support only dense vectors.
export type QdrantDenseVector = Extract<Schemas["VectorStruct"], number[]>;

// Qdrant payload can be null and supports richer shapes; internally we treat payload as a JSON object.
export type QdrantPayload = Record<string, unknown>;

export type QdrantPointStructDense = Omit<
  Schemas["PointStruct"],
  "vector" | "payload"
> & {
  vector: QdrantDenseVector;
  payload?: QdrantPayload;
};

export type QdrantScoredPoint = Schemas["ScoredPoint"];
export type QdrantQueryResponse = Schemas["QueryResponse"];
