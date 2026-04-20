import {
    UpsertPointsReq,
    SearchReq,
    DeletePointsReq,
    RetrievePointsReq,
    type UpsertPoint,
} from "../qdrant/Requests.js";
import { ensureMetaTable } from "../ydb/schema.js";
import {
    getCollectionMeta,
    touchCollectionLastAccess,
    deleteAllPointsForCollection,
} from "../repositories/collectionsRepo.js";
import {
    deletePoints as repoDeletePoints,
    deletePointsByPathSegments as repoDeletePointsByPathSegments,
    searchPoints as repoSearchPoints,
    upsertPoints as repoUpsertPoints,
    retrievePointsByIds as repoRetrievePointsByIds,
} from "../repositories/pointsRepo.js";
import { logger } from "../logging/logger.js";
import {
    elapsedMsSince,
    getElapsedMsSinceRequestStart,
    getMonotonicTimeNs,
} from "../logging/requestContext.js";
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
import { normalizePathSegments } from "../utils/pathPrefix.js";
import type { YdbQdrantScoredPoint } from "../qdrant/QdrantRestTypes.js";
import type { RetrievedPoint } from "../repositories/pointsRepo.one-table/Retrieve.js";

type PointsContextInput = CollectionContextInput;
const MAX_LOGGED_UPSERT_PATHS = 20;
const MAX_LOGGED_DELETE_PATHS = 20;

type PathLogFields = {
    pathCount: number;
    paths: string[];
    pathsTruncated: boolean;
};

function isEmptyFilter(filter: unknown): boolean {
    if (typeof filter !== "object" || filter === null) return false;
    const f = filter as { must?: unknown };
    return Array.isArray(f.must) && f.must.length === 0;
}

function parsePathSegmentsFilterToPaths(
    filter: unknown
): Array<Array<string>> | null {
    const extractMust = (must: unknown): Array<string> | null => {
        if (!Array.isArray(must) || must.length === 0) return null;
        const pairs: Array<{ idx: number; value: string }> = [];
        for (const cond of must) {
            if (typeof cond !== "object" || cond === null) return null;
            const c = cond as {
                key?: unknown;
                match?: unknown;
            };
            if (typeof c.key !== "string") return null;
            const m = /^pathSegments\.(\d+)$/.exec(c.key);
            if (!m) return null;
            const idx = Number(m[1]);
            if (!Number.isInteger(idx) || idx < 0) return null;
            if (typeof c.match !== "object" || c.match === null) return null;
            const match = c.match as { value?: unknown };
            if (typeof match.value !== "string") return null;
            pairs.push({ idx, value: match.value });
        }
        pairs.sort((a, b) => a.idx - b.idx);
        // Require contiguous indexes starting from 0 to avoid ambiguous matches.
        for (let i = 0; i < pairs.length; i += 1) {
            if (pairs[i].idx !== i) return null;
        }
        return pairs.map((p) => p.value);
    };

    if (typeof filter !== "object" || filter === null) return null;
    const f = filter as { must?: unknown; should?: unknown };
    if (f.must !== undefined) {
        const path = extractMust(f.must);
        return path ? [path] : null;
    }
    if (f.should !== undefined) {
        if (!Array.isArray(f.should) || f.should.length === 0) return null;
        const paths: Array<Array<string>> = [];
        for (const g of f.should) {
            if (typeof g !== "object" || g === null) return null;
            const group = g as { must?: unknown };
            const path = extractMust(group.must);
            if (!path) return null;
            paths.push(path);
        }
        return paths;
    }
    return null;
}

function collectPathLogFields(
    pathStrings: Iterable<string>,
    maxLoggedPaths: number
): PathLogFields {
    const uniquePaths = new Set<string>();
    const paths: string[] = [];

    for (const path of pathStrings) {
        if (uniquePaths.has(path)) {
            continue;
        }

        uniquePaths.add(path);
        if (paths.length < maxLoggedPaths) {
            paths.push(path);
        }
    }

    return {
        pathCount: uniquePaths.size,
        paths,
        pathsTruncated: uniquePaths.size > paths.length,
    };
}

