import { Router, Request, Response } from "express";
import { sanitizeCollectionName, sanitizeTenantId } from "../utils/tenant.js";
import {
  QdrantServiceError,
  putCollectionIndex,
  createCollection,
  getCollection,
  deleteCollection,
} from "../services/QdrantService.js";
import { logger } from "../logging/logger.js";

export const collectionsRouter = Router();

collectionsRouter.put(
  "/:collection/index",
  async (req: Request, res: Response) => {
    try {
      const result = await putCollectionIndex({
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
      });
      res.json({ status: "ok", result });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "build index failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);

collectionsRouter.put("/:collection", async (req: Request, res: Response) => {
  try {
    const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
    const collection = sanitizeCollectionName(String(req.params.collection));
    const result = await createCollection({ tenant, collection }, req.body);
    res.json({ status: "ok", result });
  } catch (err: unknown) {
    if (err instanceof QdrantServiceError) {
      return res.status(err.statusCode).json(err.payload);
    }
    logger.error({ err }, "create collection failed");
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: "error", error: errorMessage });
  }
});

collectionsRouter.get("/:collection", async (req: Request, res: Response) => {
  try {
    const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
    const collection = sanitizeCollectionName(String(req.params.collection));
    const result = await getCollection({ tenant, collection });
    res.json({ status: "ok", result });
  } catch (err: unknown) {
    if (err instanceof QdrantServiceError) {
      return res.status(err.statusCode).json(err.payload);
    }
    logger.error({ err }, "get collection failed");
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: "error", error: errorMessage });
  }
});

collectionsRouter.delete(
  "/:collection",
  async (req: Request, res: Response) => {
    try {
      const tenant = sanitizeTenantId(req.header("X-Tenant-Id") ?? "default");
      const collection = sanitizeCollectionName(String(req.params.collection));
      const result = await deleteCollection({ tenant, collection });
      res.json({ status: "ok", result });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "delete collection failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);
