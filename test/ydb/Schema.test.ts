import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

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
import { logger } from "../../src/logging/logger.js";

const withSessionMock = withSession as unknown as Mock;
const loggerInfoMock = logger.info as unknown as Mock;

// Reset module state between tests
async function resetSchemaModule() {
  vi.resetModules();
  const schema = await import("../../src/ydb/schema.js");
  return schema;
}

describe("ydb/schema.ensureGlobalPointsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is idempotent after first successful describeTable with all columns", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const session = {
      describeTable: vi.fn().mockResolvedValue({
        columns: [
          { name: "uid" },
          { name: "point_id" },
          { name: "embedding" },
          { name: "embedding_bit" },
          { name: "payload" },
        ],
      }),
      createTable: vi.fn(),
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await ensureGlobalPointsTable();
    await ensureGlobalPointsTable();

    expect(withSessionMock).toHaveBeenCalledTimes(1);
    expect(session.describeTable).toHaveBeenCalledTimes(1);
    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
    expect(session.executeQuery).not.toHaveBeenCalled();
  });

  it("creates table when it does not exist", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const session = {
      describeTable: vi.fn().mockRejectedValue(new Error("Table not found")),
      createTable: vi.fn().mockResolvedValue(undefined),
      executeQuery: vi.fn(),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await ensureGlobalPointsTable();

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).toHaveBeenCalledTimes(1);
    expect(session.executeQuery).not.toHaveBeenCalled();
    expect(loggerInfoMock).toHaveBeenCalledWith(
      `created global points table ${GLOBAL_POINTS_TABLE}`
    );
  });

  it("adds embedding_bit column and backfills when missing from existing table", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const session = {
      describeTable: vi.fn().mockResolvedValue({
        columns: [
          { name: "uid" },
          { name: "point_id" },
          { name: "embedding" },
          { name: "payload" },
          // Note: embedding_bit is missing
        ],
      }),
      createTable: vi.fn(),
      executeQuery: vi.fn().mockResolvedValue(undefined),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await ensureGlobalPointsTable();

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
    expect(session.executeQuery).toHaveBeenCalledTimes(2);

    // First call: ALTER TABLE to add column
    const alterCall = session.executeQuery.mock.calls[0][0] as string;
    expect(alterCall).toContain("ALTER TABLE");
    expect(alterCall).toContain(GLOBAL_POINTS_TABLE);
    expect(alterCall).toContain("ADD COLUMN embedding_bit");

    // Second call: UPDATE to backfill
    const updateCall = session.executeQuery.mock.calls[1][0] as string;
    expect(updateCall).toContain("UPDATE");
    expect(updateCall).toContain(GLOBAL_POINTS_TABLE);
    expect(updateCall).toContain("Knn::ToBinaryStringBit");
    expect(updateCall).toContain("Knn::FloatFromBinaryString");

    expect(loggerInfoMock).toHaveBeenCalledWith(
      `added embedding_bit column to existing table ${GLOBAL_POINTS_TABLE}`
    );
    expect(loggerInfoMock).toHaveBeenCalledWith(
      `backfilled embedding_bit column from embedding in ${GLOBAL_POINTS_TABLE}`
    );
  });
});
