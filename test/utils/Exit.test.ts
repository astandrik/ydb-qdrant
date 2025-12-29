import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type SetImmediateWithCallback = (callback: () => void) => NodeJS.Immediate;

const globalWithSetImmediate = globalThis as typeof globalThis & {
  setImmediate: SetImmediateWithCallback;
};

describe("exit utility", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("schedules process.exit via setImmediate with default exitFn", async () => {
    let capturedCallback: (() => void) | undefined;

    const setImmediateSpy = vi
      .spyOn(globalWithSetImmediate, "setImmediate")
      .mockImplementation((fn: () => void) => {
        capturedCallback = fn;
        return {} as NodeJS.Immediate;
      });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      // no-op in tests
    }) as never);

    const exit = await import("../../src/utils/exit.js");

    exit.scheduleExit(2);

    expect(setImmediateSpy).toHaveBeenCalledTimes(1);
    expect(typeof capturedCallback).toBe("function");
    expect(exitSpy).not.toHaveBeenCalled();

    capturedCallback?.();

    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it("uses overridden exit function from __setExitFnForTests", async () => {
    let capturedCallback: (() => void) | undefined;

    const setImmediateSpy = vi
      .spyOn(globalWithSetImmediate, "setImmediate")
      .mockImplementation((fn: () => void) => {
        capturedCallback = fn;
        return {} as NodeJS.Immediate;
      });

    const customExit = vi.fn<(code: number) => void>();

    const exit = await import("../../src/utils/exit.js");
    exit.__setExitFnForTests(customExit);

    const processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      // no-op in tests
    }) as never);

    exit.scheduleExit(5);

    expect(setImmediateSpy).toHaveBeenCalledTimes(1);
    expect(typeof capturedCallback).toBe("function");
    expect(customExit).not.toHaveBeenCalled();

    capturedCallback?.();

    expect(customExit).toHaveBeenCalledTimes(1);
    expect(customExit).toHaveBeenCalledWith(5);
    expect(processExitSpy).not.toHaveBeenCalled();
  });
});
