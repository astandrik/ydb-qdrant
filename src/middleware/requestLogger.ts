import type { Request, Response, NextFunction } from "express";
import { logger } from "../logging/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const tenant = req.header("X-Tenant-Id") ?? "default";
  const { method, originalUrl } = req;

  const contentLength = req.header("content-length");
  const queryKeys = Object.keys(req.query || {});
  logger.info(
    { method, url: originalUrl, tenant, contentLength, queryKeys },
    "req"
  );

  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info(
      { method, url: originalUrl, tenant, status: res.statusCode, ms },
      "res"
    );
  });

  next();
}
