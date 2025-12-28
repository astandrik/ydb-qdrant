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
    const createSessionMock = vi.fn((): Promise<CreateSessionResponse> => {
      seq += 1;
      return Promise.resolve({
        status: StatusIds_StatusCode.SUCCESS,
        nodeId: 1n,
        sessionId: `s${seq}`,
      });
    });
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
    const createSessionMock = vi.fn((): Promise<CreateSessionResponse> => {
      seq += 1;
      return Promise.resolve({
        status: StatusIds_StatusCode.SUCCESS,
        nodeId: 1n,
        sessionId: `s${seq}`,
      });
    });
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

  it("rejects pending acquire() waiters on close()", async () => {
    process.env.YDB_SESSION_POOL_MIN_SIZE = "0";
    process.env.YDB_SESSION_POOL_MAX_SIZE = "1";
    process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "60000";

    const { SessionPool } = await import("../../src/ydb/SessionPool.js");

    let seq = 0;
    const createSessionMock = vi.fn((): Promise<CreateSessionResponse> => {
      seq += 1;
      return Promise.resolve({
        status: StatusIds_StatusCode.SUCCESS,
        nodeId: 1n,
        sessionId: `s${seq}`,
      });
    });
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

    // Exhaust pool capacity by acquiring and holding the only session.
    const s1 = await pool.acquire(new AbortController().signal);

    // Start a second acquire which will wait.
    const pending = pool.acquire(new AbortController().signal);

    // Closing the pool should reject the pending acquire instead of hanging.
    await pool.close();
    await expect(pending).rejects.toThrow(/SessionPool is closed/i);

    // Cleanup: releasing after close should delete session best-effort.
    pool.release(s1);
    expect(deleteSessionMock).toHaveBeenCalledTimes(1);
  });

  it("keepaliveTick does not delete a session that became in-use while the probe is in-flight", async () => {
    process.env.YDB_SESSION_POOL_MIN_SIZE = "0";
    process.env.YDB_SESSION_POOL_MAX_SIZE = "2";
    process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "1000";

    const { SessionPool } = await import("../../src/ydb/SessionPool.js");

    let seq = 0;
    const createSessionMock = vi.fn((): Promise<CreateSessionResponse> => {
      seq += 1;
      return Promise.resolve({
        status: StatusIds_StatusCode.SUCCESS,
        nodeId: 1n,
        sessionId: `s${seq}`,
      });
    });

    let keepaliveProbeArmed = false;
    let nextCalledResolve: (() => void) | undefined;
    const nextCalled = new Promise<void>((resolve) => {
      nextCalledResolve = resolve;
    });
    let resolveProbeNext:
      | ((value: { value: { status: StatusIds_StatusCode } }) => void)
      | undefined;
    const probeNext = new Promise<{ value: { status: StatusIds_StatusCode } }>(
      (resolve) => {
        resolveProbeNext = resolve;
      }
    );

    const attachSessionMock = vi.fn((req: { sessionId: string }) => {
      if (keepaliveProbeArmed && req.sessionId === "s2") {
        return {
          [Symbol.asyncIterator]() {
            return {
              next: () => {
                nextCalledResolve?.();
                return probeNext;
              },
            };
          },
        };
      }
      return okAttachIterable();
    });

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

    // Create two sessions and return them to the pool.
    const a = await pool.acquire(new AbortController().signal); // s1
    const b = await pool.acquire(new AbortController().signal); // s2
    pool.release(a);
    pool.release(b);

    // Make keepalive pick the second session (s2) by making its lastCheckedAtMs older.
    const internals = pool as unknown as {
      available: Array<{ sessionId: string; lastCheckedAtMs: number }>;
      keepaliveTick: () => Promise<void>;
      inUse: Set<string>;
    };
    expect(internals.available).toHaveLength(2);
    const avail0 = internals.available[0];
    const avail1 = internals.available[1];
    if (!avail0 || !avail1) {
      throw new Error("expected two available sessions");
    }
    avail0.lastCheckedAtMs = Date.now();
    avail1.lastCheckedAtMs = 0;

    keepaliveProbeArmed = true;
    const tickPromise = internals.keepaliveTick();

    // Wait until the keepalive probe is awaiting attach.next().
    await nextCalled;

    // Concurrently acquire the same session keepalive is probing (pop() returns the last element = s2).
    const acquired = await pool.acquire(new AbortController().signal);
    expect(acquired.sessionId).toBe("s2");
    expect(internals.inUse.has("s2")).toBe(true);

    // Probe now "fails" (non-success status). Old code would attempt to delete this session.
    resolveProbeNext?.({
      value: { status: StatusIds_StatusCode.GENERIC_ERROR },
    });
    await tickPromise;

    // The fixed code must not delete a session that is currently in-use.
    expect(deleteSessionMock).toHaveBeenCalledTimes(0);

    // Cleanup.
    pool.release(acquired);
    await pool.close();
  });
});
