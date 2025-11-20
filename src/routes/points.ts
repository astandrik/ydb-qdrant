import { Router, Request, Response } from "express";
import {
  QdrantServiceError,
  upsertPoints,
  searchPoints,
  queryPoints,
  deletePoints,
} from "../services/QdrantService.js";
import { logger } from "../logging/logger.js";

export const pointsRouter = Router();

// Qdrant-compatible: PUT /collections/:collection/points (upsert)
pointsRouter.put("/:collection/points", async (req: Request, res: Response) => {
  try {
    const result = await upsertPoints(
      {
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
      },
      req.body
    );
    res.json({ status: "ok", result });
  } catch (err: unknown) {
    if (err instanceof QdrantServiceError) {
      return res.status(err.statusCode).json(err.payload);
    }
    logger.error({ err }, "upsert points (PUT) failed");
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: "error", error: errorMessage });
  }
});

pointsRouter.post(
  "/:collection/points/upsert",
  async (req: Request, res: Response) => {
    try {
      const result = await upsertPoints(
        {
          tenant: req.header("X-Tenant-Id") ?? undefined,
          collection: String(req.params.collection),
        },
        req.body
      );
      res.json({ status: "ok", result });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "upsert points failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);

pointsRouter.post(
  "/:collection/points/search",
  async (req: Request, res: Response) => {
    try {
      const result = await searchPoints(
        {
          tenant: req.header("X-Tenant-Id") ?? undefined,
          collection: String(req.params.collection),
        },
        req.body
      );
      res.json({ status: "ok", result });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "search points failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);

// Compatibility: some clients call POST /collections/:collection/points/query
pointsRouter.post(
  "/:collection/points/query",
  async (req: Request, res: Response) => {
    try {
      const result = await queryPoints(
        {
          tenant: req.header("X-Tenant-Id") ?? undefined,
          collection: String(req.params.collection),
        },
        req.body
      );
      res.json({ status: "ok", result });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "search points (query) failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);

pointsRouter.post(
  "/:collection/points/delete",
  async (req: Request, res: Response) => {
    try {
      const result = await deletePoints(
        {
          tenant: req.header("X-Tenant-Id") ?? undefined,
          collection: String(req.params.collection),
        },
        req.body
      );
      res.json({ status: "ok", result });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "delete points failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);