function collectUpsertPathLogFields(
    points: Array<Pick<UpsertPoint, "payload">>
): PathLogFields {
    const pathStrings: string[] = [];

    for (const point of points) {
        const pathSegments = normalizePathSegments(point.payload?.pathSegments);
        if (!pathSegments) {
            continue;
        }
        pathStrings.push(pathSegments.join("/"));
    }

    return collectPathLogFields(pathStrings, MAX_LOGGED_UPSERT_PATHS);
}

export async function upsertPoints(
    ctx: PointsContextInput,
    body: unknown
): Promise<{ upserted: number }> {
    const serviceStartNs = getMonotonicTimeNs();
    const metaLookupStartNs = getMonotonicTimeNs();
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
        ctx.userAgent
    );
    const meta = await getCollectionMeta(normalized.metaKey);
    const metaLookupMs = elapsedMsSince(metaLookupStartNs);
    if (!meta) {
        throw new QdrantServiceError(404, {
            status: "error",
            error: "collection not found",
        });
    }

    const requestValidationStartNs = getMonotonicTimeNs();
    const parsed = UpsertPointsReq.safeParse(body);
    const requestValidationMs = elapsedMsSince(requestValidationStartNs);
    if (!parsed.success) {
        throw new QdrantServiceError(400, {
            status: "error",
            error: parsed.error.flatten(),
        });
    }

    const uidResolveStartNs = getMonotonicTimeNs();
    const { tableName, uid } = await resolvePointsTableAndUidOneTable(
        normalized
    );
    const uidResolveMs = elapsedMsSince(uidResolveStartNs);
    const upsertPathLogFields = collectUpsertPathLogFields(parsed.data.points);
    logger.info(
        {
            collection: normalized.collection,
            uid,
            pointCount: parsed.data.points.length,
            ...upsertPathLogFields,
        },
        "upsertPoints: payload paths"
    );
    logger.info(
        {
            phase: "upsertPrepare",
            collection: normalized.collection,
            uid,
            metaLookupMs,
            requestValidationMs,
            uidResolveMs,
            pointCount: parsed.data.points.length,
            pathCount: upsertPathLogFields.pathCount,
            timeToHandlerMs: getElapsedMsSinceRequestStart(),
        },
        "upsert: prepare phase"
    );

    const repoStartNs = getMonotonicTimeNs();
    let upserted: number;
    try {
        upserted = await repoUpsertPoints(
            tableName,
            parsed.data.points,
            meta.dimension,
            uid,
            ctx.apiKey
        );
    } catch (err: unknown) {
        if (isVectorDimensionMismatchError(err)) {
            logger.warn(
                {
                    collection: normalized.collection,
                    table: tableName,
                    dimension: meta.dimension,
                    uid,
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
    const repoTotalMs = elapsedMsSince(repoStartNs);

    const lastAccessStartNs = getMonotonicTimeNs();
    await touchCollectionLastAccess(normalized.metaKey);
    const lastAccessMs = elapsedMsSince(lastAccessStartNs);

    logger.info(
        {
            phase: "upsertComplete",
            collection: normalized.collection,
            uid,
            serviceTotalMs: elapsedMsSince(serviceStartNs),
            repoTotalMs,
            lastAccessMs,
            pointCount: parsed.data.points.length,
        },
        "upsert: completed"
    );

    return { upserted };
}

async function executeSearch(
    ctx: PointsContextInput,
    normalizedSearch: SearchNormalizationResult,
    source: "search" | "query"
): Promise<{
    points: YdbQdrantScoredPoint[];
}> {
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
        ctx.userAgent
    );

    logger.info(
        { collection: normalized.collection },
        `${source}: resolve collection meta`
    );

    const meta = await getCollectionMeta(normalized.metaKey);
    if (!meta) {
        logger.warn(
            {
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

    const { tableName, uid } = await resolvePointsTableAndUidOneTable(
        normalized
    );

    logger.info(
        {
            collection: normalized.collection,
            uid,
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
            ctx.apiKey,
            filterPaths ?? undefined
        );
    } catch (err: unknown) {
        if (isVectorDimensionMismatchError(err)) {
            logger.warn(
                {
                    collection: normalized.collection,
                    table: tableName,
                    dimension: meta.dimension,
                    queryVectorLen: parsed.data.vector.length,
                    uid,
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
    points: YdbQdrantScoredPoint[];
}> {
    const normalizedSearch = normalizeSearchBodyForSearch(body);
    return await executeSearch(ctx, normalizedSearch, "search");
}

export async function queryPoints(
    ctx: PointsContextInput,
    body: unknown
): Promise<{
    points: YdbQdrantScoredPoint[];
}> {
    const normalizedSearch = normalizeSearchBodyForQuery(body);
    return await executeSearch(ctx, normalizedSearch, "query");
}

export async function retrievePoints(
    ctx: PointsContextInput,
    body: unknown
): Promise<{ points: RetrievedPoint[] }> {
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
        ctx.userAgent
    );
    const meta = await getCollectionMeta(normalized.metaKey);
    if (!meta) {
        throw new QdrantServiceError(404, {
            status: "error",
            error: "collection not found",
        });
    }

    const parsed = RetrievePointsReq.safeParse(body);
    if (!parsed.success) {
        throw new QdrantServiceError(400, {
            status: "error",
            error: parsed.error.flatten(),
        });
    }

    const { tableName, uid } = await resolvePointsTableAndUidOneTable(
        normalized
    );

    const points = await repoRetrievePointsByIds(
        tableName,
        parsed.data.ids,
        uid,
        ctx.apiKey,
        parsed.data.with_payload
    );

    await touchCollectionLastAccess(normalized.metaKey);

    return { points };
}

/**
 * @returns `deleted` — number of points removed, or `-1` when the exact count
 *          is unavailable (e.g. bulk BATCH DELETE or clear-all-points).
 */
export async function deletePoints(
    ctx: PointsContextInput,
    body: unknown
): Promise<{ deleted: number }> {
    await ensureMetaTable();
    const normalized = normalizeCollectionContextShared(
        ctx.userUid,
        ctx.collection,
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

    const { tableName, uid } = await resolvePointsTableAndUidOneTable(
        normalized
    );
    let deleted: number;
    if ("points" in parsed.data) {
        logger.info(
            {
                collection: normalized.collection,
                uid,
                idCount: parsed.data.points.length,
            },
            "deletePoints: by IDs"
        );
        deleted = await repoDeletePoints(tableName, parsed.data.points, uid);
    } else if (isEmptyFilter(parsed.data.filter)) {
        logger.info(
            { collection: normalized.collection, uid },
            "deletePoints: clear all points"
        );
        await deleteAllPointsForCollection(uid);
        deleted = -1;
    } else {
        const paths = parsePathSegmentsFilterToPaths(parsed.data.filter);
        if (!paths) {
            throw new QdrantServiceError(400, {
                status: "error",
                error: "unsupported delete filter: only pathSegments.N match filters with must/should are supported",
            });
        }
        const deletePathLogFields = collectPathLogFields(
            paths.map((segments) => segments.join("/")),
            MAX_LOGGED_DELETE_PATHS
        );
        logger.info(
            {
                collection: normalized.collection,
                uid,
                ...deletePathLogFields,
            },
            "deletePoints: by pathSegments filter"
        );
        deleted = await repoDeletePointsByPathSegments(tableName, uid, paths);
    }

    logger.info(
        { collection: normalized.collection, uid, deleted },
        "deletePoints: completed"
    );
    await touchCollectionLastAccess(normalized.metaKey);
    return { deleted };
}
