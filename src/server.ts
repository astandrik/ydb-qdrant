import express from "express";
import type { Request, Response } from "express";
import { collectionsRouter } from "./routes/collections";
import { pointsRouter } from "./routes/points";
import { requestLogger } from "./middleware/requestLogger";

export function buildServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(requestLogger);
  app.get("/health", (_req: Request, res: Response) =>
    res.json({ status: "ok" })
  );
  app.use("/collections", collectionsRouter);
  app.use("/collections", pointsRouter);
  return app;
}
