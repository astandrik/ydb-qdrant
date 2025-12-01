import { describe, it, expect } from "vitest";
import {
  hashApiKey,
  hashUserAgent,
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

describe("utils/tenant/hashUserAgent", () => {
  it("returns undefined when userAgent is undefined", () => {
    expect(hashUserAgent(undefined)).toBeUndefined();
  });

  it("returns undefined for empty or whitespace-only userAgent", () => {
    expect(hashUserAgent("")).toBeUndefined();
    expect(hashUserAgent("   ")).toBeUndefined();
  });

  it("returns an 8-char hex hash for a non-empty userAgent", () => {
    const hash = hashUserAgent("Mozilla/5.0 (Windows NT 10.0)");
    expect(hash).toBeDefined();
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic for the same userAgent and differs for different agents", () => {
    const h1 = hashUserAgent("Chrome/120.0");
    const h2 = hashUserAgent("Chrome/120.0");
    const h3 = hashUserAgent("Firefox/121.0");

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
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

  it("appends userAgentHash suffix when provided", () => {
    expect(
      sanitizeCollectionName("My-Collection", undefined, "e5f6g7h8")
    ).toBe("my_collection_e5f6g7h8");
  });

  it("appends both apiKeyHash and userAgentHash when both provided", () => {
    expect(sanitizeCollectionName("My-Collection", "a1b2c3d4", "e5f6g7h8")).toBe(
      "my_collection_a1b2c3d4_e5f6g7h8"
    );
  });

  it("falls back to 'collection' when name is empty", () => {
    expect(sanitizeCollectionName("")).toBe("collection");
  });

  it("falls back to 'collection' with hashes when name is empty but hashes provided", () => {
    expect(sanitizeCollectionName("", "a1b2c3d4", "e5f6g7h8")).toBe(
      "collection_a1b2c3d4_e5f6g7h8"
    );
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
