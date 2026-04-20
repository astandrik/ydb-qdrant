import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("../../src/ydb/client.js", () => {
    const createExecuteQuerySettings = vi.fn(() => ({
        kind: "ExecuteQuerySettings",
    }));

    const createExecuteQuerySettingsWithTimeout = vi.fn(
        (options?: { timeoutMs: number }) => ({
            kind: "ExecuteQuerySettingsWithTimeout",
            timeoutMs: options?.timeoutMs,
        })
    );

    const createBulkUpsertSettingsWithTimeout = vi.fn(
        (options?: { timeoutMs: number }) => ({
            kind: "BulkUpsertSettingsWithTimeout",
            timeoutMs: options?.timeoutMs,
        })
    );

    return {
        Types: {
            UTF8: "UTF8",
            BYTES: "BYTES",
            JSON_DOCUMENT: "JSON_DOCUMENT",
            FLOAT: "FLOAT",
            optional: vi.fn((t: unknown) => ({ kind: "optional", t })),
            list: vi.fn((t: unknown) => ({ kind: "list", t })),
            struct: vi.fn((fields: Record<string, unknown>) => ({
                kind: "struct",
                fields,
            })),
        },
        TypedValues: {
            utf8: vi.fn((v: string) => ({ type: "utf8", v })),
            uint32: vi.fn((v: number) => ({ type: "uint32", v })),
            timestamp: vi.fn((v: Date) => ({ type: "timestamp", v })),
            list: vi.fn((t: unknown, list: unknown[]) => ({
                type: "list",
                t,
                list,
            })),
            bytes: vi.fn((v: unknown) => ({ type: "bytes", v })),
        },
        Ydb: {
            TypedValue: {
                create: vi.fn((v: unknown) => v),
            },
        },
        withSession: vi.fn(),
        withQuerySession: vi.fn(),
        createExecuteQuerySettings,
        createExecuteQuerySettingsWithTimeout,
        createBulkUpsertSettingsWithTimeout,
    };
});

vi.mock("../../src/ydb/helpers.js", () => {
    return {
        buildVectorBinaryParams: vi.fn((vec: number[]) => ({
            float: { kind: "float-bytes", vec },
        })),
    };
});

vi.mock("../../src/config/env.js", async () => {
    const actual = await vi.importActual<
        typeof import("../../src/config/env.js")
    >("../../src/config/env.js");

    return {
        ...actual,
        LOG_LEVEL: "info",
    };
});

vi.mock("../../src/ydb/schema.js", () => ({
    GLOBAL_POINTS_TABLE: "qdrant_all_points",
    POINTS_BY_FILE_LOOKUP_TABLE: "qdrant_points_by_file",
    UPSERT_BATCH_SIZE: 100,
    ensurePointsByFileTable: vi.fn(() => Promise.resolve(undefined)),
}));

import {
    upsertPoints,
    searchPoints,
    deletePoints,
    deletePointsByPathSegments,
    retrievePointsByIds,
} from "../../src/repositories/pointsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import { UPSERT_BATCH_SIZE } from "../../src/ydb/schema.js";
import { computePayloadSign } from "../../src/utils/PayloadSign.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

type QueryExecuteArgs = { text: string; parameters?: unknown };

