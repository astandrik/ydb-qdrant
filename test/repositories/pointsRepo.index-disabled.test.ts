import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("../../src/ydb/client.js", () => {
  return {
    Types: {
      UTF8: "UTF8",
      BYTES: "BYTES",
      JSON_DOCUMENT: "JSON_DOCUMENT",
      FLOAT: "FLOAT",
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
    buildVectorParam: vi.fn((vec: number[]) => ({
      kind: "vector",
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

vi.mock("../../src/config/env.js", () => ({
  LOG_LEVEL: "info",
  VECTOR_INDEX_BUILD_ENABLED: false,
  TABLE_LAYOUT: "multi_table",
}));

import { searchPoints } from "../../src/repositories/pointsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("pointsRepo with VECTOR_INDEX_BUILD_ENABLED=false", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses table scan (no VIEW emb_idx) when index builds are disabled", async () => {
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
      "qdr_tenant_a__my_collection",
      [0, 0, 0, 1],
      1,
      false,
      "Cosine",
      4
    );

    expect(result).toEqual([{ id: "p1", score: 0.9 }]);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    const firstCall = (
      (sessionMock.executeQuery as unknown as Mock).mock.calls[0] as [
        unknown,
        ...unknown[]
      ]
    )[0];
    expect(String(firstCall)).not.toContain("VIEW emb_idx");
  });
});
