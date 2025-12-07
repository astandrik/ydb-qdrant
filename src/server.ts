import express from "express";
import type { Request, Response } from "express";
import { collectionsRouter } from "./routes/collections.js";
import { pointsRouter } from "./routes/points.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { isYdbAvailable, isCompilationTimeoutError } from "./ydb/client.js";
import { verifyCollectionsQueryCompilationForStartup } from "./repositories/collectionsRepo.js";
import { logger } from "./logging/logger.js";
import { scheduleExit } from "./utils/exit.js";

export async function healthHandler(
  _req: Request,
  res: Response
): Promise<void> {
  const ok = await isYdbAvailable();
  if (!ok) {
    logger.error(
      "YDB unavailable during health check; scheduling process exit"
    );
    res.status(503).json({ status: "error", error: "YDB unavailable" });
    scheduleExit(1);
    return;
  }

  try {
    await verifyCollectionsQueryCompilationForStartup();
  } catch (err: unknown) {
    const isTimeout = isCompilationTimeoutError(err);
    logger.error(
      { err },
      isTimeout
        ? "YDB compilation timeout during health probe; scheduling process exit"
        : "YDB health probe failed; scheduling process exit"
    );
    res.status(503).json({ status: "error", error: "YDB health probe failed" });
    scheduleExit(1);
    return;
  }

  res.json({ status: "ok" });
}

export function buildServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(requestLogger);
  app.get("/health", healthHandler);
  app.use("/collections", collectionsRouter);
  app.use("/collections", pointsRouter);
  return app;
}