describe("pointsRepo (with mocked YDB)", () => {
    const apiKey = "test-api-key";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not double-count upserted when session callback is rerun", async () => {
        const sessionMock = {
            bulkUpsert: vi.fn(),
            executeQuery: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
            await fn(sessionMock);
            // Simulate ydb-sdk withSessionRetry behavior: callback may rerun on BadSession
            await fn(sessionMock);
        });

        const result = await upsertPoints(
            "qdrant_all_points",
            [
                { id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } },
                { id: "p2", vector: [0, 0, 1, 0], payload: { a: 2 } },
            ],
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(result).toBe(2);
    });

    it("upserts points and notifies scheduler (one_table)", async () => {
        const sessionMock = {
            bulkUpsert: vi.fn(),
            executeQuery: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                await fn(sessionMock);
            }
        );

        const result = await upsertPoints(
            "qdrant_all_points",
            [
                { id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } },
                { id: 2, vector: [0, 0, 1, 0] },
            ],
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(sessionMock.bulkUpsert).toHaveBeenCalledTimes(1);
        expect(result).toBe(2);
    });

    it("does not retry lookup sync on the same session when executeQuery throws SessionExpired", async () => {
        vi.useFakeTimers();
        try {
            const sessionMock = {
                bulkUpsert: vi.fn(),
                executeQuery: vi.fn().mockRejectedValue(
                    new Error(
                        'SessionExpired (code 400150): [{"message":"Session has expired","severity":1}]'
                    )
                ),
            };

            withSessionMock.mockImplementation(
                async (fn: (s: unknown) => unknown) => {
                    await fn(sessionMock);
                }
            );

            const rejection = expect(
                upsertPoints(
                    "qdrant_all_points",
                    [
                        {
                            id: "p1",
                            vector: [0, 0, 0, 1],
                            payload: { pathSegments: ["src", "file.ts"] },
                        },
                    ],
                    4,
                    "qdr_tenant_a__my_collection",
                    apiKey
                )
            ).rejects.toThrow(/SessionExpired/);

            await vi.runAllTimersAsync();

            await rejection;
            expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
            expect(sessionMock.bulkUpsert).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it("does not retry bulkUpsert on the same session when bulkUpsert throws SessionExpired", async () => {
        vi.useFakeTimers();
        try {
            const sessionMock = {
                bulkUpsert: vi.fn().mockRejectedValue(
                    new Error(
                        'SessionExpired (code 400150): [{"message":"Session has expired","severity":1}]'
                    )
                ),
                executeQuery: vi.fn().mockResolvedValue(undefined),
            };

            withSessionMock.mockImplementation(
                async (fn: (s: unknown) => unknown) => {
                    await fn(sessionMock);
                }
            );

            const rejection = expect(
                upsertPoints(
                    "qdrant_all_points",
                    [{ id: "p1", vector: [0, 0, 0, 1], payload: {} }],
                    4,
                    "qdr_tenant_a__my_collection",
                    apiKey
                )
            ).rejects.toThrow(/SessionExpired/);

            await vi.runAllTimersAsync();

            await rejection;
            expect(sessionMock.bulkUpsert).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("throws on vector dimension mismatch in upsertPoints", async () => {
        const sessionMock = {
            bulkUpsert: vi.fn(),
            executeQuery: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                await fn(sessionMock);
            }
        );

        await expect(
            upsertPoints(
                "qdrant_all_points",
                [{ id: "p1", vector: [0, 1], payload: {} }],
                4,
                "qdr_tenant_a__my_collection",
                apiKey
            )
        ).rejects.toThrow(/Vector dimension mismatch/);
        expect(sessionMock.bulkUpsert).not.toHaveBeenCalled();
    });

    it("parses payload and score from search results", async () => {
        const payload = { a: 1 };
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            1,
            true,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(result[0]).toEqual({
            id: "p1",
            score: 0.9,
            payload,
        });
    });

    it("drops points from search results when payload signature mismatches", async () => {
        const apiKey = "test-api-key";
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: '{"a":1}' },
                                    { textValue: "bad-signature" },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            1,
            true,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(result).toEqual([]);
        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("payload_sign");
    });

    it("keeps points when payload signature matches", async () => {
        const apiKey = "test-api-key";
        const payload = { a: 1 };
        const payloadSign = computePayloadSign({ apiKey, payload });

        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            1,
            true,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(result).toEqual([{ id: "p1", score: 0.9, payload }]);
    });

    it("throws when search result row has missing id", async () => {
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: undefined },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        await expect(
            searchPoints(
                "qdrant_all_points",
                [0, 0, 0, 1],
                1,
                false,
                "Cosine",
                4,
                "qdr_tenant_a__my_collection",
                apiKey
            )
        ).rejects.toThrow("point_id is missing in YDB search result");
    });

    it("upserts points with collection parameter for one_table mode", async () => {
        const sessionMock = {
            bulkUpsert:
                vi.fn<
                    (
                        tablePath: string,
                        rows: unknown,
                        settings?: unknown
                    ) => Promise<unknown>
                >(),
            executeQuery: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                await fn(sessionMock);
            }
        );

        const result = await upsertPoints(
            "qdrant_all_points",
            [{ id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } }],
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(result).toBe(1);
        expect(sessionMock.bulkUpsert).toHaveBeenCalledTimes(1);
        const call = sessionMock.bulkUpsert.mock.calls[0];
        expect(call).toBeDefined();
        if (!call) {
            throw new Error("expected bulkUpsert to have at least one call");
        }
        const [tablePath, rows] = call;
        expect(tablePath).toBe("qdrant_all_points");
        expect(rows).toMatchObject({
            type: "list",
            list: [
                {
                    collection: "qdr_tenant_a__my_collection",
                    point_id: "p1",
                    embedding: { kind: "float-bytes", vec: [0, 0, 0, 1] },
                    payload: JSON.stringify({ a: 1 }),
                    payload_sign: computePayloadSign({ apiKey, payload: { a: 1 } }),
                },
            ],
        });
    });

    it("writes path_prefix for object-form pathSegments", async () => {
        const sessionMock = {
            bulkUpsert:
                vi.fn<
                    (
                        tablePath: string,
                        rows: unknown,
                        settings?: unknown
                    ) => Promise<unknown>
                >(),
            executeQuery: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                await fn(sessionMock);
            }
        );

        await upsertPoints(
            "qdrant_all_points",
            [
                {
                    id: "p1",
                    vector: [0, 0, 0, 1],
                    payload: {
                        pathSegments: {
                            0: "library",
                            1: "yql",
                            2: "file.cpp",
                        },
                    },
                },
            ],
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        const rows = sessionMock.bulkUpsert.mock.calls[0]?.[1] as {
            list?: Array<Record<string, unknown>>;
        };
        expect(rows.list?.[0]).toMatchObject({
            path_prefix: "library/yql/file.cpp",
        });
    });

    it("upserts more than UPSERT_BATCH_SIZE points in multiple batches (one_table)", async () => {
        const sessionMock = {
            bulkUpsert:
                vi.fn<
                    (
                        tablePath: string,
                        rows: unknown,
                        settings?: unknown
                    ) => Promise<unknown>
                >(),
            executeQuery: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                await fn(sessionMock);
            }
        );

        const total = UPSERT_BATCH_SIZE + 50;
        const points = Array.from({ length: total }, (_, i) => ({
            id: `p${i}`,
            vector: [0, 0, 0, 1],
            payload: { i },
        }));

        const result = await upsertPoints(
            "qdrant_all_points",
            points,
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(result).toBe(total);
        expect(sessionMock.bulkUpsert).toHaveBeenCalledTimes(
            Math.ceil(total / UPSERT_BATCH_SIZE)
        );
    });

    it("searches points with collection parameter for one_table mode (Cosine)", async () => {
        const payload = {};
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            false,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey,
            [["src", "hooks"]]
        );

        expect(result).toEqual([{ id: "p1", score: 0.9 }]);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("FROM qdrant_all_points");
        expect(yql).toContain("Knn::CosineDistance");
        expect(yql).toContain("ORDER BY score ASC");
        expect(yql).toContain("DECLARE $ppfx0 AS Utf8;");
        expect(yql).toContain("DECLARE $ppfxd0 AS Utf8;");
        expect(yql).toContain("path_prefix = $ppfx0");
        expect(yql).toContain("StartsWith(path_prefix, $ppfxd0)");
    });

    it("searches points with collection parameter for one_table mode (Euclid)", async () => {
        const payload = {};
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                    { floatValue: 0.5 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            false,
            "Euclid",
            4,
            "qdr_tenant_a__my_collection",
            apiKey,
            undefined
        );

        expect(result).toEqual([{ id: "p1", score: 0.5 }]);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("Knn::EuclideanDistance");
        expect(yql).toContain("ORDER BY score ASC");
        expect(yql).not.toContain("embedding_quantized");
    });

    it("uses exact one_table search", async () => {
        const payload = {};
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );
        const result = await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            false,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey,
            [["src", "hooks"]]
        );

        expect(result).toEqual([{ id: "p1", score: 0.9 }]);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("FROM qdrant_all_points");
        expect(yql).not.toContain("embedding_quantized");
        expect(yql).toContain("path_prefix = $ppfx0");
        expect(yql).toContain("StartsWith(path_prefix, $ppfxd0)");
        expect(yql).not.toContain("path_prefix IS NULL");
        expect(yql).not.toContain("JSON_VALUE(");
        expect(yql).not.toContain("DECLARE $p0_0 AS Utf8;");
        expect(yql).not.toContain("DECLARE $p0_1 AS Utf8;");
    });

    it("deletes points with collection parameter for one_table mode", async () => {
        const sessionMock = {
            executeQuery: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                await fn(sessionMock);
            }
        );

        const deleted = await deletePoints(
            "qdrant_all_points",
            ["p1"],
            "qdr_tenant_a__my_collection"
        );

        expect(deleted).toBe(1);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("WHERE collection = $collection AND point_id IN $ids");
        expect(yql).toContain("FROM qdrant_points_by_file");
        expect(yql).toContain("DELETE FROM qdrant_points_by_file ON");
    });

    it("does not double-count deleted when session callback is rerun", async () => {
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({}),
        };

        withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
            await fn(sessionMock);
            // Simulate ydb-sdk withSessionRetry behavior: callback may rerun on BadSession
            await fn(sessionMock);
        });

        const deleted = await deletePoints(
            "qdrant_all_points",
            ["p1", "p2"],
            "qdr_tenant_a__my_collection"
        );

        expect(deleted).toBe(2);
    });

    it("retries transient OVERLOADED errors for deletePoints (one_table)", async () => {
        vi.useFakeTimers();
        const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
        try {
            const sessionMock = {
                executeQuery: vi
                    .fn()
                    .mockRejectedValueOnce(
                        new Error(
                            'Overloaded (code 400060): [{"message":"Kikimr cluster or one of its subsystems is overloaded."}]'
                        )
                    )
                    .mockResolvedValueOnce({}),
            };

            withSessionMock.mockImplementation(
                async (fn: (s: unknown) => unknown) => await fn(sessionMock)
            );

            const p = deletePoints(
                "qdrant_all_points",
                ["p1"],
                "qdr_tenant_a__my_collection"
            );
            await Promise.resolve(); // allow backoff timer to be scheduled
            await vi.advanceTimersByTimeAsync(250);

            const deleted = await p;

            expect(deleted).toBe(1);
            expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
        } finally {
            randomSpy.mockRestore();
            vi.useRealTimers();
        }
    });

    it("does not retry deletePoints on the same session when executeQuery throws SessionExpired", async () => {
        vi.useFakeTimers();
        try {
            const sessionMock = {
                executeQuery: vi.fn().mockRejectedValue(
                    new Error(
                        'SessionExpired (code 400150): [{"message":"Session has expired","severity":1}]'
                    )
                ),
            };

            withSessionMock.mockImplementation(
                async (fn: (s: unknown) => unknown) => {
                    await fn(sessionMock);
                }
            );

            const rejection = expect(
                deletePoints(
                    "qdrant_all_points",
                    ["p1"],
                    "qdr_tenant_a__my_collection"
                )
            ).rejects.toThrow(/SessionExpired/);

            await vi.runAllTimersAsync();

            await rejection;
            expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("deletes points by pathSegments directory filter for one_table mode", async () => {
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
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const deleted = await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            [["src", "hooks"]]
        );

        expect(deleted).toBe(1);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
        const yql = sessionMock.executeQuery.mock.calls[0]?.[0] as string;
        expect(yql).toContain("DECLARE $ppfx0 AS Utf8;");
        expect(yql).not.toContain("DECLARE $ppfxd0 AS Utf8;");
        expect(yql).toContain("file_path = $ppfx0");
        expect(yql).not.toContain("StartsWith(file_path, $ppfxd0)");
        expect(yql).toContain("FROM qdrant_points_by_file");
        expect(yql).toContain("DELETE FROM qdrant_all_points ON");
        expect(yql).toContain("DELETE FROM qdrant_points_by_file ON");
    });

    it("retries transient OVERLOADED errors for deletePointsByPathSegments (one_table)", async () => {
        vi.useFakeTimers();
        const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
        try {
            const sessionMock = {
                executeQuery: vi
                    .fn<(args: QueryExecuteArgs) => Promise<unknown>>()
                    .mockRejectedValueOnce(
                        new Error(
                            'Overloaded (code 400060): [{"message":"Tablet is overloaded."},{"message":"wrong shard state"}]'
                        )
                    )
                    .mockResolvedValueOnce({
                        resultSets: [{ rows: [{ items: [{ uint32Value: 1 }] }] }],
                    })
                    .mockResolvedValueOnce({
                        resultSets: [{ rows: [{ items: [{ uint32Value: 0 }] }] }],
                    }),
            };

            withSessionMock.mockImplementation(
                async (fn: (s: unknown) => unknown) => await fn(sessionMock)
            );

            const p = deletePointsByPathSegments(
                "qdrant_all_points",
                "qdr_tenant_a__my_collection",
                [["src", "hooks"]]
            );
            await Promise.resolve();
            await vi.runOnlyPendingTimersAsync();

            const deleted = await p;

            expect(deleted).toBe(1);
            expect(sessionMock.executeQuery).toHaveBeenCalledTimes(3);
        } finally {
            randomSpy.mockRestore();
            vi.useRealTimers();
        }
    });

    it("deletes pathSegments filter in repeated lookup batches until empty", async () => {
        const sessionMock = {
            executeQuery: vi
                .fn()
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint64Value: 2 }] }] }],
                })
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint64Value: 0 }] }] }],
                }),
        };
        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => await fn(sessionMock)
        );

        const deleted = await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            [["src", "hooks"]]
        );

        expect(deleted).toBe(2);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
        const deleteYql = sessionMock.executeQuery.mock.calls[0][0] as string;
        const deleteParams = sessionMock.executeQuery.mock.calls[0][1] as Record<
            string,
            { v?: string }
        >;
        expect(deleteYql).toContain("$to_delete");
        expect(deleteYql).toContain("FROM qdrant_points_by_file");
        expect(deleteYql).toContain("DELETE FROM qdrant_all_points ON");
        expect(deleteYql).toContain("DELETE FROM qdrant_points_by_file ON");
        expect(deleteParams.$ppfx0?.v).toBe("src/hooks");
        expect(deleteParams.$ppfxd0).toBeUndefined();
    });

    it("chunks large pathSegments delete filters into bounded YQL batches", async () => {
        const sessionMock = {
            executeQuery: vi
                .fn()
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint32Value: 1 }] }] }],
                })
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint32Value: 0 }] }] }],
                })
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint32Value: 1 }] }] }],
                })
                .mockResolvedValueOnce({
                    resultSets: [{ rows: [{ items: [{ uint32Value: 0 }] }] }],
                }),
        };
        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => await fn(sessionMock)
        );
        const paths = Array.from({ length: 251 }, (_, index) => [
            "src",
            "generated",
            `file-${index}.ts`,
        ]);

        const deleted = await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            paths
        );

        expect(deleted).toBe(2);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(4);

        const queryCalls = sessionMock.executeQuery.mock.calls.map(
            ([yql, params]) => ({
                yql: yql as string,
                params: params as Record<string, { v?: string }>,
            })
        );

        const firstChunkCall = queryCalls.find((call) =>
            call.yql.includes("DECLARE $ppfx249 AS Utf8;")
        );
        expect(firstChunkCall).toBeDefined();
        expect(firstChunkCall?.yql).not.toContain("DECLARE $ppfx250 AS Utf8;");
        expect(firstChunkCall?.params.$ppfx249?.v).toBe(
            "src/generated/file-249.ts"
        );
        expect(firstChunkCall?.params.$ppfx250).toBeUndefined();

        const secondChunkCall = queryCalls.find(
            (call) =>
                call.params.$ppfx0?.v === "src/generated/file-250.ts" &&
                !call.yql.includes("DECLARE $ppfx1 AS Utf8;")
        );
        expect(secondChunkCall).toBeDefined();
        expect(secondChunkCall?.yql).toContain("DECLARE $ppfx0 AS Utf8;");
        expect(secondChunkCall?.params.$ppfx1).toBeUndefined();
    });

    it("limits large pathSegments delete chunk execution concurrency", async () => {
        let inFlight = 0;
        let maxInFlight = 0;
        let startedCalls = 0;
        let releaseFirstWave: (() => void) | undefined;
        const firstWaveReleased = new Promise<void>((resolve) => {
            releaseFirstWave = resolve;
        });
        const sessionMock = {
            executeQuery: vi.fn(async () => {
                inFlight += 1;
                startedCalls += 1;
                maxInFlight = Math.max(maxInFlight, inFlight);

                if (startedCalls <= 3) {
                    await firstWaveReleased;
                }

                inFlight -= 1;
                return {
                    resultSets: [{ rows: [{ items: [{ uint32Value: 0 }] }] }],
                };
            }),
        };
        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => await fn(sessionMock)
        );
        const paths = Array.from({ length: 751 }, (_, index) => [
            "src",
            "parallel",
            `file-${index}.ts`,
        ]);

        const deletedPromise = deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            paths
        );

        await vi.waitFor(() => {
            expect(startedCalls).toBe(3);
        });

        releaseFirstWave?.();
        const deleted = await deletedPromise;

        expect(deleted).toBe(0);
        expect(maxInFlight).toBe(3);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(4);
    });

    it("deduplicates duplicate path deletes before chunking", async () => {
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
            async (fn: (s: unknown) => unknown) => await fn(sessionMock)
        );
        const uniquePaths = Array.from({ length: 250 }, (_, index) => [
            "src",
            "dedupe",
            `file-${index}.ts`,
        ]);
        const paths = [...uniquePaths, uniquePaths[0]];

        const deleted = await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            paths
        );

        expect(deleted).toBe(1);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
        const deleteYql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(deleteYql).toContain("DECLARE $ppfx249 AS Utf8;");
        expect(deleteYql).not.toContain("DECLARE $ppfx250 AS Utf8;");
    });

    it("does not start the next delete chunk when an in-flight peer fails later", async () => {
        let startedCalls = 0;
        let rejectFirstCall: ((error: unknown) => void) | undefined;
        let releaseThirdCall: (() => void) | undefined;
        let settled = false;
        const expectedError = new Error("non-transient delete failure");
        const firstCallFailure = new Promise<unknown>((_, reject) => {
            rejectFirstCall = reject;
        });
        const thirdCallGate = new Promise<void>((resolve) => {
            releaseThirdCall = resolve;
        });
        const zeroDeleteResult = {
            resultSets: [{ rows: [{ items: [{ uint32Value: 0 }] }] }],
        };
        const sessionMock = {
            executeQuery: vi.fn(async () => {
                startedCalls += 1;

                if (startedCalls === 1) {
                    return await firstCallFailure;
                }
                if (startedCalls === 2) {
                    return zeroDeleteResult;
                }
                if (startedCalls === 3) {
                    await thirdCallGate;
                    return zeroDeleteResult;
                }

                return zeroDeleteResult;
            }),
        };
        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => await fn(sessionMock)
        );
        const paths = Array.from({ length: 751 }, (_, index) => [
            "src",
            "errors",
            `file-${index}.ts`,
        ]);

        const deletedPromise = deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            paths
        );
        const onSettled = (): void => {
            settled = true;
        };
        void deletedPromise.then(onSettled, onSettled);

        await vi.waitFor(() => {
            expect(startedCalls).toBeGreaterThanOrEqual(3);
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(startedCalls).toBe(3);
        expect(settled).toBe(false);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(3);

        rejectFirstCall?.(expectedError);
        releaseThirdCall?.();

        await expect(deletedPromise).rejects.toThrow(
            "non-transient delete failure"
        );
        expect(settled).toBe(true);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(3);
    });

    it("retrieves points by IDs with payload signature verification", async () => {
        const payload = { indexing_complete: true };
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await retrievePointsByIds(
            "qdrant_all_points",
            ["p1"],
            "qdr_tenant_a__my_collection",
            apiKey,
            true
        );

        expect(result).toEqual([{ id: "p1", payload }]);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("FROM qdrant_all_points");
        expect(yql).toContain("point_id IN $ids");
    });

    it("drops retrieved points when payload signature mismatches", async () => {
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: '{"a":1}' },
                                    { textValue: "bad-signature" },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await retrievePointsByIds(
            "qdrant_all_points",
            ["p1"],
            "qdr_tenant_a__my_collection",
            apiKey,
            true
        );

        expect(result).toEqual([]);
    });

    it("returns empty array when no matching points found for retrieve", async () => {
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [{ rows: [] }],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await retrievePointsByIds(
            "qdrant_all_points",
            ["nonexistent"],
            "qdr_tenant_a__my_collection",
            apiKey,
            true
        );

        expect(result).toEqual([]);
    });

    it("returns null payload when with_payload is false in retrieve", async () => {
        const payload = { key: "value" };
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        const result = await retrievePointsByIds(
            "qdrant_all_points",
            ["p1"],
            "qdr_tenant_a__my_collection",
            apiKey,
            false
        );

        expect(result).toEqual([{ id: "p1", payload: null }]);
    });

    it("uses boundary-safe prefix matching for search", async () => {
        const payload = {};
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            false,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey,
            [["src", "hooks"]]
        );

        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("path_prefix = $ppfx0");
        expect(yql).toContain("StartsWith(path_prefix, $ppfxd0)");
        expect(yql).not.toContain("path_prefix IS NULL");
        expect(yql).not.toContain("JSON_VALUE(");
        expect(yql).toContain("DECLARE $ppfx0 AS Utf8;");
        expect(yql).toContain("DECLARE $ppfxd0 AS Utf8;");
        expect(yql).not.toContain("DECLARE $p0_0 AS Utf8;");
        expect(yql).not.toContain("DECLARE $p0_1 AS Utf8;");
    });

    it("uses exact file_path matching for delete", async () => {
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
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            [["src", "hooks"]]
        );

        const yql = sessionMock.executeQuery.mock.calls[0]?.[0] as string;
        expect(yql).toContain("file_path = $ppfx0");
        expect(yql).not.toContain("StartsWith(file_path, $ppfxd0)");
        expect(yql).toContain("DECLARE $ppfx0 AS Utf8;");
        expect(yql).not.toContain("DECLARE $ppfxd0 AS Utf8;");
        expect(yql).toContain("FROM qdrant_points_by_file");
        expect(yql).toContain("DELETE FROM qdrant_all_points ON");
        expect(yql).toContain("DELETE FROM qdrant_points_by_file ON");
    });

    it("handles multiple paths with boundary-safe prefix matching for search", async () => {
        const payload = {};
        const payloadSign = computePayloadSign({ apiKey, payload });
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "p1" },
                                    { textValue: JSON.stringify(payload) },
                                    { textValue: payloadSign },
                                    { floatValue: 0.9 },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        await searchPoints(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            false,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey,
            [["src", "a"], ["lib", "b"]]
        );

        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("path_prefix = $ppfx0");
        expect(yql).toContain("StartsWith(path_prefix, $ppfxd0)");
        expect(yql).toContain("path_prefix = $ppfx1");
        expect(yql).toContain("StartsWith(path_prefix, $ppfxd1)");
        expect(yql).not.toContain("path_prefix IS NULL");
        expect(yql).not.toContain("JSON_VALUE(");
        expect(yql).toContain(" OR ");
        expect(yql).not.toContain("DECLARE $p0_0 AS Utf8;");
        expect(yql).not.toContain("DECLARE $p1_0 AS Utf8;");
    });

    it("handles multiple exact file paths for delete", async () => {
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
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            [["src", "a"], ["lib", "b"]]
        );

        const yql = sessionMock.executeQuery.mock.calls[0]?.[0] as string;
        expect(yql).toContain("file_path = $ppfx0");
        expect(yql).not.toContain("StartsWith(file_path, $ppfxd0)");
        expect(yql).toContain("file_path = $ppfx1");
        expect(yql).not.toContain("StartsWith(file_path, $ppfxd1)");
        expect(yql).toContain(" OR ");
        expect(yql).toContain("DECLARE $ppfx0 AS Utf8;");
        expect(yql).not.toContain("DECLARE $ppfxd0 AS Utf8;");
        expect(yql).toContain("DECLARE $ppfx1 AS Utf8;");
        expect(yql).not.toContain("DECLARE $ppfxd1 AS Utf8;");
        expect(yql).toContain("FROM qdrant_points_by_file");
    });

    it("delete params keep only exact file_path values", async () => {
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
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            [["src", "hooks"]]
        );

        const params = sessionMock.executeQuery.mock.calls[0]?.[1] as Record<
            string,
            { v?: string }
        >;
        expect(params.$ppfx0?.v).toBe("src/hooks");
        expect(params.$ppfxd0).toBeUndefined();
    });

    it("encodes slash-containing segments without collisions in filter params", async () => {
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
            async (fn: (s: unknown) => unknown) => {
                return await fn(sessionMock);
            }
        );

        await deletePointsByPathSegments(
            "qdrant_all_points",
            "qdr_tenant_a__my_collection",
            [["src/hooks"], ["src", "hooks"]]
        );

        const params = sessionMock.executeQuery.mock.calls[0]?.[1] as Record<
            string,
            { v?: string }
        >;
        expect(params.$ppfx0?.v).toBe("src%2Fhooks");
        expect(params.$ppfx1?.v).toBe("src/hooks");
        expect(params.$ppfx0?.v).not.toBe(params.$ppfx1?.v);
    });
});
