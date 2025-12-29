import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { createSqlHarness, getQueryParam } from "../helpers/ydbjsQueryMock.js";
import type {
  QdrantPayload,
  QdrantPointStructDense,
} from "../../src/qdrant/QdrantTypes.js";

vi.mock("../../src/ydb/bulkUpsert.js", () => {
  return {
    bulkUpsertRowsOnce: vi.fn(() => Promise.resolve()),
  };
});

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

vi.mock("../../src/config/env.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/config/env.js")
  >("../../src/config/env.js");

  let currentSearchMode: typeof actual.SEARCH_MODE =
    actual.SearchMode.Approximate;

  return {
    ...actual,
    LOG_LEVEL: "info",
    get SEARCH_MODE() {
      return currentSearchMode;
    },
    set SEARCH_MODE(value: typeof actual.SEARCH_MODE) {
      currentSearchMode = value;
    },
  };
});

import {
  upsertPoints,
  searchPoints,
  deletePoints,
  deletePointsByPathSegments,
} from "../../src/repositories/pointsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import * as bulkUpsert from "../../src/ydb/bulkUpsert.js";
import { UPSERT_BATCH_SIZE } from "../../src/ydb/schema.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("pointsRepo (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts points and notifies scheduler (one_table)", async () => {
    const bulkUpsertRowsOnceMock =
      bulkUpsert.bulkUpsertRowsOnce as unknown as Mock;

    const points: QdrantPointStructDense[] = [
      { id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } },
      { id: 2, vector: [0, 0, 1, 0] },
    ];

    const result = await upsertPoints(
      "qdrant_all_points",
      points,
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(bulkUpsertRowsOnceMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(2);
  });

  it("throws on vector dimension mismatch in upsertPoints", async () => {
    const badPoints: QdrantPointStructDense[] = [
      { id: "p1", vector: [0, 1], payload: {} },
    ];
    await expect(
      upsertPoints(
        "qdrant_all_points",
        badPoints,
        4,
        "qdr_tenant_a__my_collection"
      )
    ).rejects.toThrow(/Vector dimension mismatch/);
  });

  it("parses payload and score from search results", async () => {
    const h = createSqlHarness();
    h.plan([
      {
        // Search.ts expects: const [rows] = await q; rows is SearchRow[]
        result: [[{ point_id: "p1", payload: '{"a":1}', score: 0.9 }]],
      },
    ]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const result = await searchPoints(
      "qdrant_all_points",
      [0, 0, 0, 1],
      1,
      true,
      "Cosine",
      4,
      "qdr_tenant_a__my_collection"
    );

    const expectedPayload: QdrantPayload = { a: 1 };
    expect(result[0]).toEqual({
      id: "p1",
      score: 0.9,
      payload: expectedPayload,
    });
  });

  it("throws when search result row has missing id", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[{ point_id: "", score: 0.9 }]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

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
    const bulkUpsertRowsOnceMock = vi.mocked(bulkUpsert.bulkUpsertRowsOnce);

    const points: QdrantPointStructDense[] = [
      { id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } },
    ];
    const result = await upsertPoints(
      "qdrant_all_points",
      points,
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(result).toBe(1);
    expect(bulkUpsertRowsOnceMock).toHaveBeenCalledTimes(1);
    const firstCallArgs = bulkUpsertRowsOnceMock.mock.calls[0]?.[0];
    expect(firstCallArgs).toBeDefined();
    expect(firstCallArgs?.tableName).toBe("qdrant_all_points");
    expect(firstCallArgs?.timeoutMs).toEqual(expect.any(Number));
  });

  it("upserts more than UPSERT_BATCH_SIZE points in multiple batches (one_table)", async () => {
    const bulkUpsertRowsOnceMock = vi.mocked(bulkUpsert.bulkUpsertRowsOnce);

    const total = UPSERT_BATCH_SIZE + 50;
    const points: QdrantPointStructDense[] = Array.from(
      { length: total },
      (_, i) => ({
        id: `p${i}`,
        vector: [0, 0, 0, 1],
        payload: { i },
      })
    );

    const result = await upsertPoints(
      "qdrant_all_points",
      points,
      4,
      "qdr_tenant_a__my_collection"
    );

    expect(result).toBe(total);
    expect(bulkUpsertRowsOnceMock).toHaveBeenCalledTimes(
      Math.ceil(total / UPSERT_BATCH_SIZE)
    );
  });

  it("searches points with uid parameter for one_table mode (Cosine)", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[{ point_id: "p1", score: 0.9 }]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

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
    expect(h.calls).toHaveLength(1);
    const yql = h.calls[0].yql;
    expect(yql).toContain("FROM qdrant_all_points");
    expect(yql).toContain("embedding_quantized");
    expect(yql).toContain("ORDER BY Knn::CosineSimilarity");
    expect(yql).toContain("Knn::CosineDistance");
    expect(yql).toContain("ORDER BY score ASC");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"0\"')");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"1\"')");

    expect(getQueryParam(h.calls[0].query, "$p0_0")).toBeDefined();
    expect(getQueryParam(h.calls[0].query, "$p0_1")).toBeDefined();
  });

  it("searches points with uid parameter for one_table mode (Euclid)", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[{ point_id: "p1", score: 0.5 }]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

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
    expect(h.calls).toHaveLength(1);
    const yql = h.calls[0].yql;
    // Approximate phase should use EuclideanDistance for Euclid metric
    expect(yql).toContain("ORDER BY Knn::EuclideanDistance");
    expect(yql).toContain("embedding_quantized");
    // Exact phase should use EuclideanDistance for re-ranking
    expect(yql).toContain("Knn::EuclideanDistance");
    expect(yql).toContain("ORDER BY score ASC");
  });

  it("uses exact mode when SEARCH_MODE is exact for one_table", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[{ point_id: "p1", score: 0.9 }]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    // Switch mocked env SEARCH_MODE to exact via setter (mock factory must support it).
    const envMock = await import("../../src/config/env.js");
    (
      envMock as unknown as {
        SEARCH_MODE: string;
        SearchMode: { Exact: string };
      }
    ).SEARCH_MODE = envMock.SearchMode.Exact;

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
    expect(h.calls).toHaveLength(1);
    const yql = h.calls[0].yql;
    expect(yql).toContain("FROM qdrant_all_points");
    expect(yql).not.toContain("embedding_quantized");
  });

  it("deletes points with uid parameter for one_table mode", async () => {
    const h = createSqlHarness();
    // deletePointsOneTable executes 1 query per id
    h.plan([{ result: [[]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const deleted = await deletePoints(
      "qdrant_all_points",
      ["p1"],
      "qdr_tenant_a__my_collection"
    );

    expect(deleted).toBe(1);
    expect(h.calls).toHaveLength(1);
    const yql = h.calls[0].yql;
    expect(yql).toContain("WHERE uid = $uid AND point_id = $id");
  });

  it("retries transient OVERLOADED errors for deletePoints (one_table)", async () => {
    vi.useFakeTimers();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const h = createSqlHarness();
      // First attempt: error; retry attempt: success (new query object -> new sql call)
      h.plan([
        {
          error: new Error(
            'Overloaded (code 400060): [{"message":"Kikimr cluster or one of its subsystems is overloaded."}]'
          ),
        },
      ]);
      h.plan([{ result: [[]] }]);

      withSessionMock.mockImplementation(
        async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
          await fn(h.sql, new AbortController().signal)
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
      expect(h.calls).toHaveLength(2);
    } finally {
      randomSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it("deletes points by pathSegments filter (must) for one_table mode", async () => {
    const h = createSqlHarness();
    // First loop batch: delete 1; second batch: 0 stop
    h.plan([{ result: [[{ deleted: 1 }]] }]);
    h.plan([{ result: [[{ deleted: 0 }]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const deleted = await deletePointsByPathSegments(
      "qdrant_all_points",
      "qdr_tenant_a__my_collection",
      [["src", "hooks", "useMonacoGhost.ts"]]
    );

    expect(deleted).toBe(1);
    expect(h.calls).toHaveLength(2);
    const yql = h.calls[0].yql;
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"0\"')");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"1\"')");
    expect(yql).toContain("JSON_VALUE(payload, '$.pathSegments.\"2\"')");
    expect(yql).toContain("$to_delete");
    expect(yql).toContain("SELECT uid, point_id");
    expect(yql).toContain("DELETE FROM qdrant_all_points ON");
    expect(yql).toContain("SELECT COUNT(*) AS deleted FROM $to_delete");

    expect(getQueryParam(h.calls[0].query, "$p0_0")).toBeDefined();
    expect(getQueryParam(h.calls[0].query, "$p0_1")).toBeDefined();
    expect(getQueryParam(h.calls[0].query, "$p0_2")).toBeDefined();
  });

  it("retries transient OVERLOADED errors for deletePointsByPathSegments (one_table)", async () => {
    vi.useFakeTimers();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const h = createSqlHarness();
      // First batch: attempt 1 fails, attempt 2 succeeds (fresh query per retry).
      h.plan([
        {
          error: new Error(
            'Overloaded (code 400060): [{"message":"Tablet is overloaded."},{"message":"wrong shard state"}]'
          ),
        },
      ]);
      h.plan([{ result: [[{ deleted: 1 }]] }]);
      // Next loop batch: 0 stop.
      h.plan([{ result: [[{ deleted: 0 }]] }]);

      withSessionMock.mockImplementation(
        async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
          await fn(h.sql, new AbortController().signal)
      );

      const p = deletePointsByPathSegments(
        "qdrant_all_points",
        "qdr_tenant_a__my_collection",
        [["src", "hooks", "useMonacoGhost.ts"]]
      );
      await Promise.resolve(); // allow backoff timer to be scheduled
      await vi.advanceTimersByTimeAsync(250);

      const deleted = await p;

      expect(deleted).toBe(1);
      // 1 failed attempt + 1 retry success + 1 final batch (0)
      expect(h.calls).toHaveLength(3);
    } finally {
      randomSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
