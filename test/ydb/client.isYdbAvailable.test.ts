import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isYdbAvailable, __setDriverForTests } from "../../src/ydb/client.js";

const readyMock = vi.fn<(timeoutMs: number) => Promise<boolean>>();

describe("ydb/client:isYdbAvailable", () => {
  beforeEach(() => {
    readyMock.mockReset();
    __setDriverForTests({ ready: readyMock });
  });

  afterEach(() => {
    __setDriverForTests(undefined);
  });

  it("returns true when driver.ready resolves true", async () => {
    readyMock.mockResolvedValueOnce(true);
    await expect(isYdbAvailable()).resolves.toBe(true);
  });

  it("returns false when driver.ready resolves false", async () => {
    readyMock.mockResolvedValueOnce(false);
    await expect(isYdbAvailable()).resolves.toBe(false);
  });

  it("returns false when driver.ready throws", async () => {
    readyMock.mockRejectedValueOnce(new Error("boom"));
    await expect(isYdbAvailable()).resolves.toBe(false);
  });
});
