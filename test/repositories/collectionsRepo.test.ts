import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("../../src/ydb/client.js", () => {
  const createExecuteQuerySettings = vi.fn(() => ({
    kind: "ExecuteQuerySettings",
  }));
  const createExecuteQuerySettingsWithTimeout = vi.fn(
    (opts: unknown) => ({ kind: "ExecuteQuerySettings", opts }) as const
  );

  return {
    Types: {
      UTF8: "UTF8",
      BYTES: "BYTES",
      JSON_DOCUMENT: "JSON_DOCUMENT",
      FLOAT: "FLOAT",
      list: vi.fn((t: unknown) => ({ kind: "list", t })),
    },
    TypedValues: {
      utf8: vi.fn((v: string) => ({ type: "utf8", v })),
      uint32: vi.fn((v: number) => ({ type: "uint32", v })),
      timestamp: vi.fn((v: Date) => ({ type: "timestamp", v })),
      list: vi.fn((t: unknown, list: unknown[]) => ({ type: "list", t, list })),
    },
    withSession: vi.fn(),
    TableDescription: class {
      cols: unknown[] = [];
      pk: string[] = [];
      withColumns(...cols: unknown[]) {
        this.cols = cols;
        return this;
      }
      withPrimaryKey(...pk: string[]) {
        this.pk = pk;
        return this;
      }
      withPrimaryKeys(...pk: string[]) {
        this.pk = pk;
        return this;
      }
    },
    Column: class {
      name: string;
      type: unknown;
      constructor(name: string, type: unknown) {
        this.name = name;
        this.type = type;
      }
    },
    createExecuteQuerySettings,
    createExecuteQuerySettingsWithTimeout,
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
import { UPSERT_OPERATION_TIMEOUT_MS } from "../../src/config/env.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("collectionsRepo (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts collection metadata (one-table; no per-collection table)", async () => {
    const sessionMock = {
      createTable: vi.fn(),
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    await createCollection("tenant_a/my_collection", 128, "Cosine", "float");

    expect(sessionMock.createTable).not.toHaveBeenCalled();
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);

    const params = sessionMock.executeQuery.mock.calls[0]?.[1] as
      | { $table?: { v?: string } }
      | undefined;
    expect(params?.$table?.v).toBe("qdrant_all_points");

    const { createExecuteQuerySettingsWithTimeout } = ydbClient as unknown as {
      createExecuteQuerySettingsWithTimeout: Mock;
    };
    expect(createExecuteQuerySettingsWithTimeout).toHaveBeenCalledWith({
      keepInCache: true,
      idempotent: true,
      timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
    });

    // Ensure the 4th argument (settings) is passed to executeQuery.
    const call = sessionMock.executeQuery.mock.calls[0];
    expect(call?.[2]).toBe(undefined);
    expect(call?.[3]).toMatchObject({ kind: "ExecuteQuerySettings" });
  });

  it("returns null from getCollectionMeta when no rows returned", async () => {
    withSessionMock.mockResolvedValueOnce({
      resultSets: [{ rows: [] }],
    } as unknown as never);

    const meta = await getCollectionMeta("tenant_a/my_collection");

    expect(meta).toBeNull();
  });

  it("parses collection metadata row into typed object", async () => {
    withSessionMock.mockResolvedValueOnce({
      resultSets: [
        {
          rows: [
            {
              items: [
                { textValue: "qdr_tenant_a__my_collection" },
                { uint32Value: 128 },
                { textValue: "Euclid" },
                { textValue: "float" },
              ],
            },
          ],
        },
      ],
    } as unknown as never);

    const meta = await getCollectionMeta("tenant_a/my_collection");

    expect(meta).toEqual({
      table: "qdr_tenant_a__my_collection",
      dimension: 128,
      distance: "Euclid",
      vectorType: "float",
    });
  });
});
