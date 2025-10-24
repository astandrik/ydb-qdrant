import { Router, Request, Response } from "express";
import {
  sanitizeCollectionName,
  sanitizeTenantId,
  metaKeyFor,
} from "../utils/tenant";
import { DeletePointsReq, SearchReq, UpsertPointsReq } from "../types";
function isNumArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => typeof x === "number");
}

function extractVectorLoose(body: any, depth = 0): number[] | undefined {
  if (!body || depth > 3) return undefined;
  // Prefer common names first
  if (isNumArray(body.vector)) return body.vector;
  if (isNumArray(body.embedding)) return body.embedding;
  if (isNumArray(body?.query?.vector)) return body.query.vector;
  if (isNumArray(body?.query?.nearest?.vector))
    return body.query.nearest.vector;
  if (isNumArray(body?.nearest?.vector)) return body.nearest.vector;
  // Fallback: shallow search among object values
  for (const key of Object.keys(body)) {
    const val = (body as any)[key];
    if (isNumArray(val)) return val;
  }
  // Recurse a bit into objects
  for (const key of Object.keys(body)) {
    const val = (body as any)[key];
    if (val && typeof val === "object") {
      const found = extractVectorLoose(val, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

import { ensureMetaTable } from "../ydb/schema";
import { getCollectionMeta } from "../repositories/collectionsRepo";
import {
  deletePoints as repoDelete,
  searchPoints as repoSearch,
  upsertPoints as repoUpsert,
} from "../repositories/pointsRepo";
import { logger } from "../logging/logger";

export const pointsRouter = Router();

// Qdrant-compatible: PUT /collections/:collection/points (upsert)
pointsRouter.put("/:collection/points", async (req: Request, res: Response) => {
  try {
    await ensureMetaTable();
    const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
    const collection = sanitizeCollectionName(String(req.params.collection));
    const metaKey = metaKeyFor(tenant, collection);
    const meta = await getCollectionMeta(metaKey);
    if (!meta)
      return res
        .status(404)
        .json({ status: "error", error: "collection not found" });
    const parsed = UpsertPointsReq.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ status: "error", error: parsed.error.flatten() });
    const n = await repoUpsert(
      meta.table,
      parsed.data.points,
      meta.vectorType,
      meta.dimension
    );
    res.json({ status: "ok", result: { upserted: n } });
  } catch (err: any) {
    logger.error({ err }, "upsert points (PUT) failed");
    res
      .status(500)
      .json({ status: "error", error: String(err?.message ?? err) });
  }
});

pointsRouter.post(
  "/:collection/points/upsert",
  async (req: Request, res: Response) => {
    try {
      await ensureMetaTable();
      const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
      const collection = sanitizeCollectionName(String(req.params.collection));
      const metaKey = metaKeyFor(tenant, collection);
      const meta = await getCollectionMeta(metaKey);
      if (!meta)
        return res
          .status(404)
          .json({ status: "error", error: "collection not found" });
      const parsed = UpsertPointsReq.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ status: "error", error: parsed.error.flatten() });
      const n = await repoUpsert(
        meta.table,
        parsed.data.points,
        meta.vectorType,
        meta.dimension
      );
      res.json({ status: "ok", result: { upserted: n } });
    } catch (err: any) {
      logger.error({ err }, "upsert points failed");
      res
        .status(500)
        .json({ status: "error", error: String(err?.message ?? err) });
    }
  }
);

pointsRouter.post(
  "/:collection/points/search",
  async (req: Request, res: Response) => {
    try {
      await ensureMetaTable();
      const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
      const collection = sanitizeCollectionName(String(req.params.collection));
      logger.info({ tenant, collection }, "search: resolve collection meta");
      const metaKey = metaKeyFor(tenant, collection);
      const meta = await getCollectionMeta(metaKey);
      if (!meta) {
        logger.warn(
          { tenant, collection, metaKey },
          "search: collection not found"
        );
        return res
          .status(404)
          .json({ status: "error", error: "collection not found" });
      }
      // Normalize common Qdrant variants: allow { limit } alias for top
      const normalized = {
        vector: Array.isArray((req.body as any)?.vector)
          ? (req.body as any).vector
          : undefined,
        top:
          typeof (req.body as any)?.top === "number"
            ? (req.body as any).top
            : typeof (req.body as any)?.limit === "number"
            ? (req.body as any).limit
            : undefined,
        with_payload:
          typeof (req.body as any)?.with_payload === "boolean"
            ? (req.body as any).with_payload
            : Array.isArray((req.body as any)?.with_payload) ||
              typeof (req.body as any)?.with_payload === "object"
            ? true
            : undefined,
      };
      const scoreThreshold = Number.isFinite(
        Number((req.body as any)?.score_threshold)
      )
        ? Number((req.body as any)?.score_threshold)
        : undefined;
      const parsed = SearchReq.safeParse(normalized);
      if (!parsed.success) {
        logger.warn(
          { tenant, collection, issues: parsed.error.issues },
          "search: invalid payload"
        );
        return res
          .status(400)
          .json({ status: "error", error: parsed.error.flatten() });
      }
      logger.info(
        {
          tenant,
          collection,
          top: parsed.data.top,
          queryVectorLen: parsed.data.vector.length,
          collectionDim: meta.dimension,
          distance: meta.distance,
          vectorType: meta.vectorType,
        },
        "search: executing"
      );
      const hits = await repoSearch(
        meta.table,
        parsed.data.vector,
        parsed.data.top,
        parsed.data.with_payload,
        meta.distance,
        meta.vectorType,
        meta.dimension
      );
      // Apply score_threshold semantics similar to Qdrant
      const filtered =
        scoreThreshold === undefined
          ? hits
          : hits.filter((h) =>
              meta.distance === "Cosine" || meta.distance === "Dot"
                ? h.score >= scoreThreshold
                : h.score <= scoreThreshold
            );
      logger.info(
        { tenant, collection, hits: hits.length },
        "search: completed"
      );
      res.json({ status: "ok", result: { points: filtered } });
    } catch (err: any) {
      logger.error({ err }, "search points failed");
      res
        .status(500)
        .json({ status: "error", error: String(err?.message ?? err) });
    }
  }
);

