import { describe, it, expect, vi, type Mock } from "vitest";

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

  return {
    ...actual,
    LOG_LEVEL: "info",
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

import { touchCollectionLastAccess } from "../../src/repositories/collectionsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import * as envConfig from "../../src/config/env.js";
import { logger } from "../../src/logging/logger.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("collectionsRepo/touchCollectionLastAccess (with mocked YDB)", () => {
  it("throttles last_access updates per collection and interval", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockResolvedValue({}),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const metaKey = "tenant_a/my_collection_throttle";
    const now = new Date(0);

    await touchCollectionLastAccess(metaKey, now);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);

    // Second call within the same interval should be skipped.
    await touchCollectionLastAccess(metaKey, now);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);

    // After the configured interval passes, a new write should occur.
    const intervalMs = envConfig.LAST_ACCESS_MIN_WRITE_INTERVAL_MS;
    const later = new Date(now.getTime() + intervalMs + 1);

    await touchCollectionLastAccess(metaKey, later);
    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(2);
  });

  it("uses the provided now parameter when building the timestamp", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockResolvedValue({}),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const customNow = new Date(123456);

    await touchCollectionLastAccess(
      "tenant_a/my_collection_custom_now",
      customNow
    );

    const timestampMock = (ydbClient.TypedValues as { timestamp: unknown })
      .timestamp as Mock;
    expect(timestampMock).toHaveBeenCalledWith(customNow);
  });

  it("logs and swallows YDB errors during last_access update", async () => {
    const sessionMock = {
      executeQuery: vi.fn().mockRejectedValue(new Error("YDB failure")),
    };

    withSessionMock.mockImplementation(async (fn: (s: unknown) => unknown) => {
      await fn(sessionMock);
    });

    const warnMock = logger.warn as unknown as Mock;
    const metaKey = "tenant_a/my_collection_error";

    await expect(
      touchCollectionLastAccess(metaKey, new Date(0))
    ).resolves.toBeUndefined();

    expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
    expect(warnMock).toHaveBeenCalledTimes(1);
    expect(warnMock).toHaveBeenCalledWith(
      expect.objectContaining({ collection: metaKey }),
      expect.stringContaining("touchCollectionLastAccess")
    );
  });
});
