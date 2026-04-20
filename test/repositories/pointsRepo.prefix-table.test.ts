import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const loggerMocks = vi.hoisted(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    isLevelEnabled: vi.fn(() => false),
}));

vi.mock("../../src/logging/logger.js", () => ({
    logger: loggerMocks,
}));

vi.mock("../../src/config/env.js", () => ({
    DELETE_FILTER_SELECT_BATCH_SIZE: 10000,
    SEARCH_OPERATION_TIMEOUT_MS: 10000,
    UPSERT_OPERATION_TIMEOUT_MS: 5000,
}));

vi.mock("../../src/ydb/schema.js", () => ({
    GLOBAL_POINTS_TABLE: "qdrant_all_points",
    POINTS_BY_FILE_LOOKUP_TABLE: "qdrant_points_by_file",
    UPSERT_BATCH_SIZE: 100,
    ensurePointsByFileTable: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("../../src/ydb/helpers.js", () => ({
    buildVectorBinaryParams: vi.fn((vec: number[]) => ({
        float: { kind: "float-bytes", vec },
        bit: { kind: "bit-bytes", vec },
    })),
}));

vi.mock("../../src/compute/ComputePool.js", () => ({
    isComputePoolEnabled: vi.fn(() => false),
    isComputePoolQueueAtLimitError: vi.fn(() => false),
    runPrepareUpsertBatch: vi.fn(),
    runVerifySearchRows: vi.fn(),
}));

vi.mock("../../src/ydb/client.js", () => ({
    Types: {
        UTF8: "UTF8",
        BYTES: "BYTES",
        JSON_DOCUMENT: "JSON_DOCUMENT",
        optional: vi.fn((t: unknown) => ({ kind: "optional", t })),
        struct: vi.fn((fields: Record<string, unknown>) => ({
            kind: "struct",
            fields,
        })),
        list: vi.fn((t: unknown) => ({ kind: "list", t })),
    },
    TypedValues: {
        utf8: vi.fn((v: string) => ({ type: "utf8", v })),
        uint32: vi.fn((v: number) => ({ type: "uint32", v })),
        list: vi.fn((t: unknown, list: unknown[]) => ({ type: "list", t, list })),
        bytes: vi.fn((v: unknown) => ({ type: "bytes", v })),
    },
    Ydb: {
        TypedValue: {
            create: vi.fn((v: unknown) => v),
        },
    },
    withSession: vi.fn(),
    createExecuteQuerySettings: vi.fn(() => ({ kind: "ExecuteQuerySettings" })),
    createExecuteQuerySettingsWithTimeout: vi.fn(
        (options?: { timeoutMs: number }) => ({
            kind: "ExecuteQuerySettingsWithTimeout",
            timeoutMs: options?.timeoutMs,
        })
    ),
    createBulkUpsertSettingsWithTimeout: vi.fn(
        (options?: { timeoutMs: number }) => ({
            kind: "BulkUpsertSettingsWithTimeout",
            timeoutMs: options?.timeoutMs,
        })
    ),
}));

import {
    deletePointsByPathSegments,
    upsertPoints,
} from "../../src/repositories/pointsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import { logger } from "../../src/logging/logger.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("pointsRepo lookup-table paths", () => {
    const apiKey = "test-api-key";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("syncs all ancestor lookup rows before upserting main rows", async () => {
        const callOrder: string[] = [];
        const sessionMock = {
            bulkUpsert: vi.fn().mockImplementation(() => {
                callOrder.push("bulkUpsert");
            }),
            executeQuery: vi.fn().mockImplementation(() => {
                callOrder.push("executeQuery");
            }),
        };
        withSessionMock.mockImplementation(
            async (fn: (session: unknown) => unknown) => await fn(sessionMock)
        );

        const result = await upsertPoints(
            "qdrant_all_points",
            [
                {
                    id: "p1",
                    vector: [0, 0, 0, 1],
                    payload: {
                        pathSegments: ["src", "components", "Button.tsx"],
                    },
                },
            ],
            4,
            "tenant/repo",
            apiKey
        );

        expect(result).toBe(1);
        expect(sessionMock.bulkUpsert).toHaveBeenCalledTimes(1);
        expect(sessionMock.bulkUpsert.mock.calls[0]?.[0]).toBe(
            "qdrant_all_points"
        );
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const yql = sessionMock.executeQuery.mock.calls[0]?.[0] as string;
        const params = sessionMock.executeQuery.mock.calls[0]?.[1] as Record<
            string,
            { list?: Array<Record<string, string>> }
        >;
        expect(yql).toContain("UPSERT INTO qdrant_points_by_file");
        expect(yql).not.toContain("DELETE FROM qdrant_points_by_file ON");
        expect(yql).not.toContain("$stale_rows");
        expect(params.$rows?.list).toEqual([
            {
                collection: "tenant/repo",
                file_path: "src",
                point_id: "p1",
            },
            {
                collection: "tenant/repo",
                file_path: "src/components",
                point_id: "p1",
            },
            {
                collection: "tenant/repo",
                file_path: "src/components/Button.tsx",
                point_id: "p1",
            },
        ]);
        expect(callOrder).toEqual(["executeQuery", "bulkUpsert"]);
        const summaryPayload = (logger.info as Mock).mock.calls.find(
            (call) => call[1] === "upsert: repo summary"
        )?.[0] as Record<string, unknown> | undefined;
        expect(summaryPayload).toEqual(
            expect.objectContaining({
                phase: "upsertRepo",
                tableName: "qdrant_all_points",
                collection: "tenant/repo",
                pointCount: 1,
                batchCount: 1,
                usedWorkersAny: false,
            })
        );
        expect(typeof summaryPayload?.prepareRowsMsTotal).toBe("number");
        expect(typeof summaryPayload?.lookupSyncMsTotal).toBe("number");
        expect(typeof summaryPayload?.bulkUpsertMsTotal).toBe("number");
        expect(typeof summaryPayload?.repoTotalMs).toBe("number");
    });

    it("rejects after lookup sync when main row upsert fails", async () => {
        const callOrder: string[] = [];
        const bulkUpsertError = new Error("bulk upsert failed");
        const sessionMock = {
            bulkUpsert: vi.fn().mockImplementation(() => {
                callOrder.push("bulkUpsert");
                throw bulkUpsertError;
            }),
            executeQuery: vi.fn().mockImplementation(() => {
                callOrder.push("executeQuery");
            }),
        };
        withSessionMock.mockImplementation(
            async (fn: (session: unknown) => unknown) => await fn(sessionMock)
        );

        await expect(
            upsertPoints(
                "qdrant_all_points",
                [
                    {
                        id: "p1",
                        vector: [0, 0, 0, 1],
                        payload: {
                            pathSegments: ["src", "components", "Button.tsx"],
                        },
                    },
                ],
                4,
                "tenant/repo",
                apiKey
            )
        ).rejects.toBe(bulkUpsertError);

        expect(callOrder).toEqual(["executeQuery", "bulkUpsert"]);
        expect(sessionMock.bulkUpsert).toHaveBeenCalledTimes(1);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const failurePayload = (logger.error as Mock).mock.calls.find(
            (call) => call[1] === "upsert: failed"
        )?.[0] as Record<string, unknown> | undefined;
        expect(failurePayload).toEqual(
            expect.objectContaining({
                phase: "upsertRepo",
                tableName: "qdrant_all_points",
                collection: "tenant/repo",
                pointCount: 1,
                batchCount: 0,
                failedBatchIndex: 1,
                err: bulkUpsertError,
            })
        );
    });

    it("logs per-batch timings on debug only when debug is enabled", async () => {
        loggerMocks.isLevelEnabled.mockImplementation(
            (level: string) => level === "debug"
        );
        const sessionMock = {
            bulkUpsert: vi.fn().mockResolvedValue(undefined),
            executeQuery: vi.fn().mockResolvedValue(undefined),
        };
        withSessionMock.mockImplementation(
            async (fn: (session: unknown) => unknown) => await fn(sessionMock)
        );

        const result = await upsertPoints(
            "qdrant_all_points",
            [
                {
                    id: "p1",
                    vector: [0, 0, 0, 1],
                    payload: {
                        pathSegments: ["src", "components", "Button.tsx"],
                    },
                },
            ],
            4,
            "tenant/repo",
            apiKey
        );

        expect(result).toBe(1);
        const batchPayload = (logger.debug as Mock).mock.calls.find(
            (call) => call[1] === "upsert: repo batch"
        )?.[0] as Record<string, unknown> | undefined;
        expect(batchPayload).toEqual(
            expect.objectContaining({
                phase: "upsertRepoBatch",
                tableName: "qdrant_all_points",
                collection: "tenant/repo",
                batchIndex: 1,
                batchSize: 1,
                usedWorkers: false,
            })
        );
        expect(typeof batchPayload?.prepareRowsMs).toBe("number");
        expect(typeof batchPayload?.lookupSyncMs).toBe("number");
        expect(typeof batchPayload?.bulkUpsertMs).toBe("number");
        expect(typeof batchPayload?.batchTotalMs).toBe("number");
    });

    it("uses qdrant_points_by_file as delete driver for pathSegments filters", async () => {
        const sessionMock = {
            executeQuery: vi
                .fn()
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint32Value: 1 }] }] }],
                })
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint32Value: 0 }] }] }],
                }),
        };
        withSessionMock.mockImplementation(
            async (fn: (session: unknown) => unknown) => await fn(sessionMock)
        );

        const deleted = await deletePointsByPathSegments(
            "qdrant_all_points",
            "tenant/repo",
            [["src", "components"]]
        );

        expect(deleted).toBe(1);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
        const deleteBatchYql = sessionMock.executeQuery.mock.calls[0]?.[0] as string;
        const params = sessionMock.executeQuery.mock.calls[0]?.[1] as Record<
            string,
            { v?: string | number }
        >;
        expect(deleteBatchYql).toContain("FROM qdrant_points_by_file");
        expect(deleteBatchYql).toContain("DELETE FROM qdrant_all_points ON");
        expect(deleteBatchYql).toContain("DELETE FROM qdrant_points_by_file ON");
        expect(deleteBatchYql).toContain("SELECT CAST(COUNT(*) AS Uint32) AS deleted");
        expect(deleteBatchYql).toContain("file_path = $ppfx0");
        expect(deleteBatchYql).not.toContain("StartsWith(file_path, $ppfxd0)");
        expect(params.$collection?.v).toBe("tenant/repo");
        expect(params.$limit?.v).toBe(10000);
        expect(params.$ppfx0?.v).toBe("src/components");
    });
});
