import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createdPools: [] as FakePiscina[],
    loggerError: vi.fn<(arg0?: unknown, arg1?: unknown) => void>(),
}));

class FakePiscina extends EventEmitter {
    options: unknown;
    run = vi.fn(() => Promise.resolve([]));

    constructor(options: unknown) {
        super();
        this.options = options;
        mocks.createdPools.push(this);
    }
}

vi.mock("piscina", () => ({
    Piscina: FakePiscina,
}));

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        error: mocks.loggerError,
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

describe("ComputePool", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        mocks.createdPools.length = 0;
    });

    it("attaches an error listener that logs idle worker failures", async () => {
        const pool = await import("../../src/compute/ComputePool.js");

        await pool.runPrepareUpsertBatch({
            collection: "col",
            apiKey: "test-api-key",
            batch: [],
        });

        expect(mocks.createdPools).toHaveLength(1);
        const createdPool = mocks.createdPools[0];
        expect(createdPool.listenerCount("error")).toBe(1);

        const err = new Error("worker boom");
        expect(() => createdPool.emit("error", err)).not.toThrow();
        expect(mocks.loggerError).toHaveBeenCalledWith(
            { err },
            "Compute worker pool emitted an error"
        );
    });
});
