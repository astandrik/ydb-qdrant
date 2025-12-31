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

import { deleteCollection } from "../../src/repositories/collectionsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import * as envConfig from "../../src/config/env.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;
const envConfigWithSetter = envConfig as unknown as {
  __setUseBatchDeleteForCollections?: (value: boolean) => void;
};

describe("collectionsRepo/deleteCollection one-table (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(false);
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

  it("uses BATCH DELETE when USE_BATCH_DELETE_FOR_COLLECTIONS is enabled", async () => {
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(true);

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
    expect(calls[0][0]).toContain("BATCH DELETE FROM qdrant_all_points");
    expect(calls[0][0]).toContain("WHERE uid = $uid");
    expect(calls[0][0]).not.toContain("SELECT point_id");
    expect(calls[0][0]).not.toContain("point_id IN");
    expect(calls[1][0]).toContain("DELETE FROM qdr__collections");
  });

  it("falls back to chunked deletion for BATCH DELETE on out-of-buffer-memory error", async () => {
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(true);

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

    let batchDeleteAttempts = 0;
    let selectCalls = 0;
    let deleteBatchCalls = 0;
    let metaDeleteCalls = 0;

    sessionMock.executeQuery.mockImplementation(
      (yql: string, params: unknown) => {
        if (yql.includes("BATCH DELETE FROM qdrant_all_points")) {
          batchDeleteAttempts += 1;
          throw new Error("Out of buffer memory while deleting rows");
        }

        if (yql.includes("SELECT point_id")) {
          selectCalls += 1;
          if (selectCalls === 1) {
            return {
              resultSets: [
                {
                  rows: [
                    { items: [{ textValue: "p1" }] },
                    { items: [{ textValue: "p2" }] },
                  ],
                },
              ],
            };
          }
          if (selectCalls === 2) {
            return {
              resultSets: [
                {
                  rows: [
                    { items: [{ textValue: "p3" }] },
                    { items: [undefined] },
                  ],
                },
              ],
            };
          }
          return {
            resultSets: [
              {
                rows: [],
              },
            ],
          };
        }

        if (
          yql.includes("DELETE FROM qdrant_all_points") &&
          yql.includes("point_id IN")
        ) {
          deleteBatchCalls += 1;
          const typedParams = params as {
            $ids: { list: string[] };
          };
          if (deleteBatchCalls === 1) {
            expect(typedParams.$ids.list).toEqual(["p1", "p2"]);
          }
          if (deleteBatchCalls === 2) {
            expect(typedParams.$ids.list).toEqual(["p3"]);
          }
          return {};
        }

        if (yql.includes("DELETE FROM qdr__collections")) {
          metaDeleteCalls += 1;
          return {};
        }

        throw new Error(`Unexpected YQL: ${yql}`);
      }
    );

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

    expect(batchDeleteAttempts).toBe(1);
    expect(selectCalls).toBe(3);
    expect(deleteBatchCalls).toBe(2);
    expect(metaDeleteCalls).toBe(1);
  });

  it("falls back to chunked deletion on out-of-buffer-memory error (Error.message)", async () => {
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

    let bulkDeleteAttempts = 0;
    let selectCalls = 0;
    let deleteBatchCalls = 0;
    let metaDeleteCalls = 0;

    sessionMock.executeQuery.mockImplementation(
      (yql: string, params: unknown) => {
        if (
          yql.includes("DELETE FROM qdrant_all_points WHERE uid") &&
          !yql.includes("point_id IN")
        ) {
          bulkDeleteAttempts += 1;
          throw new Error("Out of buffer memory while deleting rows");
        }

        if (yql.includes("SELECT point_id")) {
          selectCalls += 1;
          if (selectCalls === 1) {
            return {
              resultSets: [
                {
                  rows: [
                    { items: [{ textValue: "p1" }] },
                    { items: [{ textValue: "p2" }] },
                  ],
                },
              ],
            };
          }
          if (selectCalls === 2) {
            return {
              resultSets: [
                {
                  rows: [
                    { items: [{ textValue: "p3" }] },
                    // non-string id should be filtered out
                    { items: [{ textValue: undefined as unknown as string }] },
                  ],
                },
              ],
            };
          }
          return {
            resultSets: [
              {
                rows: [],
              },
            ],
          };
        }

        if (
          yql.includes("DELETE FROM qdrant_all_points") &&
          yql.includes("point_id IN")
        ) {
          deleteBatchCalls += 1;
          const typedParams = params as {
            $ids: { list: string[] };
          };
          if (deleteBatchCalls === 1) {
            expect(typedParams.$ids.list).toEqual(["p1", "p2"]);
          }
          if (deleteBatchCalls === 2) {
            expect(typedParams.$ids.list).toEqual(["p3"]);
          }
          return {};
        }

        if (yql.includes("DELETE FROM qdr__collections")) {
          metaDeleteCalls += 1;
          return {};
        }

        throw new Error(`Unexpected YQL: ${yql}`);
      }
    );

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

    expect(bulkDeleteAttempts).toBe(1);
    expect(selectCalls).toBe(3);
    expect(deleteBatchCalls).toBe(2);
    expect(metaDeleteCalls).toBe(1);
  });

  it("falls back to chunked deletion when error issues contain out-of-buffer-memory text", async () => {
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

    let bulkDeleteAttempts = 0;
    let selectCalls = 0;
    let deleteBatchCalls = 0;
    let metaDeleteCalls = 0;

    sessionMock.executeQuery.mockImplementation((yql: string) => {
      if (
        yql.includes("DELETE FROM qdrant_all_points WHERE uid") &&
        !yql.includes("point_id IN")
      ) {
        bulkDeleteAttempts += 1;
        const err = new Error("YDB data query failure");
        (err as { issues?: string }).issues =
          "Out of buffer memory while executing data query";
        throw err;
      }

      if (yql.includes("SELECT point_id")) {
        selectCalls += 1;
        return {
          resultSets: [
            {
              rows: [],
            },
          ],
        };
      }

      if (
        yql.includes("DELETE FROM qdrant_all_points") &&
        yql.includes("point_id IN")
      ) {
        deleteBatchCalls += 1;
        return {};
      }

      if (yql.includes("DELETE FROM qdr__collections")) {
        metaDeleteCalls += 1;
        return {};
      }

      throw new Error(`Unexpected YQL: ${yql}`);
    });

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

    expect(bulkDeleteAttempts).toBe(1);
    expect(selectCalls).toBe(1);
    expect(deleteBatchCalls).toBe(0);
    expect(metaDeleteCalls).toBe(1);
  });

  it("rethrows errors that are not out-of-buffer-memory", async () => {
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

    sessionMock.executeQuery.mockImplementation((yql: string) => {
      if (
        yql.includes("DELETE FROM qdrant_all_points WHERE uid") &&
        !yql.includes("point_id IN")
      ) {
        throw new Error("Some other YDB error");
      }

      if (yql.includes("SELECT point_id")) {
        return {
          resultSets: [
            {
              rows: [],
            },
          ],
        };
      }

      if (
        yql.includes("DELETE FROM qdrant_all_points") &&
        yql.includes("point_id IN")
      ) {
        return {};
      }

      if (yql.includes("DELETE FROM qdr__collections")) {
        return {};
      }

      throw new Error(`Unexpected YQL: ${yql}`);
    });

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

    await expect(
      deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection")
    ).rejects.toThrow("Some other YDB error");

    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("rethrows non-out-of-buffer-memory errors for BATCH DELETE", async () => {
    envConfigWithSetter.__setUseBatchDeleteForCollections?.(true);

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

    sessionMock.executeQuery.mockImplementation((yql: string) => {
      if (yql.includes("BATCH DELETE FROM qdrant_all_points")) {
        throw new Error("Some other YDB error");
      }

      if (yql.includes("SELECT point_id")) {
        return {
          resultSets: [
            {
              rows: [],
            },
          ],
        };
      }

      if (
        yql.includes("DELETE FROM qdrant_all_points") &&
        yql.includes("point_id IN")
      ) {
        return {};
      }

      if (yql.includes("DELETE FROM qdr__collections")) {
        return {};
      }

      throw new Error(`Unexpected YQL: ${yql}`);
    });

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

    await expect(
      deleteCollection("tenant_a/my_collection", "qdr_tenant_a__my_collection")
    ).rejects.toThrow("Some other YDB error");

    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
  });
});
