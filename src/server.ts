import express from "express";
import type { NextFunction, Request, Response } from "express";
import { collectionsRouter } from "./routes/collections.js";
import { pointsRouter } from "./routes/points.js";
import { requestLogger } from "./middleware/requestLogger.js";
function allowCors(req: Request, res: Response, next: NextFunction): void {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Tenant-Id");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}

export function buildServer() {
  const app = express();
  app.use(allowCors);
  app.use(express.json({ limit: "20mb" }));
  app.use(requestLogger);
  app.get("/health", (_req: Request, res: Response) =>
    res.json({ status: "ok" })
  );
  app.use("/collections", collectionsRouter);
  app.use("/collections", pointsRouter);
  return app;
}
