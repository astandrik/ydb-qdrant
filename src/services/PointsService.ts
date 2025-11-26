import { UpsertPointsReq, SearchReq, DeletePointsReq } from "../types.js";
import { ensureMetaTable } from "../ydb/schema.js";
import { getCollectionMeta } from "../repositories/collectionsRepo.js";
import {
  deletePoints as repoDeletePoints,
  searchPoints as repoSearchPoints,
  upsertPoints as repoUpsertPoints,
} from "../repositories/pointsRepo.js";
import { requestIndexBuild } from "../indexing/IndexScheduler.js";
import { logger } from "../logging/logger.js";
import { VECTOR_INDEX_BUILD_ENABLED } from "../config/env.js";
import { QdrantServiceError } from "./errors.js";
import {
  normalizeCollectionContext,
  type CollectionContextInput,
} from "./CollectionService.js";
import {
  normalizeSearchBodyForSearch,
  normalizeSearchBodyForQuery,
  type SearchNormalizationResult,
} from "../utils/normalization.js";

type PointsContextInput = CollectionContextInput;

let loggedIndexBuildDisabled = false;

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
    meta.dimension
  );

  if (VECTOR_INDEX_BUILD_ENABLED) {
    requestIndexBuild(
      meta.table,
      meta.dimension,
      meta.distance,
      meta.vectorType
    );
  } else if (!loggedIndexBuildDisabled) {
    logger.info(
      { table: meta.table },
      "vector index building disabled by env; skipping automatic emb_idx rebuilds"
    );
    loggedIndexBuildDisabled = true;
  }

  return { upserted };
}

async function executeSearch(
  ctx: PointsContextInput,
  normalizedSearch: SearchNormalizationResult,
  source: "search" | "query"
): Promise<{
  points: Array<{
    id: string;
    score: number;
    payload?: Record<string, unknown>;
  }>;
}> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContext(ctx);

  logger.info(
    { tenant: normalized.tenant, collection: normalized.collection },
    `${source}: resolve collection meta`
  );

  const meta = await getCollectionMeta(normalized.metaKey);
  if (!meta) {
    logger.warn(
      {
        tenant: normalized.tenant,
        collection: normalized.collection,
        metaKey: normalized.metaKey,
      },
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
    {
      tenant: normalized.tenant,
      collection: normalized.collection,
      hits: hits.length,
    },
    `${source}: completed`
  );

  return { points: filtered };
}

export async function searchPoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{
  points: Array<{
    id: string;
    score: number;
    payload?: Record<string, unknown>;
  }>;
}> {
  const normalizedSearch = normalizeSearchBodyForSearch(body);
  return await executeSearch(ctx, normalizedSearch, "search");
}

export async function queryPoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{
  points: Array<{
    id: string;
    score: number;
    payload?: Record<string, unknown>;
  }>;
}> {
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
