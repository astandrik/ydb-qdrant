import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env.ts configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Clear relevant env vars before each test
    delete process.env.YDB_QDRANT_SEARCH_MODE;
    delete process.env.YDB_QDRANT_OVERFETCH_MULTIPLIER;
    delete process.env.YDB_QDRANT_UPSERT_BATCH_SIZE;
    delete process.env.YDB_SESSION_POOL_MIN_SIZE;
    delete process.env.YDB_SESSION_POOL_MAX_SIZE;
    delete process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS;
    delete process.env.YDB_QDRANT_UPSERT_TIMEOUT_MS;
    delete process.env.YDB_QDRANT_SEARCH_TIMEOUT_MS;
    delete process.env.YDB_QDRANT_STARTUP_PROBE_SESSION_TIMEOUT_MS;
    delete process.env.YDB_QDRANT_LAST_ACCESS_MIN_WRITE_INTERVAL_MS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("SEARCH_MODE and OVERFETCH_MULTIPLIER", () => {
    it("defaults to exact search mode when not configured", async () => {
      const env = await import("../../src/config/env.js");

      expect(env.resolveSearchMode(undefined)).toBe(env.SearchMode.Exact);
      expect(env.resolveSearchMode("")).toBe(env.SearchMode.Exact);
    });

    it("parses explicit exact search mode", async () => {
      const env = await import("../../src/config/env.js");

      expect(env.resolveSearchMode("exact")).toBe(env.SearchMode.Exact);
      expect(env.resolveSearchMode("  ExAcT  ")).toBe(env.SearchMode.Exact);
    });

    it("parses OVERFETCH_MULTIPLIER and clamps to minimum 1", async () => {
      process.env.YDB_QDRANT_OVERFETCH_MULTIPLIER = "0";

      const env = await import("../../src/config/env.js");

      expect(env.OVERFETCH_MULTIPLIER).toBe(1);
    });
  });

  describe("UPSERT_BATCH_SIZE", () => {
    it("defaults to 100 when YDB_QDRANT_UPSERT_BATCH_SIZE is not set", async () => {
      const env = await import("../../src/config/env.js");
      expect(env.UPSERT_BATCH_SIZE).toBe(100);
    });

    it("uses value from YDB_QDRANT_UPSERT_BATCH_SIZE when valid", async () => {
      process.env.YDB_QDRANT_UPSERT_BATCH_SIZE = "50";

      const env = await import("../../src/config/env.js");

      expect(env.UPSERT_BATCH_SIZE).toBe(50);
    });

    it("clamps UPSERT_BATCH_SIZE to minimum 1 for values below 1", async () => {
      process.env.YDB_QDRANT_UPSERT_BATCH_SIZE = "0";

      const env = await import("../../src/config/env.js");

      expect(env.UPSERT_BATCH_SIZE).toBe(1);
    });
  });

  describe("session pool configuration", () => {
    it("uses defaults when session pool env vars are not set", async () => {
      const env = await import("../../src/config/env.js");

      expect(env.SESSION_POOL_MIN_SIZE).toBe(5);
      expect(env.SESSION_POOL_MAX_SIZE).toBe(100);
      expect(env.SESSION_KEEPALIVE_PERIOD_MS).toBe(5000);
    });

    it("parses valid session pool values", async () => {
      process.env.YDB_SESSION_POOL_MIN_SIZE = "10";
      process.env.YDB_SESSION_POOL_MAX_SIZE = "200";
      process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "15000";

      const env = await import("../../src/config/env.js");

      expect(env.SESSION_POOL_MIN_SIZE).toBe(10);
      expect(env.SESSION_POOL_MAX_SIZE).toBe(200);
      expect(env.SESSION_KEEPALIVE_PERIOD_MS).toBe(15000);
    });

    it("clamps SESSION_POOL_MIN_SIZE to minimum 1 for values below 1", async () => {
      process.env.YDB_SESSION_POOL_MIN_SIZE = "0";

      const env = await import("../../src/config/env.js");

      expect(env.SESSION_POOL_MIN_SIZE).toBe(1);
    });

    it("clamps SESSION_POOL_MAX_SIZE to maximum 500 for values above 500", async () => {
      process.env.YDB_SESSION_POOL_MAX_SIZE = "9999";

      const env = await import("../../src/config/env.js");

      expect(env.SESSION_POOL_MAX_SIZE).toBe(500);
    });

    it("normalizes SESSION_POOL_MIN_SIZE when configured greater than SESSION_POOL_MAX_SIZE", async () => {
      process.env.YDB_SESSION_POOL_MIN_SIZE = "200";
      process.env.YDB_SESSION_POOL_MAX_SIZE = "100";

      const env = await import("../../src/config/env.js");

      expect(env.SESSION_POOL_MIN_SIZE).toBe(100);
      expect(env.SESSION_POOL_MAX_SIZE).toBe(100);
    });

    it("clamps SESSION_KEEPALIVE_PERIOD_MS to configured bounds", async () => {
      process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "10";
      let env = await import("../../src/config/env.js");
      expect(env.SESSION_KEEPALIVE_PERIOD_MS).toBe(1000);

      vi.resetModules();
      process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "120000";
      env = await import("../../src/config/env.js");
      expect(env.SESSION_KEEPALIVE_PERIOD_MS).toBe(60000);
    });

    it("falls back to defaults for invalid numeric input", async () => {
      process.env.YDB_SESSION_POOL_MIN_SIZE = "abc";
      process.env.YDB_SESSION_POOL_MAX_SIZE = "xyz";
      process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS = "NaN";

      const env = await import("../../src/config/env.js");

      expect(env.SESSION_POOL_MIN_SIZE).toBe(5);
      expect(env.SESSION_POOL_MAX_SIZE).toBe(100);
      expect(env.SESSION_KEEPALIVE_PERIOD_MS).toBe(5000);
    });
  });

  describe("operation and startup probe timeouts", () => {
    it("uses defaults when timeout env vars are not set", async () => {
      const env = await import("../../src/config/env.js");

      expect(env.UPSERT_OPERATION_TIMEOUT_MS).toBe(5000);
      expect(env.SEARCH_OPERATION_TIMEOUT_MS).toBe(10000);
      expect(env.STARTUP_PROBE_SESSION_TIMEOUT_MS).toBe(5000);
    });

    it("parses valid timeout values from env", async () => {
      process.env.YDB_QDRANT_UPSERT_TIMEOUT_MS = "7500";
      process.env.YDB_QDRANT_SEARCH_TIMEOUT_MS = "20000";
      process.env.YDB_QDRANT_STARTUP_PROBE_SESSION_TIMEOUT_MS = "4000";

      const env = await import("../../src/config/env.js");

      expect(env.UPSERT_OPERATION_TIMEOUT_MS).toBe(7500);
      expect(env.SEARCH_OPERATION_TIMEOUT_MS).toBe(20000);
      expect(env.STARTUP_PROBE_SESSION_TIMEOUT_MS).toBe(4000);
    });

    it("clamps timeouts to minimum 1000ms", async () => {
      process.env.YDB_QDRANT_UPSERT_TIMEOUT_MS = "10";
      process.env.YDB_QDRANT_SEARCH_TIMEOUT_MS = "0";
      process.env.YDB_QDRANT_STARTUP_PROBE_SESSION_TIMEOUT_MS = "5";

      const env = await import("../../src/config/env.js");

      expect(env.UPSERT_OPERATION_TIMEOUT_MS).toBe(1000);
      expect(env.SEARCH_OPERATION_TIMEOUT_MS).toBe(1000);
      expect(env.STARTUP_PROBE_SESSION_TIMEOUT_MS).toBe(1000);
    });

    it("falls back to defaults for invalid numeric input", async () => {
      process.env.YDB_QDRANT_UPSERT_TIMEOUT_MS = "NaN";
      process.env.YDB_QDRANT_SEARCH_TIMEOUT_MS = "oops";
      process.env.YDB_QDRANT_STARTUP_PROBE_SESSION_TIMEOUT_MS = "bad";

      const env = await import("../../src/config/env.js");

      expect(env.UPSERT_OPERATION_TIMEOUT_MS).toBe(5000);
      expect(env.SEARCH_OPERATION_TIMEOUT_MS).toBe(10000);
      expect(env.STARTUP_PROBE_SESSION_TIMEOUT_MS).toBe(5000);
    });
  });

  describe("LAST_ACCESS_MIN_WRITE_INTERVAL_MS", () => {
    it("defaults to 60000 when not set", async () => {
      const env = await import("../../src/config/env.js");
      expect(env.LAST_ACCESS_MIN_WRITE_INTERVAL_MS).toBe(60000);
    });

    it("parses valid interval value from env", async () => {
      process.env.YDB_QDRANT_LAST_ACCESS_MIN_WRITE_INTERVAL_MS = "120000";

      const env = await import("../../src/config/env.js");

      expect(env.LAST_ACCESS_MIN_WRITE_INTERVAL_MS).toBe(120000);
    });

    it("clamps interval to minimum 1000ms", async () => {
      process.env.YDB_QDRANT_LAST_ACCESS_MIN_WRITE_INTERVAL_MS = "10";

      const env = await import("../../src/config/env.js");

      expect(env.LAST_ACCESS_MIN_WRITE_INTERVAL_MS).toBe(1000);
    });
  });
});
