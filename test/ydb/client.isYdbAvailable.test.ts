import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isYdbAvailable, __setDriverForTests } from "../../src/ydb/client.js";

const readyMock = vi.fn<(signal?: AbortSignal) => Promise<void>>();

describe("ydb/client:isYdbAvailable", () => {
  beforeEach(() => {
    readyMock.mockReset();
    __setDriverForTests({ ready: readyMock });
  });

  afterEach(() => {
    __setDriverForTests(undefined);
  });

  it("returns true when driver.ready resolves", async () => {
    readyMock.mockResolvedValueOnce(undefined);
    await expect(isYdbAvailable()).resolves.toBe(true);
  });

  it("returns false when driver.ready throws", async () => {
    readyMock.mockRejectedValueOnce(new Error("boom"));
    await expect(isYdbAvailable()).resolves.toBe(false);
  });
});
