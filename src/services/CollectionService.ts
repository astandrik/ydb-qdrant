import { CreateCollectionReq, type DistanceKind } from "../types.js";
import { ensureMetaTable } from "../ydb/schema.js";
import {
  createCollection as repoCreateCollection,
  deleteCollection as repoDeleteCollection,
  getCollectionMeta,
} from "../repositories/collectionsRepo.js";
import { QdrantServiceError } from "./errors.js";
import { COLLECTION_STORAGE_MODE, isOneTableMode } from "../config/env.js";
import {
  normalizeCollectionContextShared,
  tableNameFor,
  type NormalizedCollectionContextLike,
} from "./CollectionService.shared.js";
import { resolvePointsTableAndUidMultiTable } from "./CollectionService.multi-table.js";
import { resolvePointsTableAndUidOneTable } from "./CollectionService.one-table.js";

export interface CollectionContextInput {
  tenant: string | undefined;
  collection: string;
}

export interface NormalizedCollectionContext {
  tenant: string;
  collection: string;
  metaKey: string;
}

export function normalizeCollectionContext(
  input: CollectionContextInput
): NormalizedCollectionContext {
  return normalizeCollectionContextShared(
    input.tenant,
    input.collection
  ) as NormalizedCollectionContext;
}

export async function resolvePointsTableAndUid(
  ctx: NormalizedCollectionContext
): Promise<{
  tableName: string;
  uid: string | undefined;
}> {
  if (isOneTableMode(COLLECTION_STORAGE_MODE)) {
    return await resolvePointsTableAndUidOneTable(
      ctx as NormalizedCollectionContextLike
    );
  }
  return resolvePointsTableAndUidMultiTable(
    ctx as NormalizedCollectionContextLike
  );
}

export async function putCollectionIndex(
  ctx: CollectionContextInput
): Promise<{ acknowledged: boolean }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContext(ctx);
  const meta = await getCollectionMeta(normalized.metaKey);
  if (!meta) {
    throw new QdrantServiceError(404, {
      status: "error",
      error: "collection not found",
    });
  }
  return { acknowledged: true };
}

export async function createCollection(
  ctx: CollectionContextInput,
  body: unknown
): Promise<{ name: string; tenant: string }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContext(ctx);
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
      return { name: normalized.collection, tenant: normalized.tenant };
    }

    const errorMessage = `Collection already exists with different config: dimension=${existing.dimension}, distance=${existing.distance}, type=${existing.vectorType}`;
    throw new QdrantServiceError(400, {
      status: "error",
      error: errorMessage,
    });
  }

  const tableName = tableNameFor(normalized.tenant, normalized.collection);
  await repoCreateCollection(
    normalized.metaKey,
    dim,
    distance,
    vectorType,
    tableName
  );
  return { name: normalized.collection, tenant: normalized.tenant };
}

export async function getCollection(ctx: CollectionContextInput): Promise<{
  name: string;
  vectors: { size: number; distance: DistanceKind; data_type: string };
}> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContext(ctx);
  const meta = await getCollectionMeta(normalized.metaKey);
  if (!meta) {
    throw new QdrantServiceError(404, {
      status: "error",
      error: "collection not found",
    });
  }
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
  const normalized = normalizeCollectionContext(ctx);
  const { uid } = await resolvePointsTableAndUid(normalized);
  await repoDeleteCollection(normalized.metaKey, uid);
  return { acknowledged: true };
}
