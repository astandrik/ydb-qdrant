import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ydb/client:withSession timeout scope", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    process.env = { ...envSnapshot };
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...envSnapshot };
  });

  it("does not abort the user callback when it exceeds WITH_SESSION_TIMEOUT_MS", async () => {
    const { withSession, __setDriverForTests, __setSessionPoolForTests } =
      await import("../../src/ydb/client.js");

    __setDriverForTests({
      ready: vi.fn(() => Promise.resolve()),
      createClient: vi.fn(() => ({})),
    });

    __setSessionPoolForTests({
      acquire: vi.fn(() => Promise.resolve({ nodeId: 1n, sessionId: "s1" })),
      release: vi.fn(),
      discard: vi.fn(() => Promise.resolve()),
      warmup: vi.fn(() => Promise.resolve()),
      start: vi.fn(),
    });

    // Ensure the callback has started and scheduled its timer before we advance fake time.
    let timerScheduledResolve: (() => void) | null = null;
    const timerScheduled = new Promise<void>((resolve) => {
      timerScheduledResolve = resolve;
    });

    const p = withSession(() => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve("ok"), 25_000);
        timerScheduledResolve?.();
      });
    });

    await timerScheduled;
    await vi.advanceTimersByTimeAsync(25_000);
    await expect(p).resolves.toBe("ok");
  });
});
