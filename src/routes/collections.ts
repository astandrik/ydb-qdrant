import { Router, Request, Response } from "express";
import {
  sanitizeCollectionName,
  sanitizeTenantId,
  metaKeyFor,
  tableNameFor,
} from "../utils/tenant.js";
import {
  CreateCollectionReq,
  type DistanceKind,
  type VectorType,
} from "../types.js";
import { ensureMetaTable } from "../ydb/schema.js";
// Index ops are no-ops in approximate mode
import {
  createCollection as repoCreate,
  getCollectionMeta,
  deleteCollection as repoDelete,
} from "../repositories/collectionsRepo.js";
import { logger } from "../logging/logger.js";

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
      // No-op for Qdrant compatibility (Roo Code calls this for payload indexes)
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

    // Check if collection already exists (idempotent create)
    const existing = await getCollectionMeta(metaKey);
    if (existing) {
      // Verify config matches
      if (
        existing.dimension === dim &&
        existing.distance === distance &&
        existing.vectorType === vectorType
      ) {
        // Config matches; return success (no-op)
        return res.json({ status: "ok", result: { name: collection, tenant } });
      } else {
        // Config mismatch
        return res.status(400).json({
          status: "error",
          error: `Collection already exists with different config: dimension=${existing.dimension}, distance=${existing.distance}, type=${existing.vectorType}`,
        });
      }
    }

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
