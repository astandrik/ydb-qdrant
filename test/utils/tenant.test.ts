import { describe, it, expect } from "vitest";
import {
  hashApiKey,
  normalizeUserAgent,
  sanitizeCollectionName,
  sanitizeTenantId,
  tableNameFor,
  metaKeyFor,
  uidFor,
} from "../../src/utils/tenant.js";

describe("utils/tenant/hashApiKey", () => {
  it("returns undefined when apiKey is undefined", () => {
    expect(hashApiKey(undefined)).toBeUndefined();
  });

  it("returns undefined for empty or whitespace-only apiKey", () => {
    expect(hashApiKey("")).toBeUndefined();
    expect(hashApiKey("   ")).toBeUndefined();
  });

  it("returns an 8-char hex hash for a non-empty apiKey", () => {
    const hash = hashApiKey("my-api-key");
    expect(hash).toBeDefined();
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic for the same apiKey and differs for different keys", () => {
    const h1 = hashApiKey("key-1");
    const h2 = hashApiKey("key-1");
    const h3 = hashApiKey("key-2");

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });
});

describe("utils/tenant/normalizeUserAgent", () => {
  it("returns undefined when userAgent is undefined", () => {
    expect(normalizeUserAgent(undefined)).toBeUndefined();
  });

  it("returns undefined for empty or whitespace-only userAgent", () => {
    expect(normalizeUserAgent("")).toBeUndefined();
    expect(normalizeUserAgent("   ")).toBeUndefined();
  });

  it("normalizes userAgent with trimming, sanitization, and lowercasing", () => {
    const normalized = normalizeUserAgent("   FIREfox/121.0  ");
    expect(normalized).toMatch(/^firefox_121_0_[0-9a-f]{8}$/);
  });

  it("handles realistic browser user agents", () => {
    const chrome = normalizeUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.129 Safari/537.36"
    );
    expect(chrome).toBeDefined();
    expect(chrome?.length).toBeLessThanOrEqual(41);
    expect(chrome).toMatch(/_[0-9a-f]{8}$/);
  });

  it("removes consecutive underscores", () => {
    const normalized = normalizeUserAgent("Chrome//120.0");
    expect(normalized).toMatch(/^chrome_120_0_[0-9a-f]{8}$/);
  });

  it("strips leading underscores after sanitization", () => {
    const normalized = normalizeUserAgent("/Chrome");
    expect(normalized).toMatch(/^chrome_[0-9a-f]{8}$/);
  });

  it("removes trailing underscores after normalization", () => {
    const normalized = normalizeUserAgent("test/");
    expect(normalized).toMatch(/^test_[0-9a-f]{8}$/);
  });

  it("does not leave trailing underscore after sanitization", () => {
    const normalized = normalizeUserAgent("Chrome/");
    expect(normalized).toMatch(/^chrome_[0-9a-f]{8}$/);
  });

  it("drops leading and trailing underscores, keeping interior separators", () => {
    const normalized = normalizeUserAgent("__Test///__Agent__");
    expect(normalized).toMatch(/^test_agent_[0-9a-f]{8}$/);
  });

  it("returns undefined when normalization strips everything", () => {
    expect(normalizeUserAgent("!!!")).toBeUndefined();
  });

  it("applies length cap for very long normalized user agents", () => {
    const longAgent = "A".repeat(100);
    const normalized = normalizeUserAgent(longAgent);

    expect(normalized).toBeDefined();
    expect(normalized!.length).toBeGreaterThan(32);
    expect(normalized!.length).toBeLessThanOrEqual(41);
    expect(normalized).toMatch(/^a{32}_[0-9a-f]{8}$/);
  });

  it("does not end with underscore after truncation at max length", () => {
    const ua = "a b c d e f g h i j k l m n o p q";
    const normalized = normalizeUserAgent(ua);

    expect(normalized).toBeDefined();
    expect(normalized!.length).toBeLessThanOrEqual(41);
    expect(normalized!.endsWith("_")).toBe(false);
    expect(normalized).toMatch(/_[0-9a-f]{8}$/);
  });
});

describe("utils/tenant/sanitizeCollectionName", () => {
  it("normalizes collection name without hash", () => {
    expect(sanitizeCollectionName("My-Collection")).toBe("my_collection");
  });

  it("appends apiKeyHash suffix when provided", () => {
    expect(sanitizeCollectionName("My-Collection", "a1b2c3d4")).toBe(
      "my_collection_a1b2c3d4"
    );
  });

  it("appends normalized userAgent suffix when provided", () => {
    const name = sanitizeCollectionName(
      "My-Collection",
      undefined,
      "firefox_121_0_deadbeef"
    );
    expect(name).toBe("my_collection_firefox_121_0_deadbeef");
  });

  it("appends both apiKeyHash and normalized userAgent when both provided", () => {
    const name = sanitizeCollectionName(
      "My-Collection",
      "a1b2c3d4",
      "firefox_121_0_deadbeef"
    );
    expect(name).toBe("my_collection_a1b2c3d4_firefox_121_0_deadbeef");
  });

  it("falls back to 'collection' when name is empty", () => {
    expect(sanitizeCollectionName("")).toBe("collection");
  });

  it("falls back to 'collection' with suffixes when name is empty but suffixes provided", () => {
    const name = sanitizeCollectionName(
      "",
      "a1b2c3d4",
      "firefox_121_0_deadbeef"
    );
    expect(name).toBe("collection_a1b2c3d4_firefox_121_0_deadbeef");
  });
});

describe("utils/tenant/sanitizeTenantId", () => {
  it("normalizes tenant id and replaces invalid chars with underscore", () => {
    expect(sanitizeTenantId("Tenant-Id")).toBe("tenant_id");
  });

  it("falls back to 'default' when tenantId is undefined", () => {
    expect(sanitizeTenantId(undefined)).toBe("default");
  });
});

describe("utils/tenant table/meta/uid helpers", () => {
  it("builds tableNameFor from sanitized tenant and collection", () => {
    const table = tableNameFor("tenant_id", "my_collection_a1b2c3d4");
    expect(table).toBe("qdr_tenant_id__my_collection_a1b2c3d4");
  });

  it("builds metaKeyFor from sanitized tenant and collection", () => {
    const key = metaKeyFor("tenant_id", "my_collection_a1b2c3d4");
    expect(key).toBe("tenant_id/my_collection_a1b2c3d4");
  });

  it("uidFor delegates to tableNameFor", () => {
    const uid = uidFor("tenant_id", "my_collection_a1b2c3d4");
    expect(uid).toBe("qdr_tenant_id__my_collection_a1b2c3d4");
  });
});
