import type { Schemas } from "@qdrant/js-client-rest";

/**
 * Type-only surface derived from Qdrant's official REST OpenAPI schema.
 *
 * Important:
 * - This module must remain type-only (no runtime imports/exports from @qdrant/*).
 * - Prefer referencing these aliases across the codebase to keep our shapes aligned
 *   with upstream Qdrant where appropriate, while preserving our runtime behavior.
 */

export type QdrantSchemas = Schemas;

export type QdrantDistance = Schemas["Distance"];
export type QdrantExtendedPointId = Schemas["ExtendedPointId"];
export type QdrantPayload = Schemas["Payload"];

export type QdrantFilter = Schemas["Filter"];
export type QdrantPointsSelector = Schemas["PointsSelector"];
export type QdrantPointStruct = Schemas["PointStruct"];
export type QdrantSearchRequest = Schemas["SearchRequest"];
export type QdrantScoredPoint = Schemas["ScoredPoint"];
export type QdrantWithPayloadInterface = Schemas["WithPayloadInterface"];

/**
 * Project-specific narrowing for our Qdrant-compatible subset.
 * These types are intentionally tighter than Qdrant's full schema.
 */

export type YdbQdrantPointId = Extract<QdrantExtendedPointId, string | number>;

export type YdbQdrantVector = number[];

export type YdbQdrantUpsertPoint = Omit<
  QdrantPointStruct,
  "id" | "vector" | "payload"
> & {
  id: YdbQdrantPointId;
  vector: YdbQdrantVector;
  payload?: QdrantPayload;
};

export type YdbQdrantScoredPoint = {
  id: string;
  score: QdrantScoredPoint["score"];
  payload?: QdrantPayload;
};
