import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { createSqlHarness, getQueryParam } from "../helpers/ydbjsQueryMock.js";

vi.mock("../../src/ydb/client.js", () => {
  return {
    withSession: vi.fn(),
  };
});

vi.mock("../../src/ydb/helpers.js", () => {
  return {
    buildVectorBinaryParams: vi.fn((vec: number[]) => ({
      float: { kind: "float-bytes", vec },
      bit: { kind: "bit-bytes", vec },
    })),
  };
});

import * as ydbClient from "../../src/ydb/client.js";
import * as helpers from "../../src/ydb/helpers.js";
import { searchPointsOneTable as searchPointsOneTableInternal } from "../../src/repositories/pointsRepo.one-table.js";
import { SearchMode } from "../../src/config/env.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;
const buildVectorBinaryParamsMock =
  helpers.buildVectorBinaryParams as unknown as Mock;

describe("pointsRepo one_table with client-side serialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses binary string param for exact search when client-side serialization is enabled", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[{ point_id: "p1", score: 0.9 }]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

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
    expect(h.calls).toHaveLength(1);
    const yql = h.calls[0].yql;
    // @ydbjs/query auto-injects DECLAREs; assert bound params instead.
    expect(getQueryParam(h.calls[0].query, "$qbinf")).toBeDefined();
    expect(getQueryParam(h.calls[0].query, "$qf")).toBeUndefined();
    expect(yql).not.toContain("Knn::ToBinaryStringFloat");

    expect(buildVectorBinaryParamsMock).toHaveBeenCalledWith([0, 0, 0, 1]);
  });

  it("uses binary string params for approximate search phases when client-side serialization is enabled", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[{ point_id: "p1", score: 0.9 }]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

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
    expect(h.calls).toHaveLength(1);
    const yql = h.calls[0].yql;

    // @ydbjs/query auto-injects DECLAREs; assert bound params instead.
    expect(getQueryParam(h.calls[0].query, "$qbin_bit")).toBeDefined();
    expect(getQueryParam(h.calls[0].query, "$qbinf")).toBeDefined();
    expect(yql).not.toContain("Knn::ToBinaryStringBit");
    expect(yql).not.toContain("Knn::ToBinaryStringFloat");
    expect(yql).toContain("embedding_quantized IS NOT NULL");
    expect(yql).toContain("ORDER BY Knn::CosineSimilarity");

    expect(buildVectorBinaryParamsMock).toHaveBeenCalledWith([0, 0, 0, 1]);
  });
});
