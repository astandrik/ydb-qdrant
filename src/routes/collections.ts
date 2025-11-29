import { Router, Request, Response } from "express";
import {
  putCollectionIndex,
  createCollection,
  getCollection,
  deleteCollection,
} from "../services/CollectionService.js";
import { QdrantServiceError } from "../services/errors.js";
import { logger } from "../logging/logger.js";

export const collectionsRouter = Router();

collectionsRouter.put(
  "/:collection/index",
  async (req: Request, res: Response) => {
    try {
      const result = await putCollectionIndex({
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
        apiKey: req.header("api-key") ?? undefined,
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
    const result = await createCollection(
      {
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
        apiKey: req.header("api-key") ?? undefined,
      },
      req.body
    );
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
    const result = await getCollection({
      tenant: req.header("X-Tenant-Id") ?? undefined,
      collection: String(req.params.collection),
      apiKey: req.header("api-key") ?? undefined,
    });
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
      const result = await deleteCollection({
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
        apiKey: req.header("api-key") ?? undefined,
      });
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
