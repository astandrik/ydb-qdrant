import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import {
  createSqlHarness,
  decodeUtf8List,
  getQueryParam,
} from "../helpers/ydbjsQueryMock.js";

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

vi.mock("../../src/config/env.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/config/env.js")>(
    "../../src/config/env.js"
  );

  let useBatchDeleteForCollections = false;

  return {
    ...actual,
    LOG_LEVEL: "info",
    get USE_BATCH_DELETE_FOR_COLLECTIONS() {
      return useBatchDeleteForCollections;
    },
    __setUseBatchDeleteForCollections(value: boolean) {
      useBatchDeleteForCollections = value;
    },
  };
});

import { deleteCollection } from "../../src/repositories/collectionsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import * as envConfig from "../../src/config/env.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;
const envConfigWithSetter = envConfig as unknown as {
  __setUseBatchDeleteForCollections?: (value: boolean) => void;
};

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
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(false);
  });

  it("deletes points from global table in one_table mode", async () => {
    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ result: [[]] }]); // DELETE points
    h.plan([{ result: [[]] }]); // DELETE meta

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection");

    expect(h.calls).toHaveLength(3);
    expect(h.calls[0].yql).toContain("FROM qdr__collections");
    expect(h.calls[1].yql).toContain("DELETE FROM qdrant_all_points WHERE uid");
    expect(h.calls[2].yql).toContain("DELETE FROM qdr__collections");
  });

  it("uses BATCH DELETE when USE_BATCH_DELETE_FOR_COLLECTIONS is enabled", async () => {
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(true);

    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ result: [[]] }]); // BATCH DELETE points
    h.plan([{ result: [[]] }]); // DELETE meta

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection");

    expect(h.calls).toHaveLength(3);
    expect(h.calls[1].yql).toContain("BATCH DELETE FROM qdrant_all_points");
    expect(h.calls[1].yql).toContain("WHERE uid = $uid");
    expect(h.calls[1].yql).not.toContain("SELECT point_id");
    expect(h.calls[2].yql).toContain("DELETE FROM qdr__collections");
  });

  it("falls back to chunked deletion for BATCH DELETE on out-of-buffer-memory error", async () => {
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(true);

    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ error: new Error("Out of buffer memory while deleting rows") }]); // BATCH DELETE fails
    h.plan([{ result: [[{ point_id: "p1" }, { point_id: "p2" }]] }]); // SELECT ids
    h.plan([{ result: [[]] }]); // DELETE batch p1,p2
    h.plan([{ result: [[{ point_id: "p3" }, { point_id: "" }]] }]); // SELECT ids
    h.plan([{ result: [[]] }]); // DELETE batch p3
    h.plan([{ result: [[]] }]); // SELECT ids -> empty
    h.plan([{ result: [[]] }]); // DELETE meta

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection");

    const deleteBatchCalls = h.calls.filter(
      (c) =>
        c.yql.includes("DELETE FROM qdrant_all_points") && c.yql.includes("point_id IN")
    );
    expect(deleteBatchCalls).toHaveLength(2);

    const ids1 = decodeUtf8List(getQueryParam(deleteBatchCalls[0].query, /ids/i));
    const ids2 = decodeUtf8List(getQueryParam(deleteBatchCalls[1].query, /ids/i));
    expect(ids1).toEqual(["p1", "p2"]);
    expect(ids2).toEqual(["p3"]);
  });

  it("falls back to chunked deletion on out-of-buffer-memory error (Error.message)", async () => {
    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ error: new Error("Out of buffer memory while deleting rows") }]); // bulk DELETE fails
    h.plan([{ result: [[{ point_id: "p1" }, { point_id: "p2" }]] }]); // SELECT ids
    h.plan([{ result: [[]] }]); // DELETE batch p1,p2
    h.plan([{ result: [[{ point_id: "p3" }, { point_id: "" }]] }]); // SELECT ids
    h.plan([{ result: [[]] }]); // DELETE batch p3
    h.plan([{ result: [[]] }]); // SELECT ids -> empty
    h.plan([{ result: [[]] }]); // DELETE meta

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection");

    const deleteBatchCalls = h.calls.filter(
      (c) =>
        c.yql.includes("DELETE FROM qdrant_all_points") && c.yql.includes("point_id IN")
    );
    expect(deleteBatchCalls).toHaveLength(2);

    const ids1 = decodeUtf8List(getQueryParam(deleteBatchCalls[0].query, /ids/i));
    const ids2 = decodeUtf8List(getQueryParam(deleteBatchCalls[1].query, /ids/i));
    expect(ids1).toEqual(["p1", "p2"]);
    expect(ids2).toEqual(["p3"]);
  });

  it("falls back to chunked deletion when error issues contain out-of-buffer-memory text", async () => {
    const h = createSqlHarness();
    planMetaRow(h);

    const err = new Error("YDB data query failure") as Error & { issues?: string };
    err.issues = "Out of buffer memory while executing data query";
    h.plan([{ error: err }]); // bulk DELETE fails but detected via issues
    h.plan([{ result: [[]] }]); // SELECT ids -> empty
    h.plan([{ result: [[]] }]); // DELETE meta

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection");

    expect(h.calls[1].yql).toContain("DELETE FROM qdrant_all_points WHERE uid");
    expect(h.calls.some((c) => c.yql.includes("SELECT point_id"))).toBe(true);
    expect(
      h.calls.some(
        (c) => c.yql.includes("point_id IN") && c.yql.includes("DELETE FROM qdrant_all_points")
      )
    ).toBe(false);
    expect(h.calls[h.calls.length - 1].yql).toContain("DELETE FROM qdr__collections");
  });

  it("rethrows errors that are not out-of-buffer-memory", async () => {
    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ error: new Error("Some other YDB error") }]); // bulk DELETE fails

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await expect(
      deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection")
    ).rejects.toThrow("Some other YDB error");

    // meta lookup + failed delete; no further calls
    expect(h.calls).toHaveLength(2);
  });

  it("rethrows non-out-of-buffer-memory errors for BATCH DELETE", async () => {
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(true);

    const h = createSqlHarness();
    planMetaRow(h);
    h.plan([{ error: new Error("Some other YDB error") }]); // batch delete fails

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await expect(
      deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection")
    ).rejects.toThrow("Some other YDB error");

    expect(h.calls).toHaveLength(2);
    expect(h.calls[1].yql).toContain("BATCH DELETE FROM qdrant_all_points");
  });
});


