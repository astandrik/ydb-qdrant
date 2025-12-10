import { CreateCollectionReq, type DistanceKind } from "../types.js";
import { ensureMetaTable } from "../ydb/schema.js";
import {
  createCollection as repoCreateCollection,
  deleteCollection as repoDeleteCollection,
  getCollectionMeta,
  touchCollectionLastAccess,
} from "../repositories/collectionsRepo.js";
import { QdrantServiceError } from "./errors.js";
import { normalizeCollectionContextShared } from "./CollectionService.shared.js";

export interface CollectionContextInput {
  tenant: string | undefined;
  collection: string;
  apiKey?: string;
  userAgent?: string;
}

export interface NormalizedCollectionContext {
  tenant: string;
  collection: string;
  metaKey: string;
}

export async function putCollectionIndex(
  ctx: CollectionContextInput
): Promise<{ acknowledged: boolean }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContextShared(
    ctx.tenant,
    ctx.collection,
    ctx.apiKey,
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
): Promise<{ name: string; tenant: string }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContextShared(
    ctx.tenant,
    ctx.collection,
    ctx.apiKey,
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
      return { name: normalized.collection, tenant: normalized.tenant };
    }

    const errorMessage = `Collection already exists with different config: dimension=${existing.dimension}, distance=${existing.distance}, type=${existing.vectorType}`;
    throw new QdrantServiceError(400, {
      status: "error",
      error: errorMessage,
    });
  }

  await repoCreateCollection(normalized.metaKey, dim, distance, vectorType);
  await touchCollectionLastAccess(normalized.metaKey);
  return { name: normalized.collection, tenant: normalized.tenant };
}

export async function getCollection(ctx: CollectionContextInput): Promise<{
  name: string;
  vectors: { size: number; distance: DistanceKind; data_type: string };
}> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContextShared(
    ctx.tenant,
    ctx.collection,
    ctx.apiKey,
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
  return {
    name: normalized.collection,
    vectors: {
      size: meta.dimension,
      distance: meta.distance,
      data_type: meta.vectorType,
    },
  };
}

export async function deleteCollection(
  ctx: CollectionContextInput
): Promise<{ acknowledged: boolean }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContextShared(
    ctx.tenant,
    ctx.collection,
    ctx.apiKey,
    ctx.userAgent
  ) as NormalizedCollectionContext;
  await repoDeleteCollection(normalized.metaKey);
  return { acknowledged: true };
}
