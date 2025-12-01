import express from "express";
import type { Request, Response } from "express";
import { collectionsRouter } from "./routes/collections.js";
import { pointsRouter } from "./routes/points.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { isYdbAvailable } from "./ydb/client.js";

export async function healthHandler(
  _req: Request,
  res: Response
): Promise<void> {
  const ok = await isYdbAvailable();
  if (!ok) {
    res.status(503).json({ status: "error", error: "YDB unavailable" });
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
