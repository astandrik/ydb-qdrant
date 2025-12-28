import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StatusIds_StatusCode } from "@ydbjs/api/operation";

type CreateSessionResponse = {
  status: StatusIds_StatusCode;
  nodeId: bigint;
  sessionId: string;
  issues?: unknown;
};

function okAttachIterable() {
  return {
    [Symbol.asyncIterator]() {
      return {
        next: () =>
          Promise.resolve({
            value: { status: StatusIds_StatusCode.SUCCESS },
          }),
      };
    },
  };
}

describe("ydb/SessionPool", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envSnapshot };
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("reuses a released session", async () => {
    process.env.YDB_SESSION_POOL_MIN_SIZE = "0";
    process.env.YDB_SESSION_POOL_MAX_SIZE = "2";
    process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "60000";

    const { SessionPool } = await import("../../src/ydb/SessionPool.js");

    let seq = 0;
    const createSessionMock = vi.fn(
      (): Promise<CreateSessionResponse> => {
        seq += 1;
        return Promise.resolve({
          status: StatusIds_StatusCode.SUCCESS,
          nodeId: 1n,
          sessionId: `s${seq}`,
        });
      }
    );
    const attachSessionMock = vi.fn(() => okAttachIterable());
    const deleteSessionMock = vi.fn(() => Promise.resolve());

    const driver = {
      ready: vi.fn(async () => {}),
      createClient: vi.fn(() => ({
        createSession: createSessionMock,
        attachSession: attachSessionMock,
        deleteSession: deleteSessionMock,
      })),
    };

    const pool = new SessionPool(driver as never);
    const s1 = await pool.acquire(new AbortController().signal);
    pool.release(s1);
    const s2 = await pool.acquire(new AbortController().signal);

    expect(s2.sessionId).toBe(s1.sessionId);
    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(attachSessionMock).toHaveBeenCalledTimes(1);
  });

  it("discard deletes a bad session and creates a new one", async () => {
    process.env.YDB_SESSION_POOL_MIN_SIZE = "0";
    process.env.YDB_SESSION_POOL_MAX_SIZE = "2";
    process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "60000";

    const { SessionPool } = await import("../../src/ydb/SessionPool.js");

    let seq = 0;
    const createSessionMock = vi.fn(
      (): Promise<CreateSessionResponse> => {
        seq += 1;
        return Promise.resolve({
          status: StatusIds_StatusCode.SUCCESS,
          nodeId: 1n,
          sessionId: `s${seq}`,
        });
      }
    );
    const attachSessionMock = vi.fn(() => okAttachIterable());
    const deleteSessionMock = vi.fn(() => Promise.resolve());

    const driver = {
      ready: vi.fn(async () => {}),
      createClient: vi.fn(() => ({
        createSession: createSessionMock,
        attachSession: attachSessionMock,
        deleteSession: deleteSessionMock,
      })),
    };

    const pool = new SessionPool(driver as never);
    const s1 = await pool.acquire(new AbortController().signal);
    await pool.discard(s1);

    const s2 = await pool.acquire(new AbortController().signal);
    expect(s2.sessionId).not.toBe(s1.sessionId);
    expect(deleteSessionMock).toHaveBeenCalledTimes(1);
  });
});
