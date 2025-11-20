import {
  sanitizeCollectionName,
  sanitizeTenantId,
  metaKeyFor,
  tableNameFor,
} from "../utils/tenant.js";
import {
  CreateCollectionReq,
  DeletePointsReq,
  SearchReq,
  UpsertPointsReq,
  type DistanceKind,
} from "../types.js";
import { ensureMetaTable } from "../ydb/schema.js";
import {
  createCollection as repoCreateCollection,
  deleteCollection as repoDeleteCollection,
  getCollectionMeta,
} from "../repositories/collectionsRepo.js";
import {
  deletePoints as repoDeletePoints,
  searchPoints as repoSearchPoints,
  upsertPoints as repoUpsertPoints,
} from "../repositories/pointsRepo.js";
import { requestIndexBuild } from "../indexing/IndexScheduler.js";
import { logger } from "../logging/logger.js";

export interface QdrantServiceErrorPayload {
  status: "error";
  error: unknown;
}

export class QdrantServiceError extends Error {
  readonly statusCode: number;
  readonly payload: QdrantServiceErrorPayload;

  constructor(statusCode: number, payload: QdrantServiceErrorPayload, message?: string) {
    super(message ?? String(payload.error));
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

interface CollectionContextInput {
  tenant: string | undefined;
  collection: string;
}

interface NormalizedCollectionContext {
  tenant: string;
  collection: string;
  metaKey: string;
}

function normalizeCollectionContext(input: CollectionContextInput): NormalizedCollectionContext {
  const tenant = sanitizeTenantId(input.tenant);
  const collection = sanitizeCollectionName(input.collection);
  const metaKey = metaKeyFor(tenant, collection);
  return { tenant, collection, metaKey };
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

export async function getCollection(
  ctx: CollectionContextInput
): Promise<{
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
  await repoDeleteCollection(normalized.metaKey);
  return { acknowledged: true };
}

interface PointsContextInput extends CollectionContextInput {}

interface SearchNormalizationResult {
  vector: number[] | undefined;
  top: number | undefined;
  withPayload: boolean | undefined;
  scoreThreshold: number | undefined;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((x) => typeof x === "number");
}

function extractVectorLoose(body: unknown, depth = 0): number[] | undefined {
  if (!body || typeof body !== "object" || depth > 3) {
    return undefined;
  }
  const obj = body as Record<string, unknown>;

  if (isNumberArray(obj.vector)) return obj.vector;
  if (isNumberArray(obj.embedding)) return obj.embedding;

  const query = obj.query as Record<string, unknown> | undefined;
  if (query) {
    const queryVector = (query as any).vector;
    if (isNumberArray(queryVector)) return queryVector;
    const nearest = (query as any).nearest as Record<string, unknown> | undefined;
    if (nearest && isNumberArray(nearest.vector)) {
      return nearest.vector;
    }
  }

  const nearest = obj.nearest as Record<string, unknown> | undefined;
  if (nearest && isNumberArray(nearest.vector)) {
    return nearest.vector;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (isNumberArray(value)) {
      return value;
    }
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === "object") {
      const found = extractVectorLoose(value, depth + 1);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function normalizeSearchBodyForSearch(body: unknown): SearchNormalizationResult {
  const b = body as any;
  const vector = Array.isArray(b?.vector) ? b.vector : undefined;
  const topFromTop = typeof b?.top === "number" ? b.top : undefined;
  const topFromLimit = typeof b?.limit === "number" ? b.limit : undefined;
  const top = topFromTop ?? topFromLimit;

  let withPayload: boolean | undefined;
  const rawWithPayload = b?.with_payload;
  if (typeof rawWithPayload === "boolean") {
    withPayload = rawWithPayload;
  } else if (Array.isArray(rawWithPayload) || typeof rawWithPayload === "object") {
    withPayload = true;
  }

  const thresholdValue = Number(b?.score_threshold);
  const scoreThreshold = Number.isFinite(thresholdValue) ? thresholdValue : undefined;

  return { vector, top, withPayload, scoreThreshold };
}

function normalizeSearchBodyForQuery(body: unknown): SearchNormalizationResult {
  const b = body as any;
  const vector = extractVectorLoose(b);
  const topFromTop = typeof b?.top === "number" ? b.top : undefined;
  const topFromLimit = typeof b?.limit === "number" ? b.limit : undefined;
  const top = topFromTop ?? topFromLimit;

  let withPayload: boolean | undefined;
  const rawWithPayload = b?.with_payload;
  if (typeof rawWithPayload === "boolean") {
    withPayload = rawWithPayload;
  } else if (Array.isArray(rawWithPayload) || typeof rawWithPayload === "object") {
    withPayload = true;
  }

  const thresholdValue = Number(b?.score_threshold);
  const scoreThreshold = Number.isFinite(thresholdValue) ? thresholdValue : undefined;

  return { vector, top, withPayload, scoreThreshold };
}

export async function upsertPoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{ upserted: number }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContext(ctx);
  const meta = await getCollectionMeta(normalized.metaKey);
  if (!meta) {
    throw new QdrantServiceError(404, {
      status: "error",
      error: "collection not found",
    });
  }

  const parsed = UpsertPointsReq.safeParse(body);
  if (!parsed.success) {
    throw new QdrantServiceError(400, {
      status: "error",
      error: parsed.error.flatten(),
    });
  }

  const upserted = await repoUpsertPoints(
    meta.table,
    parsed.data.points,
    meta.vectorType,
    meta.dimension
  );

  requestIndexBuild(
    meta.table,
    meta.dimension,
    meta.distance,
    meta.vectorType
  );

  return { upserted };
}

async function executeSearch(
  ctx: PointsContextInput,
  normalizedSearch: SearchNormalizationResult,
  source: "search" | "query"
): Promise<{ points: Array<{ id: string; score: number; payload?: Record<string, unknown> }> }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContext(ctx);

  logger.info(
    { tenant: normalized.tenant, collection: normalized.collection },
    `${source}: resolve collection meta`
  );

  const meta = await getCollectionMeta(normalized.metaKey);
  if (!meta) {
    logger.warn(
      { tenant: normalized.tenant, collection: normalized.collection, metaKey: normalized.metaKey },
      `${source}: collection not found`
    );
    throw new QdrantServiceError(404, {
      status: "error",
      error: "collection not found",
    });
  }

  const parsed = SearchReq.safeParse({
    vector: normalizedSearch.vector,
    top: normalizedSearch.top,
    with_payload: normalizedSearch.withPayload,
  });

  if (!parsed.success) {
    logger.warn(
      {
        tenant: normalized.tenant,
        collection: normalized.collection,
        issues: parsed.error.issues,
      },
      `${source}: invalid payload`
    );
    throw new QdrantServiceError(400, {
      status: "error",
      error: parsed.error.flatten(),
    });
  }

  logger.info(
    {
      tenant: normalized.tenant,
      collection: normalized.collection,
      top: parsed.data.top,
      queryVectorLen: parsed.data.vector.length,
      collectionDim: meta.dimension,
      distance: meta.distance,
      vectorType: meta.vectorType,
    },
    `${source}: executing`
  );

  const hits = await repoSearchPoints(
    meta.table,
    parsed.data.vector,
    parsed.data.top,
    parsed.data.with_payload,
    meta.distance,
    meta.vectorType,
    meta.dimension
  );

  const threshold = normalizedSearch.scoreThreshold;
  const filtered =
    threshold === undefined
      ? hits
      : hits.filter((hit) => {
          const isSimilarity =
            meta.distance === "Cosine" || meta.distance === "Dot";
          if (isSimilarity) {
            return hit.score >= threshold;
          }
          return hit.score <= threshold;
        });

  logger.info(
    { tenant: normalized.tenant, collection: normalized.collection, hits: hits.length },
    `${source}: completed`
  );

  return { points: filtered };
}

export async function searchPoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{ points: Array<{ id: string; score: number; payload?: Record<string, unknown> }> }> {
  const normalizedSearch = normalizeSearchBodyForSearch(body);
  return await executeSearch(ctx, normalizedSearch, "search");
}

export async function queryPoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{ points: Array<{ id: string; score: number; payload?: Record<string, unknown> }> }> {
  const normalizedSearch = normalizeSearchBodyForQuery(body);
  return await executeSearch(ctx, normalizedSearch, "query");
}

export async function deletePoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{ deleted: number }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContext(ctx);
  const meta = await getCollectionMeta(normalized.metaKey);
  if (!meta) {
    throw new QdrantServiceError(404, {
      status: "error",
      error: "collection not found",
    });
  }

  const parsed = DeletePointsReq.safeParse(body);
  if (!parsed.success) {
    throw new QdrantServiceError(400, {
      status: "error",
      error: parsed.error.flatten(),
    });
  }

  const deleted = await repoDeletePoints(meta.table, parsed.data.points);
  return { deleted };
}


