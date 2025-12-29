import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRes } from "./helpers/routeTestHelpers.js";

const isYdbAvailableMock = vi.fn<() => Promise<boolean>>();
const verifyCollectionsQueryCompilationForStartupMock =
  vi.fn<() => Promise<void>>();
const isCompilationTimeoutErrorMock = vi.fn<(err: unknown) => boolean>();
const scheduleExitMock = vi.fn<(code: number) => void>();

vi.mock("../src/ydb/client.js", () => ({
  isYdbAvailable: (...args: unknown[]) => isYdbAvailableMock(...(args as [])),
  isCompilationTimeoutError: (...args: unknown[]) =>
    isCompilationTimeoutErrorMock(...(args as [unknown])),
}));

vi.mock("../src/repositories/collectionsRepo.js", () => ({
  verifyCollectionsQueryCompilationForStartup: (...args: unknown[]) =>
    verifyCollectionsQueryCompilationForStartupMock(...(args as [])),
}));

vi.mock("../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../src/utils/exit.js", () => ({
  scheduleExit: (...args: unknown[]) => scheduleExitMock(...(args as [number])),
  __setExitFnForTests: vi.fn(),
}));

import { healthHandler, rootHandler } from "../src/server.js";

type RootHandlerCompat = (
  req: unknown,
  res: { json: (payload: unknown) => unknown }
) => void;

type HealthHandlerCompat = (
  req: unknown,
  res: {
    status: (code: number) => unknown;
    json: (payload: unknown) => unknown;
  }
) => Promise<void>;

const rootHandlerCompat = rootHandler as RootHandlerCompat;
const healthHandlerCompat = healthHandler as HealthHandlerCompat;

describe("GET /health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isCompilationTimeoutErrorMock.mockReturnValue(false);
  });

  it("returns 200 with {status:'ok'} when YDB is available and probe succeeds", async () => {
    isYdbAvailableMock.mockResolvedValueOnce(true);
    verifyCollectionsQueryCompilationForStartupMock.mockResolvedValueOnce();
    const res = createMockRes();

    await healthHandlerCompat({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
    expect(scheduleExitMock).not.toHaveBeenCalled();
    expect(
      verifyCollectionsQueryCompilationForStartupMock
    ).toHaveBeenCalledTimes(1);
  });

  it("returns 503 with error payload and schedules exit when YDB is unavailable", async () => {
    isYdbAvailableMock.mockResolvedValueOnce(false);
    const res = createMockRes();

    await healthHandlerCompat({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      status: "error",
      error: "YDB unavailable",
    });
    expect(scheduleExitMock).toHaveBeenCalledWith(1);
  });

  it("returns 503 with error payload and schedules exit when compilation probe fails", async () => {
    isYdbAvailableMock.mockResolvedValueOnce(true);
    const probeError = new Error("compilation timeout");
    verifyCollectionsQueryCompilationForStartupMock.mockRejectedValueOnce(
      probeError
    );
    isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
    const res = createMockRes();

    await healthHandlerCompat({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      status: "error",
      error: "YDB health probe failed",
    });
    expect(scheduleExitMock).toHaveBeenCalledWith(1);
  });
});

describe("GET /", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with title and version (npm_package_version)", () => {
    const originalVersion = process.env.npm_package_version;
    process.env.npm_package_version = "4.23.0-test";
    const res = createMockRes();

    try {
      rootHandlerCompat({}, res);
    } finally {
      if (originalVersion === undefined) {
        delete process.env.npm_package_version;
      } else {
        process.env.npm_package_version = originalVersion;
      }
    }

    expect(res.statusCode).toBe(200);
    const body = res.body;
    const obj =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};
    expect(typeof obj.title).toBe("string");
    expect(String(obj.title).toLowerCase()).toContain("qdrant");
    expect(obj.version).toBe("4.23.0-test");
  });

  it('returns 200 with version "unknown" when npm_package_version is missing', () => {
    const originalVersion = process.env.npm_package_version;
    delete process.env.npm_package_version;
    const res = createMockRes();

    try {
      rootHandlerCompat({}, res);
    } finally {
      if (originalVersion === undefined) {
        delete process.env.npm_package_version;
      } else {
        process.env.npm_package_version = originalVersion;
      }
    }

    expect(res.statusCode).toBe(200);
    const body = res.body;
    const obj =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};
    expect(typeof obj.title).toBe("string");
    expect(String(obj.title).toLowerCase()).toContain("qdrant");
    expect(obj.version).toBe("unknown");
  });
});
