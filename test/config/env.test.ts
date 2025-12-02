import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env.ts configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Clear relevant env vars before each test
    delete process.env.VECTOR_INDEX_BUILD_ENABLED;
    delete process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE;
    delete process.env.YDB_QDRANT_TABLE_LAYOUT;
    delete process.env.YDB_QDRANT_SEARCH_MODE;
    delete process.env.YDB_QDRANT_OVERFETCH_MULTIPLIER;
    delete process.env.YDB_QDRANT_CLIENT_SIDE_SERIALIZATION_ENABLED;
    delete process.env.YDB_QDRANT_UPSERT_BATCH_SIZE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("VECTOR_INDEX_BUILD_ENABLED conditional default", () => {
    it("defaults to true when COLLECTION_STORAGE_MODE is multi_table and VECTOR_INDEX_BUILD_ENABLED is not set", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "multi_table";

      const env = await import("../../src/config/env.js");

      expect(env.COLLECTION_STORAGE_MODE).toBe("multi_table");
      expect(env.VECTOR_INDEX_BUILD_ENABLED).toBe(true);
    });

    it("defaults to true when COLLECTION_STORAGE_MODE is not set (defaults to multi_table) and VECTOR_INDEX_BUILD_ENABLED is not set", async () => {
      // Neither env var is set - should default to multi_table mode with index enabled

      const env = await import("../../src/config/env.js");

      expect(env.COLLECTION_STORAGE_MODE).toBe("multi_table");
      expect(env.VECTOR_INDEX_BUILD_ENABLED).toBe(true);
    });

    it("defaults to false when COLLECTION_STORAGE_MODE is one_table and VECTOR_INDEX_BUILD_ENABLED is not set", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "one_table";

      const env = await import("../../src/config/env.js");

      expect(env.COLLECTION_STORAGE_MODE).toBe("one_table");
      expect(env.VECTOR_INDEX_BUILD_ENABLED).toBe(false);
    });

    it("respects explicit VECTOR_INDEX_BUILD_ENABLED=true even in one_table mode", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "one_table";
      process.env.VECTOR_INDEX_BUILD_ENABLED = "true";

      const env = await import("../../src/config/env.js");

      expect(env.COLLECTION_STORAGE_MODE).toBe("one_table");
      expect(env.VECTOR_INDEX_BUILD_ENABLED).toBe(true);
    });

    it("respects explicit VECTOR_INDEX_BUILD_ENABLED=false even in multi_table mode", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "multi_table";
      process.env.VECTOR_INDEX_BUILD_ENABLED = "false";

      const env = await import("../../src/config/env.js");

      expect(env.COLLECTION_STORAGE_MODE).toBe("multi_table");
      expect(env.VECTOR_INDEX_BUILD_ENABLED).toBe(false);
    });

    it("handles various truthy values for VECTOR_INDEX_BUILD_ENABLED", async () => {
      const truthyValues = ["1", "true", "yes", "on", "TRUE", "True"];

      for (const value of truthyValues) {
        vi.resetModules();
        process.env.VECTOR_INDEX_BUILD_ENABLED = value;

        const env = await import("../../src/config/env.js");
        expect(env.VECTOR_INDEX_BUILD_ENABLED).toBe(true);
      }
    });

    it("handles various falsy values for VECTOR_INDEX_BUILD_ENABLED", async () => {
      const falsyValues = ["0", "false", "no", "off", "FALSE", "False", ""];

      for (const value of falsyValues) {
        vi.resetModules();
        process.env.VECTOR_INDEX_BUILD_ENABLED = value;

        const env = await import("../../src/config/env.js");
        expect(env.VECTOR_INDEX_BUILD_ENABLED).toBe(false);
      }
    });
  });

  describe("COLLECTION_STORAGE_MODE", () => {
    it("defaults to multi_table when not set", async () => {
      const env = await import("../../src/config/env.js");
      expect(env.COLLECTION_STORAGE_MODE).toBe("multi_table");
    });

    it("respects YDB_QDRANT_COLLECTION_STORAGE_MODE env var", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "one_table";

      const env = await import("../../src/config/env.js");
      expect(env.COLLECTION_STORAGE_MODE).toBe("one_table");
    });

    it("respects legacy YDB_QDRANT_TABLE_LAYOUT env var", async () => {
      process.env.YDB_QDRANT_TABLE_LAYOUT = "one_table";

      const env = await import("../../src/config/env.js");
      expect(env.COLLECTION_STORAGE_MODE).toBe("one_table");
    });

    it("prefers YDB_QDRANT_COLLECTION_STORAGE_MODE over YDB_QDRANT_TABLE_LAYOUT", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "multi_table";
      process.env.YDB_QDRANT_TABLE_LAYOUT = "one_table";

      const env = await import("../../src/config/env.js");
      expect(env.COLLECTION_STORAGE_MODE).toBe("multi_table");
    });
  });

  describe("isOneTableMode helper", () => {
    it("returns true for OneTable mode", async () => {
      const env = await import("../../src/config/env.js");
      expect(env.isOneTableMode(env.CollectionStorageMode.OneTable)).toBe(true);
    });

    it("returns false for MultiTable mode", async () => {
      const env = await import("../../src/config/env.js");
      expect(env.isOneTableMode(env.CollectionStorageMode.MultiTable)).toBe(
        false
      );
    });
  });

  describe("SEARCH_MODE and OVERFETCH_MULTIPLIER", () => {
    it("defaults to approximate search mode for one_table", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "one_table";

      const env = await import("../../src/config/env.js");

      expect(env.SEARCH_MODE).toBe("approximate");
    });

    it("parses explicit exact search mode", async () => {
      process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE = "one_table";
      process.env.YDB_QDRANT_SEARCH_MODE = "exact";

      const env = await import("../../src/config/env.js");

      expect(env.SEARCH_MODE).toBe("exact");
    });

    it("parses OVERFETCH_MULTIPLIER and clamps to minimum 1", async () => {
      process.env.YDB_QDRANT_OVERFETCH_MULTIPLIER = "0";

      const env = await import("../../src/config/env.js");

      expect(env.OVERFETCH_MULTIPLIER).toBe(1);
    });

    it("parses CLIENT_SIDE_SERIALIZATION_ENABLED boolean flag", async () => {
      process.env.YDB_QDRANT_CLIENT_SIDE_SERIALIZATION_ENABLED = "true";

      const env = await import("../../src/config/env.js");

      expect(env.CLIENT_SIDE_SERIALIZATION_ENABLED).toBe(true);
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
});
