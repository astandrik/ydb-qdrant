import { z } from "zod";

import type {
    DistanceKind,
    Payload,
    WithPayload,
    YdbQdrantPointId,
    YdbQdrantUpsertPoint,
} from "./QdrantRestTypes.js";

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
                id: z.union([
                    z.string(),
                    z.number(),
                ]) as z.ZodType<YdbQdrantPointId>,
                vector: z.array(z.number()),
                payload: z
                    .record(z.string(), z.unknown())
                    .optional() as z.ZodType<Payload | undefined>,
            })
        )
        .min(1),
});

export type UpsertPoint = YdbQdrantUpsertPoint;
export type UpsertPointsBody = { points: UpsertPoint[] };

export const SearchReq = z.object({
    vector: z.array(z.number()).min(1),
    top: z.number().int().positive().max(1000),
    with_payload: z.boolean().optional(),
});

export type SearchPointsBody = {
    vector: number[];
    top?: number;
    limit?: number;
    with_payload?: WithPayload;
    score_threshold?: number | null;
};

export const DeletePointsByIdsReq = z.object({
    points: z
        .array(z.union([z.string(), z.number()]) as z.ZodType<YdbQdrantPointId>)
        .min(1),
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

const DeletePointsEmptyFilter = z.object({
    must: z.array(DeletePointsFilterCondition).max(0),
});

const DeletePointsFilter = z.union([
    DeletePointsFilterMust,
    z.object({
        should: z.array(DeletePointsFilterMust).min(1),
    }),
    DeletePointsEmptyFilter,
]);

export const DeletePointsByFilterReq = z.object({
    filter: DeletePointsFilter,
});

export const DeletePointsReq = z.union([
    DeletePointsByIdsReq,
    DeletePointsByFilterReq,
]);

export const RetrievePointsReq = z.object({
    ids: z
        .array(z.union([z.string(), z.number()]) as z.ZodType<YdbQdrantPointId>)
        .min(1),
    with_payload: z.boolean().optional().default(true),
    with_vector: z.boolean().optional().default(false),
});
