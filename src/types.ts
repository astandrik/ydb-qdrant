import { z } from "zod";

export type DistanceKind = "Cosine" | "Euclid" | "Dot" | "Manhattan";
export type VectorType = "float" | "uint8";

export const CreateCollectionReq = z.object({
  vectors: z.object({
    size: z.number().int().positive(),
    distance: z.enum([
      "Cosine",
      "Euclid",
      "Dot",
      "Manhattan",
    ]) as z.ZodType<DistanceKind>,
    data_type: z.enum(["float", "uint8"]).optional(),
  }),
});

export const UpsertPointsReq = z.object({
  points: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        vector: z.array(z.number()),
        payload: z.record(z.string(), z.any()).optional(),
      })
    )
    .min(1),
});

export const SearchReq = z.object({
  vector: z.array(z.number()).min(1),
  top: z.number().int().positive().max(1000),
  with_payload: z.boolean().optional(),
});

export const DeletePointsReq = z.object({
  points: z.array(z.union([z.string(), z.number()])).min(1),
});
