import { UpsertPointsReq, SearchReq, DeletePointsReq } from "../types.js";
import { ensureMetaTable } from "../ydb/schema.js";
import {
  getCollectionMeta,
  touchCollectionLastAccess,
} from "../repositories/collectionsRepo.js";
import {
  deletePoints as repoDeletePoints,
  deletePointsByPathSegments as repoDeletePointsByPathSegments,
  searchPoints as repoSearchPoints,
  upsertPoints as repoUpsertPoints,
} from "../repositories/pointsRepo.js";
import { logger } from "../logging/logger.js";
import {
  QdrantServiceError,
  isVectorDimensionMismatchError,
} from "./errors.js";
import { type CollectionContextInput } from "./CollectionService.js";
import { normalizeCollectionContextShared } from "./CollectionService.shared.js";
import { resolvePointsTableAndUidOneTable } from "./CollectionService.one-table.js";
import {
  normalizeSearchBodyForSearch,
  normalizeSearchBodyForQuery,
  type SearchNormalizationResult,
} from "../utils/normalization.js";
import type {
  QdrantPayload,
  QdrantPointStructDense,
} from "../qdrant/QdrantTypes.js";

type PointsContextInput = CollectionContextInput;

type InternalScoredPoint = {
  // We always return point ids as strings (we store point_id as Utf8).
  id: string;
  score: number;
  payload?: QdrantPayload;
};

function parsePathSegmentsFilterToPaths(
  filter: unknown
): Array<Array<string>> | null {
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

  const extractMust = (must: unknown): Array<string> | null => {
    if (!Array.isArray(must) || must.length === 0) return null;
    const pairs: Array<{ idx: number; value: string }> = [];
    for (const cond of must) {
      if (!isRecord(cond)) return null;
      const key = cond.key;
      if (typeof key !== "string") return null;
      const m = /^pathSegments\.(\d+)$/.exec(key);
      if (!m) return null;
      const idx = Number(m[1]);
      if (!Number.isInteger(idx) || idx < 0) return null;
      const match = cond.match;
      if (!isRecord(match)) return null;
      const value = match.value;
      if (typeof value !== "string") return null;
      pairs.push({ idx, value });
    }
    pairs.sort((a, b) => a.idx - b.idx);
    // Require contiguous indexes starting from 0 to avoid ambiguous matches.
    for (let i = 0; i < pairs.length; i += 1) {
      if (pairs[i].idx !== i) return null;
    }
    return pairs.map((p) => p.value);
  };

  if (!isRecord(filter)) return null;
  const must = filter.must;
  if (must !== undefined) {
    const path = extractMust(must);
    return path ? [path] : null;
  }
  const should = filter.should;
  if (should !== undefined) {
    if (!Array.isArray(should) || should.length === 0) return null;
    const paths: Array<Array<string>> = [];
    for (const g of should) {
      if (!isRecord(g)) return null;
      const path = extractMust(g.must);
      if (!path) return null;
      paths.push(path);
    }
    return paths;
  }
  return null;
}

export async function upsertPoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{ upserted: number }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContextShared(
    ctx.tenant,
    ctx.collection,
    ctx.apiKey,
    ctx.userAgent
  );
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

  const { tableName, uid } = await resolvePointsTableAndUidOneTable(normalized);
  let upserted: number;
  try {
    // Narrow Qdrant OpenAPI types to the dense-vector subset we support.
    const points: QdrantPointStructDense[] = parsed.data.points;
    upserted = await repoUpsertPoints(
      tableName,
      points,
      meta.dimension,
      uid
    );
  } catch (err: unknown) {
    if (isVectorDimensionMismatchError(err)) {
      logger.warn(
        {
          tenant: normalized.tenant,
          collection: normalized.collection,
          table: tableName,
          dimension: meta.dimension,
        },
        "upsertPoints: vector dimension mismatch"
      );
      throw new QdrantServiceError(400, {
        status: "error",
        error: err.message,
      });
    }
    throw err;
  }

  await touchCollectionLastAccess(normalized.metaKey);

  return { upserted };
}

async function executeSearch(
  ctx: PointsContextInput,
  normalizedSearch: SearchNormalizationResult,
  source: "search" | "query"
): Promise<{
  points: InternalScoredPoint[];
}> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContextShared(
    ctx.tenant,
    ctx.collection,
    ctx.apiKey,
    ctx.userAgent
  );

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

  const { tableName, uid } = await resolvePointsTableAndUidOneTable(normalized);

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

  const filterPaths = parsePathSegmentsFilterToPaths(normalizedSearch.filter);

  let hits;
  try {
    hits = await repoSearchPoints(
      tableName,
      parsed.data.vector,
      parsed.data.top,
      parsed.data.with_payload,
      meta.distance,
      meta.dimension,
      uid,
      filterPaths ?? undefined
    );
  } catch (err: unknown) {
    if (isVectorDimensionMismatchError(err)) {
      logger.warn(
        {
          tenant: normalized.tenant,
          collection: normalized.collection,
          table: tableName,
          dimension: meta.dimension,
          queryVectorLen: parsed.data.vector.length,
        },
        `${source}: vector dimension mismatch`
      );
      throw new QdrantServiceError(400, {
        status: "error",
        error: err.message,
      });
    }
    throw err;
  }

  await touchCollectionLastAccess(normalized.metaKey);

  const threshold = normalizedSearch.scoreThreshold;

  // For Cosine, repository hits use distance scores; convert to a
  // similarity-like score so API consumers and IDE thresholds see
  // "higher is better". This keeps ranking identical (monotonic 1 - d).
  const normalizedHits =
    meta.distance === "Cosine"
      ? hits.map((hit) => ({
          ...hit,
          score: 1 - hit.score,
        }))
      : hits;

  const filtered =
    threshold === undefined
      ? normalizedHits
      : normalizedHits.filter((hit) => {
          if (meta.distance === "Dot" || meta.distance === "Cosine") {
            // Similarity metrics: threshold is minimum similarity.
            return hit.score >= threshold;
          }
          // Euclid / Manhattan: pure distance metrics; threshold is max distance.
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
  points: InternalScoredPoint[];
}> {
  const normalizedSearch = normalizeSearchBodyForSearch(body);
  return await executeSearch(ctx, normalizedSearch, "search");
}

export async function queryPoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{
  points: InternalScoredPoint[];
}> {
  const normalizedSearch = normalizeSearchBodyForQuery(body);
  return await executeSearch(ctx, normalizedSearch, "query");
}

export async function deletePoints(
  ctx: PointsContextInput,
  body: unknown
): Promise<{ deleted: number }> {
  await ensureMetaTable();
  const normalized = normalizeCollectionContextShared(
    ctx.tenant,
    ctx.collection,
    ctx.apiKey,
    ctx.userAgent
  );
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

  const { tableName, uid } = await resolvePointsTableAndUidOneTable(normalized);
  let deleted: number;
  if ("points" in parsed.data) {
    deleted = await repoDeletePoints(tableName, parsed.data.points, uid);
  } else {
    const paths = parsePathSegmentsFilterToPaths(parsed.data.filter);
    if (!paths) {
      throw new QdrantServiceError(400, {
        status: "error",
        error:
          "unsupported delete filter: only pathSegments.N match filters with must/should are supported",
      });
    }
    deleted = await repoDeletePointsByPathSegments(tableName, uid, paths);
  }
  await touchCollectionLastAccess(normalized.metaKey);
  return { deleted };
}
