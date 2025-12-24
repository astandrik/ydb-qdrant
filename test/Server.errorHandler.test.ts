import http from "node:http";
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";

const loggerErrorMock = vi.fn();

vi.mock("../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: (...args: unknown[]) => {
      loggerErrorMock(...args);
    },
    debug: vi.fn(),
  },
}));

vi.mock("../src/middleware/requestLogger.js", () => ({
  requestLogger: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../src/routes/collections.js", () => ({
  collectionsRouter: express.Router(),
}));

vi.mock("../src/routes/points.js", () => ({
  pointsRouter: express.Router(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

async function startServer(): Promise<{
  server: http.Server;
  baseUrl: string;
}> {
  const { buildServer } = await import("../src/server.js");
  const app = buildServer();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("unexpected server address");
  }

  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function httpRequest(params: {
  baseUrl: string;
  method: "POST";
  path: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}> {
  const url = new URL(params.path, params.baseUrl);

  return await new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: params.method,
        headers: params.headers,
      },
      (res) => {
        const chunks: string[] = [];
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            body: chunks.join(""),
          });
        });
      }
    );

    req.on("error", reject);
    if (params.body !== undefined) {
      req.write(params.body);
    }
    req.end();
  });
}

describe("buildServer() error handling", () => {
  it("returns JSON error response for invalid JSON bodies (and preserves 400)", async () => {
    const { server, baseUrl } = await startServer();
    try {
      const res = await httpRequest({
        baseUrl,
        method: "POST",
        path: "/collections/col/points/search",
        headers: {
          "content-type": "application/json",
        },
        body: "{",
      });

      expect(res.statusCode).toBe(400);
      expect(String(res.headers["content-type"])).toContain("application/json");

      const parsed = JSON.parse(res.body) as {
        status?: unknown;
        error?: unknown;
      };
      expect(parsed.status).toBe("error");
      expect(typeof parsed.error).toBe("string");

      expect(loggerErrorMock).toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});
