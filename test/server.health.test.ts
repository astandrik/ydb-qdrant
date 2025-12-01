import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request } from "express";
import { createMockRes } from "./helpers/routeTestHelpers.js";

const isYdbAvailableMock = vi.fn<() => Promise<boolean>>();

vi.mock("../src/ydb/client.js", () => ({
  isYdbAvailable: (...args: unknown[]) => isYdbAvailableMock(...(args as [])),
}));

import { healthHandler } from "../src/server.js";

describe("GET /health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with {status:'ok'} when YDB is available", async () => {
    isYdbAvailableMock.mockResolvedValueOnce(true);
    const res = createMockRes();

    await healthHandler({} as Request, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("returns 503 with error payload when YDB is unavailable", async () => {
    isYdbAvailableMock.mockResolvedValueOnce(false);
    const res = createMockRes();

    await healthHandler({} as Request, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      status: "error",
      error: "YDB unavailable",
    });
  });
});
