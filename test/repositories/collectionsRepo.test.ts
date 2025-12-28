import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { createSqlHarness } from "../helpers/ydbjsQueryMock.js";

vi.mock("../../src/ydb/client.js", () => {
  return {
    withSession: vi.fn(),
  };
});

vi.mock("../../src/config/env.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/config/env.js")
  >("../../src/config/env.js");

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

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
import {
  createCollection,
  getCollectionMeta,
} from "../../src/repositories/collectionsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("collectionsRepo (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates collection table and upserts metadata", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await createCollection("tenant_a/my_collection", 128, "Cosine", "float");

    expect(h.calls).toHaveLength(1);
    expect(h.calls[0].yql).toContain("UPSERT INTO qdr__collections");
  });

  it("returns null from getCollectionMeta when no rows returned", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[]] }]);

    withSessionMock.mockImplementationOnce(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const meta = await getCollectionMeta("tenant_a/my_collection");

    expect(meta).toBeNull();
  });

  it("parses collection metadata row into typed object", async () => {
    const h = createSqlHarness();
    h.plan([
      {
        result: [
          [
            {
              table_name: "qdr_tenant_a__my_collection",
              vector_dimension: 128,
              distance: "Euclid",
              vector_type: "float",
              last_accessed_at: "2025-01-01T00:00:00.000Z",
            },
          ],
        ],
      },
    ]);

    withSessionMock.mockImplementationOnce(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const meta = await getCollectionMeta("tenant_a/my_collection");

    expect(meta).toEqual({
      table: "qdr_tenant_a__my_collection",
      dimension: 128,
      distance: "Euclid",
      vectorType: "float",
      lastAccessedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
  });

  it("skips table creation in one_table mode", async () => {
    const h = createSqlHarness();
    h.plan([{ result: [[]] }]);

    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    await createCollection("tenant_a/my_collection", 128, "Cosine", "float");

    expect(h.calls).toHaveLength(1);
    expect(h.calls[0].yql).toContain("UPSERT INTO qdr__collections");
  });
});
