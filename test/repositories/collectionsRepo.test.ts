import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("../../src/ydb/client.js", () => {
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
  };
});

vi.mock("../../src/config/env.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/config/env.js")
  >("../../src/config/env.js");

  return {
    ...actual,
    LOG_LEVEL: "info",
    COLLECTION_STORAGE_MODE: actual.CollectionStorageMode.MultiTable,
    isOneTableMode: (mode: CollectionStorageMode) =>
      mode === actual.CollectionStorageMode.OneTable,
  };
});

import { CollectionStorageMode } from "../../src/config/env.js";
import {
  createCollection,
  getCollectionMeta,
  deleteCollection,
  buildVectorIndex,
} from "../../src/repositories/collectionsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("collectionsRepo (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates collection table and upserts metadata", async () => {
    const sessionMock = {
      createTable: vi.fn(),
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    await createCollection(
      "tenant_a/my_collection",
      128,
      "Cosine",
      "float",
      "qdr_tenant_a__my_collection"
    );

    expect(sessionMock.createTable).toHaveBeenCalledWith(
      "qdr_tenant_a__my_collection",
      expect.any(ydbClient.TableDescription)
    );
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
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

  it("deletes collection table and metadata when meta exists", async () => {
    const sessionMock = {
      dropTable: vi.fn(),
      executeQuery: vi.fn(),
    };

    // First withSession call: getCollectionMeta query
    withSessionMock
      .mockResolvedValueOnce({
        resultSets: [
          {
            rows: [
              {
                items: [
                  { textValue: "qdr_tenant_a__my_collection" },
                  { uint32Value: 128 },
                  { textValue: "Cosine" },
                  { textValue: "float" },
                ],
              },
            ],
          },
        ],
      } as unknown as never)
      // Subsequent calls: dropTable and delete metadata
      .mockImplementation(async (fn: (s: unknown) => unknown) => {
        await fn(sessionMock);
      });

    await deleteCollection("tenant_a/my_collection");

    expect(sessionMock.dropTable).toHaveBeenCalledWith(
      "qdr_tenant_a__my_collection"
    );
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("builds vector index and ignores missing index errors on drop", async () => {
    const executeSchemeQuery = vi
      .fn()
      .mockRejectedValueOnce(new Error("index emb_idx not found"))
      .mockResolvedValueOnce(undefined);

    const sessionMock = {
      sessionId: "sess-1",
      api: { executeSchemeQuery },
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    await buildVectorIndex(
      "qdr_tenant_a__my_collection",
      128,
      "Cosine",
      "float"
    );

    expect(executeSchemeQuery).toHaveBeenCalledTimes(2);
    const calls = executeSchemeQuery.mock.calls.map(
      (c) => c[0] as { yqlText: string }
    );
    expect(calls[0]?.yqlText).toContain("DROP INDEX emb_idx");
    expect(calls[1]?.yqlText).toContain("ADD INDEX emb_idx GLOBAL SYNC");
  });

  it("skips table creation in one_table mode", async () => {
    const sessionMock = {
      createTable: vi.fn(),
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    await createCollection(
      "tenant_a/my_collection",
      128,
      "Cosine",
      "float",
      "qdr_tenant_a__my_collection",
      CollectionStorageMode.OneTable
    );

    expect(sessionMock.createTable).not.toHaveBeenCalled();
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("deletes points from global table in one_table mode", async () => {
    const sessionMock = {
      describeTable: vi.fn().mockResolvedValue({
        columns: [
          { name: "uid" },
          { name: "point_id" },
          { name: "embedding" },
          { name: "embedding_quantized" },
          { name: "payload" },
        ],
      }),
      createTable: vi.fn(),
      dropTable: vi.fn(),
      executeQuery: vi.fn(),
    };

    withSessionMock
      .mockResolvedValueOnce({
        resultSets: [
          {
            rows: [
              {
                items: [
                  { textValue: "qdrant_all_points" },
                  { uint32Value: 128 },
                  { textValue: "Cosine" },
                  { textValue: "float" },
                ],
              },
            ],
          },
        ],
      } as unknown as never)
      .mockImplementation(async (fn: (s: unknown) => unknown) => {
        await fn(sessionMock);
      });

    await deleteCollection(
      "tenant_a/my_collection",
      "qdr_tenant_a__my_collection"
    );

    expect(sessionMock.dropTable).not.toHaveBeenCalled();
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
    const calls = sessionMock.executeQuery.mock.calls;
    expect(calls[0][0]).toContain("DELETE FROM qdrant_all_points WHERE uid");
    expect(calls[1][0]).toContain("DELETE FROM qdr__collections");
  });
});
