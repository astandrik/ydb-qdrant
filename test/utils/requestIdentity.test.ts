import { describe, expect, it } from "vitest";
import type { Request } from "express";
import {
    getRequestApiKey,
    getRequestClientIp,
    resolveRequestNamespaceUserUid,
    resolveRequestSigningKey,
    resolveRequestUserUid,
} from "../../src/utils/requestIdentity.js";

function createRequest(options?: {
    apiKey?: string;
    ip?: string;
    remoteAddress?: string;
    tenantId?: string;
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
            if (normalized === "x-tenant-id") {
                return options?.tenantId;
            }
            return undefined;
        },
        ip: options?.ip,
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

    it("prefers req.ip over socket.remoteAddress", () => {
        expect(
            getRequestClientIp(
                createRequest({
                    ip: "203.0.113.10",
                    remoteAddress: "198.51.100.1",
                    xForwardedFor: "192.0.2.1, 198.51.100.2",
                })
            )
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
            xForwardedFor: "198.51.100.10",
        });
        expect(resolveRequestUserUid(req)).toMatch(/^anon_[0-9a-f]{16}$/);
    });

    it("builds the same namespace uid for missing tenant and tenant=default", () => {
        const baseOptions = {
            apiKey: "secret",
            userAgent: "Mozilla/5.0",
        };

        const withoutTenant = resolveRequestNamespaceUserUid(
            createRequest(baseOptions)
        );
        const withDefaultTenant = resolveRequestNamespaceUserUid(
            createRequest({ ...baseOptions, tenantId: "default" })
        );

        expect(withoutTenant).toBe(withDefaultTenant);
    });

    it("separates namespace uids for different tenant headers", () => {
        const baseOptions = {
            apiKey: "secret",
            userAgent: "Mozilla/5.0",
        };

        const tenantA = resolveRequestNamespaceUserUid(
            createRequest({ ...baseOptions, tenantId: "tenant_a" })
        );
        const tenantB = resolveRequestNamespaceUserUid(
            createRequest({ ...baseOptions, tenantId: "tenant_b" })
        );

        expect(tenantA).not.toBe(tenantB);
    });

    it("uses api-key as signing key when present and user uid otherwise", () => {
        const apiKeyReq = createRequest({ apiKey: "secret" });
        expect(resolveRequestSigningKey(apiKeyReq, "ignored")).toBe("secret");

        const noKeyReq = createRequest({
            tenantId: "tenant_a",
            userAgent: "Mozilla/5.0",
        });
        const namespaceUid = resolveRequestNamespaceUserUid(noKeyReq);
        expect(resolveRequestSigningKey(noKeyReq, namespaceUid)).toBe(
            namespaceUid
        );
    });
});
