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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    withPartitioningSettings(..._settings: unknown[]) {
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
      UINT32: "UINT32",
      TIMESTAMP: "TIMESTAMP",
    },
    Ydb: {
      FeatureFlag: {
        Status: {
          ENABLED: 1,
        },
      },
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
          { name: "embedding_quantized" },
          { name: "payload" },
        ],
      }),
      createTable: vi.fn(),
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
    expect(session.describeTable).toHaveBeenCalledTimes(1);
    expect(session.createTable).not.toHaveBeenCalled();
    expect(session.api.executeSchemeQuery).not.toHaveBeenCalled();
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

  it("throws when embedding_quantized column is missing", async () => {
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
      api: {
        executeSchemeQuery: vi.fn().mockResolvedValue(undefined),
      },
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      return await fn(session);
    });

    await expect(ensureGlobalPointsTable()).rejects.toThrow(
      `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_quantized; please recreate the table or apply a manual schema migration before starting the service`
    );

    expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
    expect(session.createTable).not.toHaveBeenCalled();
  });
});
