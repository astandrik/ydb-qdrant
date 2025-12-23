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
      list: vi.fn((t: unknown, list: unknown[]) => ({ type: "list", t, list })),
    },
    withSession: vi.fn(),
    createExecuteQuerySettings,
    createExecuteQuerySettingsWithTimeout,
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
    CLIENT_SIDE_SERIALIZATION_ENABLED: false,
  };
});

import {
  upsertPoints,
  searchPoints,
  deletePoints,
  deletePointsByPathSegments,
} from "../../src/repositories/pointsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import { UPSERT_BATCH_SIZE } from "../../src/ydb/schema.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("pointsRepo (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts points and notifies scheduler (one_table)", async () => {
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const result = await upsertPoints(
      "qdrant_all_points",
      [
        { id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } },
        { id: 2, vector: [0, 0, 1, 0] },
      ],
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    expect(result).toBe(2);
  });

  it("throws on vector dimension mismatch in upsertPoints", async () => {
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    await expect(
      upsertPoints(
        "qdrant_all_points",
        [{ id: "p1", vector: [0, 1], payload: {} }],
        4,
        "qdr_tenant_a__my_collection"
      )
    ).rejects.toThrow(/Vector dimension mismatch/);
    expect(sessionMock.executeQuery).not.toHaveBeenCalled();
  });

  it("parses payload and score from search results", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockResolvedValue({
        resultSets: [
          {
            rows: [
              {
                items: [
                  { textValue: "p1" },
                  { textValue: '{"a":1}' },
                  { floatValue: 0.9 },
                ],
              },
            ],
          },
        ],
      }),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(sessionMock);
    });

    const result = await searchPoints(
      "qdrant_all_points",
      [0, 0, 0, 1],
      1,
      true,
      "Cosine",
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(result[0]).toEqual({
      id: "p1",
      score: 0.9,
      payload: { a: 1 },
    });
  });

  it("throws when search result row has missing id", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockResolvedValue({
        resultSets: [
          {
            rows: [
              {
                items: [{ textValue: undefined }, { floatValue: 0.9 }],
              },
            ],
          },
        ],
      }),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(sessionMock);
    });

    await expect(
      searchPoints(
        "qdrant_all_points",
        [0, 0, 0, 1],
        1,
        false,
        "Cosine",
        4,
        "qdr_tenant_a__my_collection"
      )
    ).rejects.toThrow("point_id is missing in YDB search result");
  });

  it("upserts points with uid parameter for one_table mode", async () => {
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const result = await upsertPoints(
      "qdrant_all_points",
      [{ id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } }],
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(result).toBe(1);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(yql).toContain("DECLARE $rows AS List<Struct<");
    expect(yql).toContain(
      "UPSERT INTO qdrant_all_points (uid, point_id, embedding, embedding_quantized, payload)"
    );
    expect(yql).toContain("Knn::ToBinaryStringFloat(vec)");
    expect(yql).toContain("Knn::ToBinaryStringBit(vec)");
  });

  it("upserts more than UPSERT_BATCH_SIZE points in multiple batches (one_table)", async () => {
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

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
      "qdr_tenant_a__my_collection"
    );

    expect(result).toBe(total);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(
      Math.ceil(total / UPSERT_BATCH_SIZE)
    );
  });

  it("searches points with uid parameter for one_table mode (Cosine)", async () => {
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

    const result = await searchPoints(
      "qdrant_all_points",
      [0, 0, 0, 1],
      5,
      false,
      "Cosine",
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(result).toEqual([{ id: "p1", score: 0.9 }]);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(yql).toContain("FROM qdrant_all_points");
    expect(yql).toContain("embedding_quantized");
    expect(yql).toContain("ORDER BY Knn::CosineSimilarity");
    expect(yql).toContain("Knn::CosineDistance");
    expect(yql).toContain("ORDER BY score ASC");
  });

  it("searches points with uid parameter for one_table mode (Euclid)", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockResolvedValue({
        resultSets: [
          {
            rows: [
              {
                items: [{ textValue: "p1" }, { floatValue: 0.5 }],
              },
            ],
          },
        ],
      }),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(sessionMock);
    });

    const result = await searchPoints(
      "qdrant_all_points",
      [0, 0, 0, 1],
      5,
      false,
      "Euclid",
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(result).toEqual([{ id: "p1", score: 0.5 }]);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    // Approximate phase should use EuclideanDistance for Euclid metric
    expect(yql).toContain("ORDER BY Knn::EuclideanDistance");
    expect(yql).toContain("embedding_quantized");
    // Exact phase should use EuclideanDistance for re-ranking
    expect(yql).toContain("Knn::EuclideanDistance");
    expect(yql).toContain("ORDER BY score ASC");
  });

  it("uses exact mode when SEARCH_MODE is exact for one_table", async () => {
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

    // Override env mock for this test
    const envMock = await import("../../src/config/env.js");
    (envMock as unknown as { SEARCH_MODE: string }).SEARCH_MODE = "exact";

    const result = await searchPoints(
      "qdrant_all_points",
      [0, 0, 0, 1],
      5,
      false,
      "Cosine",
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(result).toEqual([{ id: "p1", score: 0.9 }]);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(yql).toContain("FROM qdrant_all_points");
    expect(yql).not.toContain("embedding_quantized");
  });

  it("deletes points with uid parameter for one_table mode", async () => {
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const deleted = await deletePoints(
      "qdrant_all_points",
      ["p1"],
      "qdr_tenant_a__my_collection"
    );

    expect(deleted).toBe(1);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(yql).toContain("WHERE uid = $uid AND point_id = $id");
  });

  it("deletes points by pathSegments filter (must) for one_table mode", async () => {
    const sessionMock = {
      executeQuery: vi
        .fn()
        // select: returns one id, then empty to stop
        .mockResolvedValueOnce({
          resultSets: [{ rows: [{ items: [{ textValue: "p1" }] }] }],
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ resultSets: [{ rows: [] }] }),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(sessionMock);
    });

    const deleted = await deletePointsByPathSegments(
      "qdrant_all_points",
      "qdr_tenant_a__my_collection",
      [["src", "hooks", "useMonacoGhost.ts"]]
    );

    expect(deleted).toBe(1);
    const selectYql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(selectYql).toContain("SELECT point_id");
    expect(selectYql).toContain("DECLARE $p0_0 AS Utf8;");
    expect(selectYql).toContain("DECLARE $p0_1 AS Utf8;");
    expect(selectYql).toContain("DECLARE $p0_2 AS Utf8;");
    expect(selectYql).toContain("JSON_VALUE(payload, '$.pathSegments.\"0\"')");
    expect(selectYql).toContain("JSON_VALUE(payload, '$.pathSegments.\"1\"')");
    expect(selectYql).toContain("JSON_VALUE(payload, '$.pathSegments.\"2\"')");
    const deleteYql = sessionMock.executeQuery.mock.calls[1][0] as string;
    expect(deleteYql).toContain("DELETE FROM qdrant_all_points");
    expect(deleteYql).toContain("point_id IN $ids");
  });
});
