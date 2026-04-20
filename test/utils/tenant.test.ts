import { describe, expect, it } from "vitest";
import {
    deriveAnonymousUserUid,
    deriveUserUidFromApiKey,
    metaKeyFor,
    normalizeUserAgent,
    sanitizeCollectionName,
    sanitizeUserUid,
    uidFor,
} from "../../src/utils/tenant.js";

describe("utils/tenant/normalizeUserAgent", () => {
    it("normalizes user agents without adding a hash suffix", () => {
        expect(normalizeUserAgent(" Mozilla/5.0 Chrome/122.0 ")).toBe(
            "mozilla_5_0_chrome_122_0"
        );
    });

    it("returns undefined for empty or invalid user agents", () => {
        expect(normalizeUserAgent("")).toBeUndefined();
        expect(normalizeUserAgent("!!!")).toBeUndefined();
    });
});

describe("utils/tenant/sanitizeCollectionName", () => {
    it("normalizes collection names without user-agent suffixing", () => {
        expect(sanitizeCollectionName("My-Collection")).toBe("my_collection");
        expect(sanitizeCollectionName("", "ignored_ua")).toBe("collection");
    });
});

describe("utils/tenant/user uid helpers", () => {
    it("derives stable user ids from api keys", () => {
        const first = deriveUserUidFromApiKey("secret-key");
        const second = deriveUserUidFromApiKey("secret-key");
        const other = deriveUserUidFromApiKey("other-key");

        expect(first).toBe(second);
        expect(first).not.toBe(other);
        expect(first).toMatch(/^ak_[0-9a-f]{16}$/);
    });

    it("derives best-effort anonymous ids from ip and user agent", () => {
        const first = deriveAnonymousUserUid({
            clientIp: "203.0.113.7",
            userAgent: "Mozilla/5.0",
        });
        const second = deriveAnonymousUserUid({
            clientIp: "203.0.113.7",
            userAgent: "Mozilla/5.0",
        });
        const other = deriveAnonymousUserUid({
            clientIp: "203.0.113.8",
            userAgent: "Mozilla/5.0",
        });

        expect(first).toBe(second);
        expect(first).not.toBe(other);
        expect(first).toMatch(/^anon_[0-9a-f]{16}$/);
    });

    it("sanitizes explicit user ids", () => {
        expect(sanitizeUserUid("User-Name")).toBe("user_name");
        expect(sanitizeUserUid("!!!")).toBe("anonymous");
    });
});

describe("utils/tenant/meta helpers", () => {
    it("builds meta and uid keys from user id and collection", () => {
        expect(metaKeyFor("user_1", "demo")).toBe("user_1/demo");
        expect(uidFor("user_1", "demo")).toBe("user_1/demo");
    });
});
