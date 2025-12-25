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
    },
    withSessionRetry: vi.fn(),
    createExecuteQuerySettings,
    createExecuteQuerySettingsWithTimeout,
    createBulkUpsertSettingsWithTimeout,
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
  };
});

import {
  upsertPoints,
  searchPoints,
  deletePoints,
  deletePointsByPathSegments,
} from "../../src/repositories/pointsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";

const withSessionMock = ydbClient.withSessionRetry as unknown as Mock;

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
    expect(yql).not.toContain("Knn::ToBinaryStringFloat");
    expect(yql).not.toContain("Knn::ToBinaryStringBit");
  });

  it("upserts more than UPSERT_BATCH_SIZE points in multiple batches (one_table)", async () => {
    const upsertBatchSize = 100;
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const total = upsertBatchSize + 50;
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
      Math.ceil(total / upsertBatchSize)
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
      "qdr_tenant_a__my_collection",
      [["src", "hooks"]]
    );

    expect(result).toEqual([{ id: "p1", score: 0.9 }]);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(yql).toContain("FROM qdrant_all_points");
    expect(yql).toContain("embedding_quantized");
    expect(yql).toContain("ORDER BY Knn::CosineSimilarity");
    expect(yql).toContain("Knn::CosineDistance");
    expect(yql).toContain("ORDER BY score ASC");
    expect(yql).toContain("DECLARE $p0_0 AS Utf8;");
    expect(yql).toContain("DECLARE $p0_1 AS Utf8;");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"0\"')");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"1\"')");
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
      "qdr_tenant_a__my_collection",
      undefined
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
      "qdr_tenant_a__my_collection",
      undefined
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

  it("propagates transient OVERLOADED errors for deletePoints (one_table)", async () => {
    const sessionMock = {
      executeQuery: vi
        .fn()
        .mockRejectedValueOnce(
          new Error(
            'Overloaded (code 400060): [{"message":"Kikimr cluster or one of its subsystems is overloaded."}]'
          )
        ),
    };

    withSessionMock.mockImplementation(
      async (fn: (s: unknown) => unknown) => await fn(sessionMock)
    );

    await expect(
      deletePoints("qdrant_all_points", ["p1"], "qdr_tenant_a__my_collection")
    ).rejects.toThrow("Overloaded (code 400060)");
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("deletes points by pathSegments filter (must) for one_table mode", async () => {
    const sessionMock = {
      executeQuery: vi
        .fn()
        // delete script: returns deleted count per batch, then 0 to stop
        .mockResolvedValueOnce({
          resultSets: [{ rows: [{ items: [{ uint64Value: 1 }] }] }],
        })
        .mockResolvedValueOnce({
          resultSets: [{ rows: [{ items: [{ uint64Value: 0 }] }] }],
        }),
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
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
    const yql = sessionMock.executeQuery.mock.calls[0][0] as string;
    expect(yql).toContain("DECLARE $p0_0 AS Utf8;");
    expect(yql).toContain("DECLARE $p0_1 AS Utf8;");
    expect(yql).toContain("DECLARE $p0_2 AS Utf8;");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"0\"')");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"1\"')");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"2\"')");
    expect(yql).toContain("$to_delete");
    expect(yql).toContain("SELECT uid, point_id");
    expect(yql).toContain("DELETE FROM qdrant_all_points ON");
    expect(yql).toContain("SELECT COUNT(*) AS deleted FROM $to_delete");
  });

  it("propagates transient OVERLOADED errors for deletePointsByPathSegments (one_table)", async () => {
    const sessionMock = {
      executeQuery: vi
        .fn()
        .mockRejectedValueOnce(
          new Error(
            'Overloaded (code 400060): [{"message":"Tablet is overloaded."},{"message":"wrong shard state"}]'
          )
        ),
    };

    withSessionMock.mockImplementation(
      async (fn: (s: unknown) => unknown) => await fn(sessionMock)
    );

    await expect(
      deletePointsByPathSegments(
        "qdrant_all_points",
        "qdr_tenant_a__my_collection",
        [["src", "hooks", "useMonacoGhost.ts"]]
      )
    ).rejects.toThrow("Overloaded (code 400060)");
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
  });
});
