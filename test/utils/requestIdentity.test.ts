import { describe, expect, it } from "vitest";
import type { Request } from "express";
import {
    getRequestApiKey,
    parseClientIpFromXForwardedFor,
    resolveRequestSigningKey,
    resolveRequestUserUid,
} from "../../src/utils/requestIdentity.js";

function createRequest(options?: {
    apiKey?: string;
    remoteAddress?: string;
    userAgent?: string;
    xForwardedFor?: string;
}): Request {
    return {
        header(name: string) {
            const normalized = name.toLowerCase();
            if (normalized === "api-key") {
                return options?.apiKey;
            }
            if (normalized === "user-agent") {
                return options?.userAgent;
            }
            if (normalized === "x-forwarded-for") {
                return options?.xForwardedFor;
            }
            return undefined;
        },
        socket: {
            remoteAddress: options?.remoteAddress ?? "198.51.100.10",
        },
    } as unknown as Request;
}

describe("utils/requestIdentity", () => {
    it("extracts and trims api-key", () => {
        expect(getRequestApiKey(createRequest({ apiKey: "  key  " }))).toBe("key");
        expect(getRequestApiKey(createRequest({ apiKey: "   " }))).toBeUndefined();
    });

    it("parses the first ip from x-forwarded-for", () => {
        expect(
            parseClientIpFromXForwardedFor("203.0.113.10, 198.51.100.1")
        ).toBe("203.0.113.10");
    });

    it("derives user uid from api-key when present", () => {
        const req = createRequest({ apiKey: "secret", userAgent: "UA/1.0" });
        expect(resolveRequestUserUid(req)).toMatch(/^ak_[0-9a-f]{16}$/);
    });

    it("falls back to anonymous ip+ua identity when api-key is absent", () => {
        const req = createRequest({
            remoteAddress: "203.0.113.7",
            userAgent: "Mozilla/5.0",
        });
        expect(resolveRequestUserUid(req)).toMatch(/^anon_[0-9a-f]{16}$/);
    });

    it("uses api-key as signing key when present and user uid otherwise", () => {
        const apiKeyReq = createRequest({ apiKey: "secret" });
        expect(resolveRequestSigningKey(apiKeyReq, "ignored")).toBe("secret");

        const noKeyReq = createRequest({ userAgent: "Mozilla/5.0" });
        expect(resolveRequestSigningKey(noKeyReq, "anon_uid")).toBe("anon_uid");
    });
});
