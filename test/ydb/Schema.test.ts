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
async function resetSchemaModule(
  envOverrides?: Record<string, string>
): Promise<{
  ensureGlobalPointsTable: typeof import("../../src/ydb/schema.js")["ensureGlobalPointsTable"];
  GLOBAL_POINTS_TABLE: typeof import("../../src/ydb/schema.js")["GLOBAL_POINTS_TABLE"];
}> {
  vi.resetModules();
  const originalEnvSnapshot = { ...process.env };
  Object.entries(envOverrides ?? {}).forEach(([key, value]) => {
    process.env[key] = value;
  });

  const schema = await import("../../src/ydb/schema.js");

  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnvSnapshot)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnvSnapshot);

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
      sessionId: "test-session",
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
      api: {
        executeSchemeQuery: vi.fn().mockResolvedValue(undefined),
      },
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await ensureGlobalPointsTable();
    await ensureGlobalPointsTable();

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
    // At least one executeQuery call for the NULL-check query; no backfill needed
    expect(session.executeQuery).toHaveBeenCalled();
    const checkCall = session.executeQuery.mock.calls[0][0] as string;
    expect(checkCall).toContain("SELECT 1 AS has_null");
    expect(checkCall).toContain("embedding_bit IS NULL");
  });

  it("creates table when it does not exist", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const session = {
      sessionId: "test-session",
      describeTable: vi.fn().mockRejectedValue(new Error("Table not found")),
      createTable: vi.fn().mockResolvedValue(undefined),
      executeQuery: vi.fn(),
      api: {
        executeSchemeQuery: vi.fn().mockResolvedValue(undefined),
      },
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

  it("throws when embedding_bit column is missing and automigrate is disabled", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const session = {
      sessionId: "test-session",
      describeTable: vi.fn().mockResolvedValue({
        columns: [
          { name: "uid" },
          { name: "point_id" },
          { name: "embedding" },
          { name: "payload" },
        ],
      }),
      createTable: vi.fn(),
      executeQuery: vi.fn().mockResolvedValue(undefined),
      api: {
        executeSchemeQuery: vi.fn().mockResolvedValue(undefined),
      },
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await expect(ensureGlobalPointsTable()).rejects.toThrow(
      `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_bit; set YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true after backup to apply the migration manually.`
    );

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
    expect(session.executeQuery).not.toHaveBeenCalled();
  });

  it("adds embedding_bit column and backfills when automigration is opt-in", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule({ YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE: "true" });

    const session = {
      sessionId: "test-session",
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
      api: {
        executeSchemeQuery: vi.fn().mockResolvedValue(undefined),
      },
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await ensureGlobalPointsTable();

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
    expect(session.api.executeSchemeQuery).toHaveBeenCalledTimes(1);

    const alterReq = session.api.executeSchemeQuery.mock.calls[0][0] as {
      yqlText: string;
    };
    expect(alterReq.yqlText).toContain("ALTER TABLE");
    expect(alterReq.yqlText).toContain(GLOBAL_POINTS_TABLE);
    expect(alterReq.yqlText).toContain("ADD COLUMN embedding_bit");

    expect(session.executeQuery).toHaveBeenCalledTimes(1);

    const updateCall = session.executeQuery.mock.calls[0][0] as string;
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

  it("throws when embedding_bit column exists but legacy NULL values remain and automigrate is disabled", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const session = {
      sessionId: "test-session",
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
      executeQuery: vi.fn().mockResolvedValueOnce({
        resultSets: [{ rows: [{}] }],
      }),
      api: {
        executeSchemeQuery: vi.fn().mockResolvedValue(undefined),
      },
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await expect(ensureGlobalPointsTable()).rejects.toThrow(
      `Global points table ${GLOBAL_POINTS_TABLE} requires backfill for embedding_bit; set YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true after backup to apply the migration manually.`
    );

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
    expect(session.executeQuery).toHaveBeenCalledTimes(1);

    const checkCall = session.executeQuery.mock.calls[0][0] as string;
    expect(checkCall).toContain("SELECT 1 AS has_null");
    expect(checkCall).toContain("embedding_bit IS NULL");
  });

  it("backfills when embedding_bit column exists but legacy NULL values remain and automigrate is enabled", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule({ YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE: "true" });

    const session = {
      sessionId: "test-session",
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
      executeQuery: vi
        .fn()
        // First call: NULL-check query returns at least one row
        .mockResolvedValueOnce({
          resultSets: [{ rows: [{}] }],
        })
        // Second call: backfill UPDATE
        .mockResolvedValueOnce(undefined),
      api: {
        executeSchemeQuery: vi.fn().mockResolvedValue(undefined),
      },
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await ensureGlobalPointsTable();

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
    expect(session.executeQuery).toHaveBeenCalledTimes(2);

    const checkCall = session.executeQuery.mock.calls[0][0] as string;
    expect(checkCall).toContain("SELECT 1 AS has_null");
    expect(checkCall).toContain("embedding_bit IS NULL");

    const updateCall = session.executeQuery.mock.calls[1][0] as string;
    expect(updateCall).toContain("UPDATE");
    expect(updateCall).toContain(GLOBAL_POINTS_TABLE);
    expect(updateCall).toContain("Knn::ToBinaryStringBit");
    expect(updateCall).toContain("Knn::FloatFromBinaryString");
  });
});
