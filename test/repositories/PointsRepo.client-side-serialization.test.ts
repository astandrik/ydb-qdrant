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

    return {
        Types: {
            UTF8: "UTF8",
            BYTES: "BYTES",
            JSON_DOCUMENT: "JSON_DOCUMENT",
            FLOAT: "FLOAT",
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
        withSession: vi.fn(),
        createExecuteQuerySettings,
        createExecuteQuerySettingsWithTimeout,
    };
});

vi.mock("../../src/ydb/helpers.js", () => {
    return {
        buildVectorBinaryParams: vi.fn((vec: number[]) => ({
            float: { kind: "float-bytes", vec },
        })),
    };
});

import * as ydbClient from "../../src/ydb/client.js";
import * as helpers from "../../src/ydb/helpers.js";
import { searchPointsOneTable as searchPointsOneTableInternal } from "../../src/repositories/pointsRepo.one-table.js";
import { computePayloadSign } from "../../src/utils/PayloadSign.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;
const buildVectorBinaryParamsMock =
    helpers.buildVectorBinaryParams as unknown as Mock;

describe("pointsRepo one_table with client-side serialization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("uses binary string param for exact search when client-side serialization is enabled", async () => {
        const apiKey = "test-api-key";
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

        const result = await searchPointsOneTableInternal(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            false,
            "Cosine",
            4,
            "qdr_tenant_a__my_collection",
            apiKey
        );

        expect(result).toEqual([{ id: "p1", score: 0.9 }]);
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
        expect(yql).toContain("DECLARE $qbinf AS String;");
        expect(yql).not.toContain("DECLARE $qf AS List<Float>;");
        expect(yql).not.toContain("Knn::ToBinaryStringFloat");

        // Exact search uses client-side float serialization directly (no bit vector needed).
        expect(buildVectorBinaryParamsMock).not.toHaveBeenCalled();
    });
});
