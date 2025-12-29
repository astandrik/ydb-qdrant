import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/ydb/client.js", () => {
  return {
    withSession: vi.fn(),
  };
});

import { withSession } from "../../src/ydb/client.js";
import { logger } from "../../src/logging/logger.js";

const withSessionMock = vi.mocked(withSession);
const loggerInfoMock = vi.mocked(logger.info);

type SqlTagMock = ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>> & {
  unsafe: (value: string) => string;
  identifier: (value: string) => string;
};

function createSqlTagMock(): SqlTagMock {
  const fn = vi.fn() as SqlTagMock;
  fn.unsafe = (value: string) => value;
  fn.identifier = (value: string) => value;
  return fn;
}

function renderYql(strings: unknown, values: unknown[]): string {
  if (Array.isArray(strings)) {
    let out = "";
    for (let i = 0; i < strings.length; i += 1) {
      out += String(strings[i]);
      if (i < values.length) {
        const v = values[i];
        // In these tests, interpolations are expected to be strings produced by sql.unsafe/sql.identifier.
        // Avoid Object default stringification to keep eslint @typescript-eslint/no-base-to-string happy.
        if (typeof v === "string") {
          out += v;
        } else if (typeof v === "number" || typeof v === "boolean") {
          out += String(v);
        } else {
          out += "";
        }
      }
    }
    return out;
  }
  if (typeof strings === "string") {
    return strings;
  }
  // Fallback: if template strings are not provided, just join values.
  return values.map((v) => (typeof v === "string" ? v : "")).join("");
}

type QueryStub = {
  idempotent: () => QueryStub;
  timeout: () => QueryStub;
  signal: () => QueryStub;
  parameter: () => QueryStub;
  then: (
    onFulfilled: (v: unknown) => unknown,
    onRejected?: (e: unknown) => unknown
  ) => unknown;
};

function createQueryStub(options?: {
  resolve?: unknown;
  reject?: unknown;
}): QueryStub {
  const stub: QueryStub = {
    idempotent: () => stub,
    timeout: () => stub,
    signal: () => stub,
    parameter: () => stub,
    then: (onFulfilled, onRejected) => {
      if (options?.reject !== undefined) {
        return onRejected ? onRejected(options.reject) : undefined;
      }
      return onFulfilled(options?.resolve ?? [[]]);
    },
  };
  return stub;
}

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

  it("is idempotent after first successful create/verify", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const calls: string[] = [];
    const sqlTag = createSqlTagMock();

    // First call: CREATE TABLE succeeds; column probe succeeds.
    // Second call: function is idempotent and should not execute again.
    sqlTag.mockImplementation((strings: unknown, ...values: unknown[]) => {
      const text = renderYql(strings, values);
      calls.push(text);
      return createQueryStub();
    });

    let withSessionCallCount = 0;
    withSessionMock.mockImplementation(async (fn) => {
      withSessionCallCount += 1;
      return await fn(sqlTag as never, new AbortController().signal);
    });

    await ensureGlobalPointsTable();
    const callsAfterFirst = calls.length;
    await ensureGlobalPointsTable();

    expect(withSessionMock).toHaveBeenCalledTimes(1);
    expect(withSessionCallCount).toBe(1);
    expect(calls).toHaveLength(callsAfterFirst);
    expect(calls.join("\n")).toContain(`CREATE TABLE ${GLOBAL_POINTS_TABLE}`);
  });

  it("creates table when it does not exist", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const sqlTag = createSqlTagMock();

    sqlTag.mockImplementation(() => {
      return createQueryStub();
    });

    withSessionMock.mockImplementation(async (fn) => {
      return await fn(sqlTag as never, new AbortController().signal);
    });

    await ensureGlobalPointsTable();

    expect(loggerInfoMock).toHaveBeenCalledWith(
      `created global points table ${GLOBAL_POINTS_TABLE}`
    );
  });

  it("throws when embedding_quantized column is missing", async () => {
    const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
      await resetSchemaModule();

    const sqlTag = createSqlTagMock();

    sqlTag.mockImplementation((strings: unknown, ...values: unknown[]) => {
      const text = renderYql(strings, values);
      const isProbe = /SELECT\s+embedding_quantized/i.test(text);
      if (isProbe) {
        return createQueryStub({
          reject: new Error("Unknown column: embedding_quantized"),
        });
      }
      return createQueryStub();
    });

    withSessionMock.mockImplementation(async (fn) => {
      return await fn(sqlTag as never, new AbortController().signal);
    });

    await expect(ensureGlobalPointsTable()).rejects.toThrow(
      `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_quantized; apply a manual migration (ALTER TABLE ${GLOBAL_POINTS_TABLE} ADD COLUMN embedding_quantized String). If your legacy schema used embedding_bit, rename it or recreate the table.`
    );
  });
});
