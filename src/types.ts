import { z } from "zod";
import type {
  QdrantDistance,
  QdrantPointId,
  QdrantDenseVector,
} from "./qdrant/QdrantTypes.js";

const DISTANCE_KIND_VALUES = [
  "Cosine",
  "Euclid",
  "Dot",
  "Manhattan",
] as const satisfies readonly QdrantDistance[];

export const DistanceKindSchema = z.enum(DISTANCE_KIND_VALUES);
export type DistanceKind = QdrantDistance;

export const VectorTypeSchema = z.literal("float");
export type VectorType = z.infer<typeof VectorTypeSchema>;

export const PointIdSchema = z.union([z.string(), z.number()]);
export type PointId = QdrantPointId;

export const DenseVectorSchema = z.array(z.number());
export type DenseVector = QdrantDenseVector;

/**
 * Collection metadata from qdr__collections table.
 *
 * @property lastAccessedAt - Timestamp of last access; undefined for collections
 * created before this feature, null if explicitly unset.
 */
export interface CollectionMeta {
  table: string;
  dimension: number;
  distance: DistanceKind;
  vectorType: VectorType;
  lastAccessedAt?: Date | null;
}

export const CreateCollectionReq = z.object({
  vectors: z.object({
    size: z.number().int().positive(),
    distance: DistanceKindSchema,
    data_type: VectorTypeSchema.optional(),
  }),
});

export const UpsertPointSchema = z.object({
  id: PointIdSchema,
  vector: DenseVectorSchema,
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const UpsertPointsReq = z.object({
  points: z.array(UpsertPointSchema).min(1),
});

export const SearchReq = z.object({
  vector: DenseVectorSchema.min(1),
  top: z.number().int().positive().max(1000),
  with_payload: z.boolean().optional(),
});

export const DeletePointsByIdsReq = z.object({
  points: z.array(PointIdSchema).min(1),
});

const DeletePointsFilterCondition = z.object({
  key: z.string(),
  match: z.object({
    value: z.string(),
  }),
});

const DeletePointsFilterMust = z.object({
  must: z.array(DeletePointsFilterCondition).min(1),
});

const DeletePointsFilter = z.union([
  DeletePointsFilterMust,
  z.object({
    should: z.array(DeletePointsFilterMust).min(1),
  }),
]);

export const DeletePointsByFilterReq = z.object({
  filter: DeletePointsFilter,
});

export const DeletePointsReq = z.union([
  DeletePointsByIdsReq,
  DeletePointsByFilterReq,
]);

// Schema-driven request body types (preferred).
export type CreateCollectionBody = z.infer<typeof CreateCollectionReq>;
export type UpsertPointsBody = z.infer<typeof UpsertPointsReq>;
export type SearchBody = z.infer<typeof SearchReq>;
export type DeletePointsBody = z.infer<typeof DeletePointsReq>;
