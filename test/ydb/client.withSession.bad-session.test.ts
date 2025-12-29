import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ydb/client:withSession bad session retry handling", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envSnapshot };
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("discards the leased session (not release) on the final BAD_SESSION attempt", async () => {
    const { withSession, __setDriverForTests, __setSessionPoolForTests } =
      await import("../../src/ydb/client.js");

    // Minimal driver: withSession only needs ready() here because our callback throws before running any query.
    __setDriverForTests({
      ready: vi.fn(() => Promise.resolve()),
      createClient: vi.fn(() => ({})),
    });

    let seq = 0;
    const acquireMock = vi.fn(() => {
      seq += 1;
      return Promise.resolve({ nodeId: 1n, sessionId: `s${seq}` });
    });
    const releaseMock = vi.fn();
    const discardMock = vi.fn(() => Promise.resolve());

    __setSessionPoolForTests({
      acquire: acquireMock,
      release: releaseMock,
      discard: discardMock,
      warmup: vi.fn(() => Promise.resolve()),
      start: vi.fn(),
    });

    await expect(
      withSession(() => {
        throw new Error("BAD_SESSION: session is invalid");
      })
    ).rejects.toThrow(/BAD_SESSION/);

    // 3 attempts => 3 acquires, 3 discards, and no release (including on the final attempt).
    expect(acquireMock).toHaveBeenCalledTimes(3);
    expect(discardMock).toHaveBeenCalledTimes(3);
    expect(releaseMock).toHaveBeenCalledTimes(0);
  });

  it("releases the leased session when the error is not a session error", async () => {
    const { withSession, __setDriverForTests, __setSessionPoolForTests } =
      await import("../../src/ydb/client.js");

    __setDriverForTests({
      ready: vi.fn(() => Promise.resolve()),
      createClient: vi.fn(() => ({})),
    });

    const acquireMock = vi.fn(() =>
      Promise.resolve({ nodeId: 1n, sessionId: "s1" })
    );
    const releaseMock = vi.fn();
    const discardMock = vi.fn(() => Promise.resolve());

    __setSessionPoolForTests({
      acquire: acquireMock,
      release: releaseMock,
      discard: discardMock,
      warmup: vi.fn(() => Promise.resolve()),
      start: vi.fn(),
    });

    await expect(
      withSession(() => {
        throw new Error("Some query error");
      })
    ).rejects.toThrow(/Some query error/);

    expect(acquireMock).toHaveBeenCalledTimes(1);
    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(discardMock).toHaveBeenCalledTimes(0);
  });
});
