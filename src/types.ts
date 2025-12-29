import { z } from "zod";
import type {
  QdrantPointId,
  QdrantPointStructDense,
  QdrantDenseVector,
} from "./qdrant/QdrantTypes.js";

export type DistanceKind = "Cosine" | "Euclid" | "Dot" | "Manhattan";
export type VectorType = "float";

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
    distance: z.enum([
      "Cosine",
      "Euclid",
      "Dot",
      "Manhattan",
    ]) as z.ZodType<DistanceKind>,
    data_type: z.enum(["float"]).optional(),
  }),
});

export const UpsertPointsReq = z.object({
  points: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]) as z.ZodType<QdrantPointId>,
        vector: z.array(z.number()) as z.ZodType<QdrantDenseVector>,
        payload: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .min(1),
}) as z.ZodType<{ points: QdrantPointStructDense[] }>;

export const SearchReq = z.object({
  vector: z.array(z.number()).min(1) as z.ZodType<QdrantDenseVector>,
  top: z.number().int().positive().max(1000),
  with_payload: z.boolean().optional(),
});

export const DeletePointsByIdsReq = z.object({
  points: z.array(z.union([z.string(), z.number()]) as z.ZodType<QdrantPointId>).min(1),
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
