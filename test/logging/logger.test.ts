import { beforeEach, describe, expect, it, vi } from "vitest";

const pinoMock = vi.hoisted(() => {
    const factory = vi.fn((options?: unknown, destination?: unknown) => {
        void options;
        void destination;
        return {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            fatal: vi.fn(),
        };
    });

    const stdSerializers = {
        err: vi.fn(),
    };

    return { factory, stdSerializers };
});

vi.mock("pino", () => ({
    default: Object.assign(pinoMock.factory, {
        stdSerializers: pinoMock.stdSerializers,
    }),
}));

describe("logging/logger", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("configures pino with deploy formatter and request-context mixin", async () => {
        await import("../../src/logging/logger.js");
        const { runWithRequestContext } = await import(
            "../../src/logging/requestContext.js"
        );

        expect(pinoMock.factory).toHaveBeenCalledTimes(1);

        const factoryCalls = pinoMock.factory.mock.calls as unknown as Array<
            [unknown, unknown]
        >;
        const firstCall = factoryCalls[0];
        if (!firstCall) {
            throw new Error("pino factory call is missing");
        }
        const [options, destination] = firstCall;
        expect(destination).toBeDefined();
        const typedOptions = options as {
            level?: unknown;
            mixin?: () => Record<string, unknown>;
            serializers?: {
                err?: unknown;
            };
        };
        expect(typeof typedOptions.level).toBe("string");
        expect(typedOptions.serializers?.err).toBe(pinoMock.stdSerializers.err);

        const mixin = typedOptions.mixin;
        expect(typeof mixin).toBe("function");
        if (!mixin) {
            throw new Error("logger mixin is missing");
        }

        const outsideContext = mixin();
        expect(outsideContext).toEqual({});

        const insideContext = runWithRequestContext(
            {
                requestId: "req-123",
                method: "POST",
                url: "/collections/demo/points/search",
                requestStartNs: process.hrtime.bigint(),
            },
            () => mixin()
        );

        expect(insideContext).toEqual({
            requestId: "req-123",
            method: "POST",
            url: "/collections/demo/points/search",
        });
    });
});
