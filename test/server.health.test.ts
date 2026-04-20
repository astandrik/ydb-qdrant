import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request } from "express";
import { createMockRes } from "./helpers/routeTestHelpers.js";

const isYdbAvailableMock = vi.fn<() => Promise<boolean>>();
const verifyCollectionsQueryCompilationForStartupMock =
    vi.fn<() => Promise<void>>();
const isCompilationTimeoutErrorMock = vi.fn<(err: unknown) => boolean>();

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

import { healthHandler, rootHandler } from "../src/server.js";

describe("GET /health", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isCompilationTimeoutErrorMock.mockReturnValue(false);
    });

    it("returns 200 when YDB is available and compilation probe succeeds", async () => {
        isYdbAvailableMock.mockResolvedValueOnce(true);
        verifyCollectionsQueryCompilationForStartupMock.mockResolvedValueOnce();
        const res = createMockRes();

        await healthHandler({} as Request, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ status: "ok" });
    });

    it("returns 503 when YDB is unavailable", async () => {
        isYdbAvailableMock.mockResolvedValueOnce(false);
        const res = createMockRes();

        await healthHandler({} as Request, res);

        expect(res.statusCode).toBe(503);
        expect(res.body).toMatchObject({
            status: "error",
            error: "YDB unavailable",
        });
    });

    it("returns 503 when the compilation probe fails", async () => {
        isYdbAvailableMock.mockResolvedValueOnce(true);
        verifyCollectionsQueryCompilationForStartupMock.mockRejectedValueOnce(
            new Error("compilation timeout")
        );
        isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
        const res = createMockRes();

        await healthHandler({} as Request, res);

        expect(res.statusCode).toBe(503);
        expect(res.body).toMatchObject({
            status: "error",
            error: "YDB health probe failed",
        });
    });
});

describe("GET /", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns title and version from npm_package_version", () => {
        const originalVersion = process.env.npm_package_version;
        process.env.npm_package_version = "9.0.0-test";
        const res = createMockRes();

        try {
            rootHandler({} as Request, res);
        } finally {
            if (originalVersion === undefined) {
                delete process.env.npm_package_version;
            } else {
                process.env.npm_package_version = originalVersion;
            }
        }

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            title: "ydb-qdrant",
            version: "9.0.0-test",
        });
    });
});
