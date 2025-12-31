import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  destroyDriver,
  refreshDriver,
  withSession,
  __setDriverForTests,
  __setDriverFactoryForTests,
  __resetRefreshStateForTests,
} from "../../src/ydb/client.js";

// Mocks for driver methods
const destroyMock = vi.fn();
const readyMock = vi.fn();
const withSessionMock = vi.fn();

function createMockDriver() {
  return {
    destroy: destroyMock,
    ready: readyMock,
    tableClient: {
      withSession: withSessionMock,
    },
  };
}

describe("ydb/client: destroyDriver, refreshDriver, and session error handling", () => {
  beforeEach(() => {
    // Reset all mocks
    destroyMock.mockReset();
    readyMock.mockReset();
    withSessionMock.mockReset();

    // Default ready() to resolve successfully
    readyMock.mockResolvedValue(true);

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

    it("calls destroy on the current driver and clears it", async () => {
      destroyMock.mockResolvedValueOnce(undefined);
      __setDriverForTests(createMockDriver());

      await destroyDriver();
      expect(destroyMock).toHaveBeenCalledTimes(1);

      // second call should see no driver and not call destroy again
      destroyMock.mockClear();
      await destroyDriver();
      expect(destroyMock).not.toHaveBeenCalled();
    });

    it("swallows errors thrown by driver.destroy()", async () => {
      destroyMock.mockRejectedValueOnce(new Error("boom"));
      __setDriverForTests(createMockDriver());

      await expect(destroyDriver()).resolves.toBeUndefined();

      // driver should still be cleared even if destroy failed
      destroyMock.mockClear();
      await destroyDriver();
      expect(destroyMock).not.toHaveBeenCalled();
    });
  });

  describe("refreshDriver", () => {
    it("destroys existing driver and then waits for ready()", async () => {
      destroyMock.mockResolvedValueOnce(undefined);
      __setDriverForTests(createMockDriver());

      // Set up factory to return a new mock driver when getOrCreateDriver is called
      __setDriverFactoryForTests(() => createMockDriver());

      await expect(refreshDriver()).resolves.toBeUndefined();

      // destroy was called once for the existing driver
      expect(destroyMock).toHaveBeenCalledTimes(1);
      // ready() was called once on the new Driver instance created by readyOrThrow
      expect(readyMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe("withSession error handling", () => {
    it("triggers a driver refresh on session pool exhaustion error", async () => {
      // Set up initial driver
      __setDriverForTests(createMockDriver());

      // Factory returns a fresh mock when refresh creates a new driver
      __setDriverFactoryForTests(() => createMockDriver());

      // Make withSession throw a session-related error
      withSessionMock.mockImplementationOnce(() => {
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

      // destroy and ready should have been called (refresh triggered)
      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("does not refresh driver for non-session-related errors", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      withSessionMock.mockImplementationOnce(() => {
        throw new Error("Some other error");
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 7;
        })
      ).rejects.toThrow(/Some other error/);

      expect(destroyMock).not.toHaveBeenCalled();
      expect(readyMock).not.toHaveBeenCalled();
    });

    it("refreshes driver only once within cooldown window", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      // All withSession calls will throw session-related errors
      withSessionMock.mockImplementation(() => {
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
      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("continues to rethrow original error even if refreshDriver fails", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      // ready() will reject when refresh tries to create new driver
      readyMock.mockRejectedValueOnce(new Error("ready failed"));

      withSessionMock.mockImplementationOnce(() => {
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
      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("triggers refresh for SESSION_POOL_EMPTY error", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());

      withSessionMock.mockImplementationOnce(() => {
        throw new Error("SESSION_POOL_EMPTY: no sessions available");
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 99;
        })
      ).rejects.toThrow(/SESSION_POOL_EMPTY/);

      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });

    it("triggers refresh for SessionExpired error", async () => {
      __setDriverForTests(createMockDriver());
      __setDriverFactoryForTests(() => createMockDriver());
      __resetRefreshStateForTests(); // reset cooldown

      withSessionMock.mockImplementationOnce(() => {
        throw new Error("SessionExpired: session has expired");
      });

      await expect(
        withSession(async () => {
          await Promise.resolve();
          return 100;
        })
      ).rejects.toThrow(/SessionExpired/);

      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(readyMock).toHaveBeenCalledTimes(1);
    });
  });
});
