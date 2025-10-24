import { Router, Request, Response } from "express";
import {
  sanitizeCollectionName,
  sanitizeTenantId,
  metaKeyFor,
  tableNameFor,
} from "../utils/tenant";
import {
  CreateCollectionReq,
  type DistanceKind,
  type VectorType,
} from "../types";
import { ensureMetaTable } from "../ydb/schema";
// Index ops are no-ops in approximate mode
import {
  createCollection as repoCreate,
  getCollectionMeta,
  deleteCollection as repoDelete,
} from "../repositories/collectionsRepo";
import { logger } from "../logging/logger";

export const collectionsRouter = Router();

collectionsRouter.put(
  "/:collection/index",
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
      // Acknowledge for clients expecting this endpoint
      res.json({ status: "ok", result: { acknowledged: true } });
    } catch (err: any) {
      logger.error({ err }, "build index failed");
      res
        .status(500)
        .json({ status: "error", error: String(err?.message ?? err) });
    }
  }
);

collectionsRouter.put("/:collection", async (req: Request, res: Response) => {
  try {
    await ensureMetaTable();
    const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
    const collection = sanitizeCollectionName(String(req.params.collection));
    const metaKey = metaKeyFor(tenant, collection);
    const parsed = CreateCollectionReq.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ status: "error", error: parsed.error.flatten() });
    }
    const dim = parsed.data.vectors.size;
    const distance = parsed.data.vectors.distance as DistanceKind;
    const vectorType = (parsed.data.vectors.data_type as VectorType) ?? "float";
    const tableName = tableNameFor(tenant, collection);
    await repoCreate(metaKey, dim, distance, vectorType, tableName);
    res.json({ status: "ok", result: { name: collection, tenant } });
  } catch (err: any) {
    logger.error({ err }, "create collection failed");
    res
      .status(500)
      .json({ status: "error", error: String(err?.message ?? err) });
  }
});

collectionsRouter.get("/:collection", async (req: Request, res: Response) => {
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
    res.json({
      status: "ok",
      result: {
        name: collection,
        vectors: {
          size: meta.dimension,
          distance: meta.distance,
          data_type: meta.vectorType,
        },
      },
    });
  } catch (err: any) {
    logger.error({ err }, "get collection failed");
    res
      .status(500)
      .json({ status: "error", error: String(err?.message ?? err) });
  }
});

collectionsRouter.delete(
  "/:collection",
  async (req: Request, res: Response) => {
    try {
      await ensureMetaTable();
      const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
      const collection = sanitizeCollectionName(String(req.params.collection));
      const metaKey = metaKeyFor(tenant, collection);
      await repoDelete(metaKey);
      res.json({ status: "ok", result: { acknowledged: true } });
    } catch (err: any) {
      logger.error({ err }, "delete collection failed");
      res
        .status(500)
        .json({ status: "error", error: String(err?.message ?? err) });
    }
  }
);
