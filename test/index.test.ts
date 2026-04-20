import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function hasErrField(value: unknown): value is { err: unknown } {
    return typeof value === "object" && value !== null && "err" in value;
}

const mocks = vi.hoisted(() => ({
    listenMock: vi.fn<(port: number, cb?: () => void) => void>(),
    infoMock: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    warnMock: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    errorMock: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    fatalMock: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
    readyOrThrowMock: vi.fn<() => Promise<void>>(),
    isCompilationTimeoutErrorMock: vi.fn<(err: unknown) => boolean>(),
    ensureMetaTableMock: vi.fn<() => Promise<void>>(),
    ensureGlobalPointsTableMock: vi.fn<() => Promise<void>>(),
    ensurePointsByFileTableMock: vi.fn<() => Promise<void>>(),
    verifyCollectionsQueryCompilationForStartupMock:
        vi.fn<() => Promise<void>>(),
    scheduleExitMock: vi.fn<(code: number) => void>(),
}));

vi.mock("../src/server.js", () => ({
    buildServer: vi.fn(() => ({ listen: mocks.listenMock })),
}));

vi.mock("../src/config/env.js", () => ({
    PORT: 8080,
}));

vi.mock("../src/logging/logger.js", () => ({
    logger: {
        info: mocks.infoMock,
        warn: mocks.warnMock,
        error: mocks.errorMock,
        fatal: mocks.fatalMock,
    },
}));

vi.mock("../src/ydb/client.js", () => ({
    readyOrThrow: mocks.readyOrThrowMock,
    isCompilationTimeoutError: mocks.isCompilationTimeoutErrorMock,
}));

vi.mock("../src/ydb/schema.js", () => ({
    GLOBAL_POINTS_TABLE: "qdrant_all_points",
    POINTS_BY_FILE_LOOKUP_TABLE: "qdrant_points_by_file",
    ensureMetaTable: mocks.ensureMetaTableMock,
    ensureGlobalPointsTable: mocks.ensureGlobalPointsTableMock,
    ensurePointsByFileTable: mocks.ensurePointsByFileTableMock,
}));

vi.mock("../src/repositories/collectionsRepo.js", () => ({
    verifyCollectionsQueryCompilationForStartup:
        mocks.verifyCollectionsQueryCompilationForStartupMock,
}));

vi.mock("../src/utils/exit.js", () => ({
    scheduleExit: mocks.scheduleExitMock,
}));

describe("index startup", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("exits when global points schema validation fails", async () => {
        const exitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation((() => undefined) as never);

        mocks.readyOrThrowMock.mockResolvedValue(undefined);
        mocks.isCompilationTimeoutErrorMock.mockReturnValue(false);
        mocks.ensureMetaTableMock.mockResolvedValue(undefined);
        mocks.ensureGlobalPointsTableMock.mockRejectedValue(
            new Error(
                "Global points table qdrant_all_points is missing required column path_prefix"
            )
        );
        mocks.ensurePointsByFileTableMock.mockResolvedValue(undefined);
        mocks.verifyCollectionsQueryCompilationForStartupMock.mockResolvedValue(
            undefined
        );

        await import("../src/index.ts");
        await vi.waitFor(() => {
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        expect(mocks.listenMock).not.toHaveBeenCalled();
        const errorCall = mocks.errorMock.mock.calls.at(-1);
        expect(errorCall?.[1]).toBe(
            "Fatal YDB schema/startup check failure; exiting until required migrations are applied"
        );
        expect(hasErrField(errorCall?.[0])).toBe(true);
        if (!hasErrField(errorCall?.[0])) {
            throw new Error("expected logger.error to receive err field");
        }
        expect(errorCall[0].err).toBeInstanceOf(Error);
    });

    it("exits when points-by-file lookup schema validation fails", async () => {
        const exitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation((() => undefined) as never);

        mocks.readyOrThrowMock.mockResolvedValue(undefined);
        mocks.isCompilationTimeoutErrorMock.mockReturnValue(false);
        mocks.ensureMetaTableMock.mockResolvedValue(undefined);
        mocks.ensureGlobalPointsTableMock.mockResolvedValue(undefined);
        mocks.ensurePointsByFileTableMock.mockRejectedValue(
            new Error(
                "Points-by-file lookup table qdrant_points_by_file is missing required column file_path"
            )
        );
        mocks.verifyCollectionsQueryCompilationForStartupMock.mockResolvedValue(
            undefined
        );

        await import("../src/index.ts");
        await vi.waitFor(() => {
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        expect(mocks.listenMock).not.toHaveBeenCalled();
    });
});
