import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("../../src/ydb/client.js", () => {
  const createExecuteQuerySettings = vi.fn(() => ({
    kind: "ExecuteQuerySettings",
  }));

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
      list: vi.fn((t: unknown, list: unknown[]) => ({ type: "list", t, list })),
      bytes: vi.fn((v: unknown) => ({ type: "bytes", v })),
    },
    withSession: vi.fn(),
    createExecuteQuerySettings,
  };
});

vi.mock("../../src/ydb/helpers.js", () => {
  return {
    buildVectorParam: vi.fn((vec: number[]) => ({
      kind: "vector",
      vec,
    })),
    buildJsonOrEmpty: vi.fn((payload?: Record<string, unknown>) => ({
      kind: "json",
      payload: payload ?? {},
    })),
    buildVectorBinaryParams: vi.fn((vec: number[]) => ({
      float: { kind: "float-bytes", vec },
      bit: { kind: "bit-bytes", vec },
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
    SEARCH_MODE: actual.SearchMode.Approximate,
    CLIENT_SIDE_SERIALIZATION_ENABLED: true,
  };
});

import * as ydbClient from "../../src/ydb/client.js";
import * as helpers from "../../src/ydb/helpers.js";
import { searchPointsOneTable as searchPointsOneTableInternal } from "../../src/repositories/pointsRepo.one-table.js";
import { SearchMode } from "../../src/config/env.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;
const buildVectorParamMock = helpers.buildVectorParam as unknown as Mock;
const buildVectorBinaryParamsMock =
  helpers.buildVectorBinaryParams as unknown as Mock;

describe("pointsRepo one_table with client-side serialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses binary string param for exact search when client-side serialization is enabled", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockResolvedValue({
        resultSets: [
          {
            rows: [
              {
                items: [{ textValue: "p1" }, { floatValue: 0.9 }],
              },
            ],
          },
        ],
      }),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(sessionMock);
    });

    const result = await searchPointsOneTableInternal(
      "qdrant_all_points",
      [0, 0, 0, 1],
      5,
      false,
      "Cosine",
      4,
      "qdr_tenant_a__my_collection",
      SearchMode.Exact,
      10
    );

    expect(result).toEqual([{ id: "p1", score: 0.9 }]);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(yql).toContain("DECLARE $qbinf AS String;");
    expect(yql).not.toContain("DECLARE $qf AS List<Float>;");
    expect(yql).not.toContain("Knn::ToBinaryStringFloat");

    expect(buildVectorBinaryParamsMock).toHaveBeenCalledWith([0, 0, 0, 1]);
    expect(buildVectorParamMock).not.toHaveBeenCalled();
  });

  it("uses binary string params for approximate search phases when client-side serialization is enabled", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockResolvedValue({
        resultSets: [
          {
            rows: [
              {
                items: [{ textValue: "p1" }, { floatValue: 0.9 }],
              },
            ],
          },
        ],
      }),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(sessionMock);
    });

    const result = await searchPointsOneTableInternal(
      "qdrant_all_points",
      [0, 0, 0, 1],
      5,
      false,
      "Cosine",
      4,
      "qdr_tenant_a__my_collection",
      SearchMode.Approximate,
      10
    );

    expect(result).toEqual([{ id: "p1", score: 0.9 }]);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);

    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;

    expect(yql).toContain("DECLARE $qbin_bit AS String;");
    expect(yql).toContain("DECLARE $qbinf AS String;");
    expect(yql).not.toContain("Knn::ToBinaryStringBit");
    expect(yql).not.toContain("Knn::ToBinaryStringFloat");
    expect(yql).toContain("embedding_quantized IS NOT NULL");
    expect(yql).toContain("ORDER BY Knn::CosineSimilarity");

    expect(buildVectorBinaryParamsMock).toHaveBeenCalledWith([0, 0, 0, 1]);
    expect(buildVectorParamMock).not.toHaveBeenCalled();
  });
});
