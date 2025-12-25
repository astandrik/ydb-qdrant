import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../logging/logger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const tenant = req.header("X-Tenant-Id") ?? "default";
  const traceparent = req.header("traceparent") ?? undefined;
  const amznTraceId = req.header("X-Amzn-Trace-Id") ?? undefined;
  const requestIdFromHeader = req.header("X-Request-Id") ?? undefined;
  const requestId = requestIdFromHeader ?? randomUUID();
  res.setHeader("X-Request-Id", requestId);
  const userAgent = req.header("User-Agent") ?? undefined;
  const { method, originalUrl } = req;

  const contentLength = req.header("content-length");
  const queryKeys = Object.keys(req.query || {});
  logger.info(
    {
      method,
      url: originalUrl,
      tenant,
      requestId,
      traceparent,
      amznTraceId,
      userAgent,
      contentLength,
      queryKeys,
    },
    "req"
  );

  let finished = false;
  let aborted = false;
  let closedLogged = false;

  req.on("aborted", () => {
    aborted = true;
  });

  res.on("finish", () => {
    finished = true;
    const ms = Date.now() - start;
    const payload = {
      method,
      url: originalUrl,
      tenant,
      requestId,
      traceparent,
      amznTraceId,
      userAgent,
      status: res.statusCode,
      ms,
    };

    if (res.statusCode >= 500) {
      logger.error(payload, "res");
      return;
    }
    if (res.statusCode >= 300) {
      logger.warn(payload, "res");
      return;
    }
    logger.info(payload, "res");
  });

  res.on("close", () => {
    if (finished || closedLogged) {
      return;
    }
    closedLogged = true;

    const ms = Date.now() - start;
    const bytesRead = req.socket.bytesRead;
    const payload = {
      method,
      url: originalUrl,
      tenant,
      requestId,
      traceparent,
      amznTraceId,
      userAgent,
      contentLength,
      status: res.statusCode,
      ms,
      bytesRead,
      aborted,
    };

    if (aborted) {
      logger.warn(payload, "req aborted");
      return;
    }
    logger.warn(payload, "req closed before response finished");
  });

  next();
}
