import { describe, it, expect, vi, type Mock } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/ydb/client.js", () => {
  class FakeTableDescription {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    withColumns(..._cols: unknown[]) {
      return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    withPrimaryKeys(..._keys: string[]) {
      return this;
    }
  }

  class FakeColumn {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_name: string, _type: unknown) {}
  }

  return {
    TableDescription: FakeTableDescription,
    Column: FakeColumn,
    Types: {
      UTF8: "UTF8",
      BYTES: "BYTES",
      JSON_DOCUMENT: "JSON_DOCUMENT",
    },
    withSession: vi.fn(),
  };
});

import { withSession } from "../../src/ydb/client.js";
import {
  ensureGlobalPointsTable,
  GLOBAL_POINTS_TABLE,
} from "../../src/ydb/schema.js";

const withSessionMock = withSession as unknown as Mock;

describe("ydb/schema.ensureGlobalPointsTable", () => {
  it("is idempotent after first successful describeTable", async () => {
    const session = {
      describeTable: vi.fn().mockResolvedValue(undefined),
      createTable: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(session);
    });

    await ensureGlobalPointsTable();
    await ensureGlobalPointsTable();

    expect(withSessionMock).toHaveBeenCalledTimes(1);
    expect(session.describeTable).toHaveBeenCalledTimes(1);
    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
  });
});
