import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSqlHarness } from "../helpers/ydbjsQueryMock.js";

vi.mock("../../src/ydb/client.js", () => {
  return {
    withSession: vi.fn(),
  };
});

// Keep deleteCollection tests focused on deletion logic; schema bootstrap is tested separately.
vi.mock("../../src/ydb/schema.js", () => {
  return {
    GLOBAL_POINTS_TABLE: "qdrant_all_points",
    ensureGlobalPointsTable: vi.fn(async () => {}),
  };
});

import {
  deleteCollection,
  __resetCachesForTests,
} from "../../src/repositories/collectionsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";

const withSessionMock = vi.mocked(ydbClient.withSession);

function planMetaRow(h: ReturnType<typeof createSqlHarness>): void {
  h.plan([
    {
      result: [
        [
          {
            table_name: "qdrant_all_points",
            vector_dimension: 128,
            distance: "Cosine",
            vector_type: "float",
            last_accessed_at: "",
          },
        ],
      ],
    },
  ]);
}

describe("collectionsRepo/deleteCollection one-table (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetCachesForTests();
  });

  it("deletes points from global table in one_table mode", async () => {
    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ result: [[]] }]); // BATCH DELETE points
    h.plan([{ result: [[]] }]); // DELETE meta

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await deleteCollection(
      "tenant_a/my_collection",
      "qdr_tenant_a__my_collection"
    );

    expect(h.calls).toHaveLength(3);
    expect(h.calls[0].yql).toContain("FROM qdr__collections");
    expect(h.calls[1].yql).toContain("BATCH DELETE FROM qdrant_all_points");
    expect(h.calls[1].yql).toContain("WHERE uid = $uid");
    expect(h.calls[2].yql).toContain("DELETE FROM qdr__collections");
  });

  it("rethrows when BATCH DELETE fails", async () => {
    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ error: new Error("Some other YDB error") }]); // BATCH DELETE fails

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await expect(
      deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection")
    ).rejects.toThrow("Some other YDB error");

    // meta lookup + failed BATCH DELETE; no further calls
    expect(h.calls).toHaveLength(2);
    expect(h.calls[1].yql).toContain("BATCH DELETE FROM qdrant_all_points");
    expect(h.calls[1].yql).toContain("WHERE uid = $uid");
  });
});
