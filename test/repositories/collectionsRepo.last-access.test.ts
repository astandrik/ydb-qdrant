import { describe, it, expect, vi, type Mock } from "vitest";
import { createSqlHarness } from "../helpers/ydbjsQueryMock.js";

vi.mock("@ydbjs/value/primitive", async () => {
  const actual = await vi.importActual<
    typeof import("@ydbjs/value/primitive")
  >("@ydbjs/value/primitive");

  // We only need to verify that Timestamp is constructed with the provided Date.
  // Use a constructor-friendly spy.
  const Timestamp = vi.fn(function Timestamp(this: unknown, _d: Date) {
    void _d;
  });

  return {
    ...actual,
    Timestamp,
  };
});

vi.mock("../../src/ydb/client.js", () => {
  return {
    withSession: vi.fn(),
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
import { Timestamp } from "@ydbjs/value/primitive";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("collectionsRepo/touchCollectionLastAccess (with mocked YDB)", () => {
  it("throttles last_access updates per collection and interval", async () => {
    const h = createSqlHarness();
    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const metaKey = "tenant_a/my_collection_throttle";
    const now = new Date(0);

    await touchCollectionLastAccess(metaKey, now);
    expect(h.calls).toHaveLength(1);

    // Second call within the same interval should be skipped.
    await touchCollectionLastAccess(metaKey, now);
    expect(h.calls).toHaveLength(1);

    // After the configured interval passes, a new write should occur.
    const intervalMs = envConfig.LAST_ACCESS_MIN_WRITE_INTERVAL_MS;
    const later = new Date(now.getTime() + intervalMs + 1);

    await touchCollectionLastAccess(metaKey, later);
    expect(h.calls).toHaveLength(2);
  });

  it("uses the provided now parameter when building the timestamp", async () => {
    const h = createSqlHarness();
    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const customNow = new Date(123456);

    await touchCollectionLastAccess(
      "tenant_a/my_collection_custom_now",
      customNow
    );

    expect((Timestamp as unknown as Mock)).toHaveBeenCalledWith(customNow);
  });

  it("logs and swallows YDB errors during last_access update", async () => {
    const h = createSqlHarness();
    h.plan([{ error: new Error("YDB failure") }]);
    withSessionMock.mockImplementation(
      async (fn: (sql: unknown, signal: AbortSignal) => unknown) =>
        await fn(h.sql, new AbortController().signal)
    );

    const warnMock = logger.warn as unknown as Mock;
    const metaKey = "tenant_a/my_collection_error";

    await expect(
      touchCollectionLastAccess(metaKey, new Date(0))
    ).resolves.toBeUndefined();

    expect(h.calls).toHaveLength(1);
    expect(warnMock).toHaveBeenCalledTimes(1);
    expect(warnMock).toHaveBeenCalledWith(
      expect.objectContaining({ collection: metaKey }),
      expect.stringContaining("touchCollectionLastAccess")
    );
  });
});
