import { CreateCollectionReq } from "../qdrant/Requests.js";
import type { DistanceKind } from "../qdrant/QdrantRestTypes.js";
import { ensureMetaTable } from "../ydb/schema.js";
import {
    createCollection as repoCreateCollection,
    countPointsForCollections,
    countPointsForCollection,
    deleteCollection as repoDeleteCollection,
    getCollectionMeta,
    listCollectionsForLegacyUserPrefix,
    listCollectionsForUser,
    touchCollectionLastAccess,
} from "../repositories/collectionsRepo.js";
import { QdrantServiceError } from "./errors.js";
import {
    normalizeCollectionContextShared,
    normalizeUserUidShared,
} from "./CollectionService.shared.js";

export interface CollectionContextInput {
    userUid: string;
    collection: string;
    apiKey: string;
    userAgent?: string;
}

export interface NormalizedCollectionContext {
    userUid: string;
    collection: string;
    metaKey: string;
    uid: string;
}

export interface ListCollectionsContextInput {
    userUid: string;
    apiKey: string;
}

export type ListCollectionsResult = {
    collections: Array<{
        last_accessed_at?: string;
        name: string;
        points_count: number;
        vectors: { size: number; distance: DistanceKind; data_type: string };
    }>;
};

export async function putCollectionIndex(
    ctx: CollectionContextInput
): Promise<{ acknowledged: boolean }> {
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
        ctx.userAgent
    ) as NormalizedCollectionContext;
    const meta = await getCollectionMeta(normalized.metaKey);
    if (!meta) {
        throw new QdrantServiceError(404, {
            status: "error",
            error: "collection not found",
        });
    }
    await touchCollectionLastAccess(normalized.metaKey);
    return { acknowledged: true };
}

export async function createCollection(
    ctx: CollectionContextInput,
    body: unknown
): Promise<{ name: string }> {
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
        ctx.userAgent
    ) as NormalizedCollectionContext;
    const parsed = CreateCollectionReq.safeParse(body);
    if (!parsed.success) {
        throw new QdrantServiceError(400, {
            status: "error",
            error: parsed.error.flatten(),
        });
    }

    const dim = parsed.data.vectors.size;
    const distance = parsed.data.vectors.distance;
    const vectorType = parsed.data.vectors.data_type ?? "float";

    const existing = await getCollectionMeta(normalized.metaKey);
    if (existing) {
        if (
            existing.dimension === dim &&
            existing.distance === distance &&
            existing.vectorType === vectorType
        ) {
            await touchCollectionLastAccess(normalized.metaKey);
            return { name: normalized.collection };
        }

        const errorMessage = `Collection already exists with different config: dimension=${existing.dimension}, distance=${existing.distance}, type=${existing.vectorType}`;
        throw new QdrantServiceError(400, {
            status: "error",
            error: errorMessage,
        });
    }

    await repoCreateCollection(
        normalized.metaKey,
        dim,
        distance,
        vectorType,
        normalized.userUid
    );
    return { name: normalized.collection };
}

export async function getCollection(ctx: CollectionContextInput): Promise<{
    status: string;
    points_count: number;
    name: string;
    vectors: { size: number; distance: DistanceKind; data_type: string };
    config: {
        params: {
            vectors: {
                size: number;
                distance: DistanceKind;
                data_type: string;
            };
        };
    };
}> {
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
        ctx.userAgent
    ) as NormalizedCollectionContext;
    const meta = await getCollectionMeta(normalized.metaKey);
    if (!meta) {
        throw new QdrantServiceError(404, {
            status: "error",
            error: "collection not found",
        });
    }
    const pointsCount = await countPointsForCollection(normalized.uid);
    await touchCollectionLastAccess(normalized.metaKey);
    return {
        status: "green",
        points_count: pointsCount,
        name: normalized.collection,
        vectors: {
            size: meta.dimension,
            distance: meta.distance,
            data_type: meta.vectorType,
        },
        config: {
            params: {
                vectors: {
                    size: meta.dimension,
                    distance: meta.distance,
                    data_type: meta.vectorType,
                },
            },
        },
    };
}

export async function listCollections(
    ctx: ListCollectionsContextInput
): Promise<ListCollectionsResult> {
    await ensureMetaTable();
    const normalizedUserUid = normalizeUserUidShared(ctx.userUid);
    const rawUserUid = ctx.userUid.trim();
    const collectionsByMetaKey = new Map<
        string,
        Awaited<ReturnType<typeof listCollectionsForUser>>[number]
    >();
    const collectionLookups =
        rawUserUid !== normalizedUserUid
            ? [
                  {
                      collectionUserUid: normalizedUserUid,
                      userUid: normalizedUserUid,
                  },
                  {
                      collectionUserUid: normalizedUserUid,
                      userUid: rawUserUid,
                  },
              ]
            : [
                  {
                      collectionUserUid: normalizedUserUid,
                      userUid: normalizedUserUid,
                  },
              ];
    for (const lookup of collectionLookups) {
        const collections = await listCollectionsForUser(lookup);
        for (const collection of collections) {
            if (!collectionsByMetaKey.has(collection.metaKey)) {
                collectionsByMetaKey.set(collection.metaKey, collection);
            }
        }
    }
    const legacyCollections =
        await listCollectionsForLegacyUserPrefix(normalizedUserUid);
    for (const collection of legacyCollections) {
        if (!collectionsByMetaKey.has(collection.metaKey)) {
            collectionsByMetaKey.set(collection.metaKey, collection);
        }
    }
    const collections = Array.from(collectionsByMetaKey.values()).sort((a, b) =>
        a.metaKey.localeCompare(b.metaKey)
    );
    const pointsCounts = await countPointsForCollections(
        collections.map((collection) => collection.metaKey)
    );
    return {
        collections: collections.map((collection) => {
            const result: ListCollectionsResult["collections"][number] = {
                name: collection.name,
                points_count: pointsCounts.get(collection.metaKey) ?? 0,
                vectors: {
                    size: collection.vectorSize,
                    distance: collection.distance,
                    data_type: collection.vectorType,
                },
            };
            if (collection.lastAccessedAt) {
                result.last_accessed_at =
                    collection.lastAccessedAt.toISOString();
            }
            return result;
        }),
    };
}

export async function deleteCollection(
    ctx: CollectionContextInput
): Promise<{ acknowledged: boolean }> {
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
        ctx.userAgent
    ) as NormalizedCollectionContext;
    await repoDeleteCollection(normalized.metaKey);
    return { acknowledged: true };
}