// Compatibility: some clients call POST /collections/:collection/points/query
pointsRouter.post(
  "/:collection/points/query",
  async (req: Request, res: Response) => {
    try {
      await ensureMetaTable();
      const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
      const collection = sanitizeCollectionName(String(req.params.collection));
      logger.info({ tenant, collection }, "query: resolve collection meta");
      const metaKey = metaKeyFor(tenant, collection);
      const meta = await getCollectionMeta(metaKey);
      if (!meta) {
        logger.warn(
          { tenant, collection, metaKey },
          "query: collection not found"
        );
        return res
          .status(404)
          .json({ status: "error", error: "collection not found" });
      }
      // Normalize common Qdrant variants: allow { query: { vector }, limit } and with_payload as array/object
      const qb = req.body as any;
      const qvec = extractVectorLoose(qb);
      const norm = {
        vector: qvec,
        top:
          typeof qb?.top === "number"
            ? qb.top
            : typeof qb?.limit === "number"
            ? qb.limit
            : undefined,
        with_payload:
          typeof qb?.with_payload === "boolean"
            ? qb.with_payload
            : Array.isArray(qb?.with_payload) ||
              typeof qb?.with_payload === "object"
            ? true
            : undefined,
      };
      const scoreThresholdQ = Number.isFinite(Number(qb?.score_threshold))
        ? Number(qb?.score_threshold)
        : undefined;
      const parsed = SearchReq.safeParse(norm);
      if (!parsed.success) {
        logger.warn(
          { tenant, collection, issues: parsed.error.issues },
          "query: invalid payload"
        );
        return res
          .status(400)
          .json({ status: "error", error: parsed.error.flatten() });
      }
      logger.info(
        {
          tenant,
          collection,
          top: parsed.data.top,
          queryVectorLen: parsed.data.vector.length,
          collectionDim: meta.dimension,
          distance: meta.distance,
          vectorType: meta.vectorType,
        },
        "query: executing"
      );
      const hits = await repoSearch(
        meta.table,
        parsed.data.vector,
        parsed.data.top,
        parsed.data.with_payload,
        meta.distance,
        meta.vectorType,
        meta.dimension
      );
      const filteredQ =
        scoreThresholdQ === undefined
          ? hits
          : hits.filter((h) =>
              meta.distance === "Cosine" || meta.distance === "Dot"
                ? h.score >= scoreThresholdQ
                : h.score <= scoreThresholdQ
            );
      logger.info(
        { tenant, collection, hits: hits.length },
        "query: completed"
      );
      res.json({ status: "ok", result: { points: filteredQ } });
    } catch (err: any) {
      logger.error({ err }, "search points (query) failed");
      res
        .status(500)
        .json({ status: "error", error: String(err?.message ?? err) });
    }
  }
);

pointsRouter.post(
  "/:collection/points/delete",
  async (req: Request, res: Response) => {
    try {
      await ensureMetaTable();
      const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
      const collection = sanitizeCollectionName(String(req.params.collection));
      const metaKey = metaKeyFor(tenant, collection);
      const meta = await getCollectionMeta(metaKey);
      if (!meta)
        return res
          .status(404)
          .json({ status: "error", error: "collection not found" });
      const parsed = DeletePointsReq.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ status: "error", error: parsed.error.flatten() });
      const n = await repoDelete(meta.table, parsed.data.points);
      res.json({ status: "ok", result: { deleted: n } });
    } catch (err: any) {
      logger.error({ err }, "delete points failed");
      res
        .status(500)
        .json({ status: "error", error: String(err?.message ?? err) });
    }
  }
);
