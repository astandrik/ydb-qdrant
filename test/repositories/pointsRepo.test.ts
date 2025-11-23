import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("../../src/ydb/client.js", () => {
  return {
    Types: {
      UTF8: "UTF8",
      BYTES: "BYTES",
      JSON_DOCUMENT: "JSON_DOCUMENT",
      FLOAT: "FLOAT",
      UINT8: "UINT8",
    },
    TypedValues: {
      utf8: vi.fn((v: string) => ({ type: "utf8", v })),
      uint32: vi.fn((v: number) => ({ type: "uint32", v })),
      timestamp: vi.fn((v: Date) => ({ type: "timestamp", v })),
      list: vi.fn((t: unknown, list: unknown[]) => ({ type: "list", t, list })),
    },
    withSession: vi.fn(),
  };
});

vi.mock("../../src/ydb/helpers.js", () => {
  return {
    buildVectorParam: vi.fn((vec: number[], vectorType: string) => ({
      kind: "vector",
      vectorType,
      vec,
    })),
    buildJsonOrEmpty: vi.fn((payload?: Record<string, unknown>) => ({
      kind: "json",
      payload: payload ?? {},
    })),
  };
});

vi.mock("../../src/indexing/IndexScheduler.js", () => ({
  notifyUpsert: vi.fn(),
}));

import {
  upsertPoints,
  searchPoints,
  deletePoints,
} from "../../src/repositories/pointsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import * as helpers from "../../src/ydb/helpers.js";
import { notifyUpsert } from "../../src/indexing/IndexScheduler.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("pointsRepo (with mocked YDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts points and notifies scheduler", async () => {
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const result = await upsertPoints(
      "qdr_tenant_a__my_collection",
      [
        { id: "p1", vector: [0, 0, 0, 1], payload: { a: 1 } },
        { id: 2, vector: [0, 0, 1, 0] },
      ],
      "float",
      4
    );

    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
    expect(helpers.buildVectorParam).toHaveBeenCalled();
    expect(helpers.buildJsonOrEmpty).toHaveBeenCalled();
    expect(result).toBe(2);
    expect(notifyUpsert).toHaveBeenCalledWith("qdr_tenant_a__my_collection", 2);
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
        "qdr_tenant_a__my_collection",
        [{ id: "p1", vector: [0, 1], payload: {} }],
        "float",
        4
      )
    ).rejects.toThrow(/Vector dimension mismatch/);
    expect(sessionMock.executeQuery).not.toHaveBeenCalled();
  });

  it("searches points using index and falls back on missing index", async () => {
    const firstSession = {
      executeQuery: vi
        .fn()
        .mockResolvedValueOnce({
          resultSets: [
            {
              rows: [
                {
                  items: [{ textValue: "p1" }, { floatValue: 0.9 }],
                },
              ],
            },
          ],
        })
        .mockRejectedValueOnce(new Error("no such index")),
    };

    const secondSession = {
      executeQuery: vi.fn().mockResolvedValueOnce({
        resultSets: [
          {
            rows: [
              {
                items: [{ textValue: "p2" }, { floatValue: 0.8 }],
              },
            ],
          },
        ],
      }),
    };

    let callCount = 0;
    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      callCount += 1;
      if (callCount === 1) {
        return await fn(firstSession);
      }
      return await fn(secondSession);
    });

    const result = await searchPoints(
      "qdr_tenant_a__my_collection",
      [0, 0, 0, 1],
      5,
      false,
      "Cosine",
      "float",
      4
    );

    // First attempt should succeed with index, second attempt should be fallback
    expect(result).toEqual([{ id: "p1", score: 0.9 }]);
    expect(firstSession.executeQuery).toHaveBeenCalled();
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
      "qdr_tenant_a__my_collection",
      [0, 0, 0, 1],
      1,
      true,
      "Cosine",
      "float",
      4
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
        "qdr_tenant_a__my_collection",
        [0, 0, 0, 1],
        1,
        false,
        "Cosine",
        "float",
        4
      )
    ).rejects.toThrow("point_id is missing in YDB search result");
  });

  it("deletes points one by one and returns deleted count", async () => {
    const sessionMock = {
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const deleted = await deletePoints("qdr_tenant_a__my_collection", [
      "p1",
      2,
    ]);

    expect(deleted).toBe(2);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
  });
});


