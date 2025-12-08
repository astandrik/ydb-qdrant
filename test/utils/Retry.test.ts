import { describe, it, expect, beforeEach, vi } from "vitest";

const loggerWarnMock = vi.fn();

vi.mock("../../src/logging/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: (...args: unknown[]) => {
      loggerWarnMock(...args);
    },
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("withRetry logging", () => {
  beforeEach(() => {
    vi.resetModules();
    loggerWarnMock.mockReset();
  });

  it("logs the underlying Error instance on transient failure", async () => {
    const { withRetry } = await import("../../src/utils/retry.js");

    const err = new Error("Aborted");
    let calls = 0;

    const fn = vi.fn().mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        throw err;
      }
      return Promise.resolve("ok");
    });

    const result = await withRetry(fn, {
      maxRetries: 2,
      baseDelayMs: 0,
      isTransient: () => true,
      context: { op: "test-op" },
    });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);

    const [payload, message] = loggerWarnMock.mock.calls[0] as [
      {
        op: string;
        attempt: number;
        backoffMs: number;
        err: unknown;
      },
      string
    ];

    expect(message).toBe("operation aborted due to transient error; retrying");
    expect(payload.op).toBe("test-op");
    expect(payload.attempt).toBe(0);
    expect(typeof payload.backoffMs).toBe("number");
    expect(payload.err).toBe(err);
  });

  it("wraps non-Error throw values into an Error for logging", async () => {
    const { withRetry } = await import("../../src/utils/retry.js");

    let calls = 0;

    const fn = vi.fn().mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- verify non-Error throw handling in withRetry
        throw "boom";
      }
      return Promise.resolve("ok");
    });

    const result = await withRetry(fn, {
      maxRetries: 2,
      baseDelayMs: 0,
      isTransient: () => true,
    });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);

    const [payload] = loggerWarnMock.mock.calls[0] as [
      { err: unknown; attempt: number; backoffMs: number },
      string
    ];

    expect(payload.err).toBeInstanceOf(Error);
    expect((payload.err as Error).message).toBe("boom");
    expect(payload.attempt).toBe(0);
    expect(typeof payload.backoffMs).toBe("number");
  });
});
