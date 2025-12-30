import { Router, Request, Response } from "express";
import {
  upsertPoints,
  searchPoints,
  queryPoints,
  deletePoints,
} from "../services/PointsService.js";
import { QdrantServiceError } from "../services/errors.js";
import { logger } from "../logging/logger.js";
import { isCompilationTimeoutError } from "../ydb/client.js";
import { scheduleExit } from "../utils/exit.js";

export const pointsRouter = Router();

// Qdrant-compatible: PUT /collections/:collection/points (upsert)
pointsRouter.put("/:collection/points", async (req: Request, res: Response) => {
  try {
    const result = await upsertPoints(
      {
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
        apiKey: req.header("api-key") ?? undefined,
        userAgent: req.header("User-Agent") ?? undefined,
      },
      req.body
    );
    res.json({ status: "ok", result });
  } catch (err: unknown) {
    if (err instanceof QdrantServiceError) {
      return res.status(err.statusCode).json(err.payload);
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (isCompilationTimeoutError(err)) {
      logger.error(
        { err },
        "YDB compilation error during upsert points (PUT); scheduling process exit"
      );
      res.status(500).json({ status: "error", error: errorMessage });
      scheduleExit(1);
      return;
    }
    logger.error({ err }, "upsert points (PUT) failed");
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
          apiKey: req.header("api-key") ?? undefined,
          userAgent: req.header("User-Agent") ?? undefined,
        },
        req.body
      );
      res.json({ status: "ok", result });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (isCompilationTimeoutError(err)) {
        logger.error(
          { err },
          "YDB compilation error during upsert points; scheduling process exit"
        );
        res.status(500).json({ status: "error", error: errorMessage });
        scheduleExit(1);
        return;
      }
      logger.error({ err }, "upsert points failed");
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);

pointsRouter.post(
  "/:collection/points/search",
  async (req: Request, res: Response) => {
    try {
      const { points } = await searchPoints(
        {
          tenant: req.header("X-Tenant-Id") ?? undefined,
          collection: String(req.params.collection),
          apiKey: req.header("api-key") ?? undefined,
          userAgent: req.header("User-Agent") ?? undefined,
        },
        req.body
      );
      res.json({ status: "ok", result: points });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (isCompilationTimeoutError(err)) {
        logger.error(
          { err },
          "YDB compilation error during search points; scheduling process exit"
        );
        res.status(500).json({ status: "error", error: errorMessage });
        scheduleExit(1);
        return;
      }
      logger.error({ err }, "search points failed");
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);

// Compatibility: some clients call POST /collections/:collection/points/query
pointsRouter.post(
  "/:collection/points/query",
  async (req: Request, res: Response) => {
    try {
      const { points } = await queryPoints(
        {
          tenant: req.header("X-Tenant-Id") ?? undefined,
          collection: String(req.params.collection),
          apiKey: req.header("api-key") ?? undefined,
          userAgent: req.header("User-Agent") ?? undefined,
        },
        req.body
      );
      res.json({ status: "ok", result: points });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (isCompilationTimeoutError(err)) {
        logger.error(
          { err },
          "YDB compilation error during search points (query); scheduling process exit"
        );
        res.status(500).json({ status: "error", error: errorMessage });
        scheduleExit(1);
        return;
      }
      logger.error({ err }, "search points (query) failed");
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
          apiKey: req.header("api-key") ?? undefined,
          userAgent: req.header("User-Agent") ?? undefined,
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
