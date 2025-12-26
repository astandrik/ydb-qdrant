import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  destroyDriver,
  refreshDriver,
  withSession,
  __setDriverForTests,
  __setDriverFactoryForTests,
  __resetRefreshStateForTests,
} from "../../src/ydb/client.js";

vi.mock("@ydbjs/query", () => {
  return {
    query: vi.fn(() => sqlClientMock),
  };
});

// Mocks for driver methods
const closeMock = vi.fn();
const readyMock = vi.fn();

const sqlClientMock = {
  do: vi.fn(async (fn: (signal: AbortSignal) => Promise<unknown>) => {
    return await fn(new AbortController().signal);
  }),
  [Symbol.asyncDispose]: vi.fn(async () => {}),
};

function createMockDriver() {
  return {
    ready: readyMock,
    close: closeMock,
  };
}

describe("ydb/client: destroyDriver, refreshDriver, and session error handling", () => {
  beforeEach(() => {
    // Reset all mocks
    closeMock.mockReset();
    readyMock.mockReset();
    sqlClientMock.do.mockClear();

    // Default ready() to resolve successfully
    readyMock.mockResolvedValue(undefined);

    // Clear internal state
    __setDriverForTests(undefined);
    __setDriverFactoryForTests(undefined);
    __resetRefreshStateForTests();
  });

  afterEach(() => {
    __setDriverForTests(undefined);
    __setDriverFactoryForTests(undefined);
    __resetRefreshStateForTests();
  });

  describe("destroyDriver", () => {
    it("is a no-op when driver is undefined", async () => {
      __setDriverForTests(undefined);
      await expect(destroyDriver()).resolves.toBeUndefined();
    });

    it("calls close on the current driver and clears it", async () => {
      __setDriverForTests(createMockDriver());

      await destroyDriver();
      expect(closeMock).toHaveBeenCalledTimes(1);

      // second call should see no driver and not call close again
      closeMock.mockClear();
      await destroyDriver();
      expect(closeMock).not.toHaveBeenCalled();
    });

    it("swallows errors thrown by driver.close()", async () => {
      closeMock.mockImplementationOnce(() => {
        throw new Error("boom");
      });
      __setDriverForTests(createMockDriver());

      await expect(destroyDriver()).resolves.toBeUndefined();

      // driver should still be cleared even if close failed
      closeMock.mockClear();
      await destroyDriver();
      expect(closeMock).not.toHaveBeenCalled();
    });
  });

  describe("refreshDriver", () => {
    it("destroys existing driver and then waits for ready()", async () => {
      __setDriverForTests(createMockDriver());

      // Set up factory to return a new mock driver when getOrCreateDriver is called
      __setDriverFactoryForTests(() => createMockDriver());

      await expect(refreshDriver()).resolves.toBeUndefined();

      // close was called once for the existing driver
      expect(closeMock).toHaveBeenCalledTimes(1);
      // ready() was called once on the new Driver instance created by readyOrThrow
      expect(readyMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("withSession error handling", () => {
    it("triggers a driver refresh on session pool exhaustion error", async () => {
      // Set up initial driver
      __setDriverForTests(createMockDriver());

      // Factory returns a fresh mock when refresh creates a new driver
      __setDriverFactoryForTests(() => createMockDriver());

      // Make QueryClient.do throw a session-related error
      sqlClientMock.do.mockImplementationOnce(() => {
        throw new Error(
          "No session became available within timeout of 15000 ms"
        );
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 42;
        })
      ).rejects.toThrow(/No session became available within timeout/);

      // refresh is async (fire-and-forget); allow microtasks to run
      await Promise.resolve();
      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("does not refresh driver for non-session-related errors", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      sqlClientMock.do.mockImplementationOnce(() => {
        throw new Error("Some other error");
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 7;
        })
      ).rejects.toThrow(/Some other error/);

      await Promise.resolve();
      expect(closeMock).not.toHaveBeenCalled();
      expect(readyMock).not.toHaveBeenCalled();
    });

    it("refreshes driver only once within cooldown window", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      // All withSession calls will throw session-related errors
      sqlClientMock.do.mockImplementation(() => {
        throw new Error(
          "No session became available within timeout of 15000 ms"
        );
      });

      // First call triggers refresh
      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 1;
        })
      ).rejects.toThrow();

      // Second call should NOT trigger another refresh due to cooldown
      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 2;
        })
      ).rejects.toThrow();

      // Only one refresh should have occurred
      await Promise.resolve();
      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("continues to rethrow original error even if refreshDriver fails", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      // ready() will reject when refresh tries to create new driver
      readyMock.mockRejectedValueOnce(new Error("ready failed"));

      sqlClientMock.do.mockImplementationOnce(() => {
        throw new Error(
          "No session became available within timeout of 15000 ms"
        );
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 3;
        })
      ).rejects.toThrow(/No session became available within timeout/);

      // refresh was attempted (destroy + ready called)
      await Promise.resolve();
      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("triggers refresh for SESSION_POOL_EMPTY error", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      sqlClientMock.do.mockImplementationOnce(() => {
        throw new Error("SESSION_POOL_EMPTY: no sessions available");
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 99;
        })
      ).rejects.toThrow(/SESSION_POOL_EMPTY/);

      await Promise.resolve();
      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("triggers refresh for SessionExpired error", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());
      __resetRefreshStateForTests(); // reset cooldown

      sqlClientMock.do.mockImplementationOnce(() => {
        throw new Error("SessionExpired: session has expired");
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 100;
        })
      ).rejects.toThrow(/SessionExpired/);

      await Promise.resolve();
      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });
  });
});
