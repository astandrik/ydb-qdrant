import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const withSessionMock = vi.fn();

vi.mock("../../src/ydb/client.js", () => ({
  withSession: withSessionMock,
  withStartupProbeSession: vi.fn(),
}));

const createCollectionOneTableMock = vi.fn(async () => {});
const deleteCollectionOneTableMock = vi.fn(async () => {});

vi.mock("../../src/repositories/collectionsRepo.one-table.js", () => ({
  createCollectionOneTable: createCollectionOneTableMock,
  deleteCollectionOneTable: deleteCollectionOneTableMock,
}));

describe("collectionsRepo meta cache", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    withSessionMock.mockReset();
    createCollectionOneTableMock.mockClear();
    deleteCollectionOneTableMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...envSnapshot };
  });

  it("caches getCollectionMeta for TTL and avoids repeated withSession calls", async () => {
    const row = {
      table_name: "qdrant_all_points",
      vector_dimension: 4,
      distance: "Cosine",
      vector_type: "float",
      last_accessed_at: "2025-01-01T00:00:00.000Z",
    };

    withSessionMock.mockResolvedValue([[row]]);

    const mod = await import("../../src/repositories/collectionsRepo.js");
    const metaKey = "t/c";

    const m1 = await mod.getCollectionMeta(metaKey);
    const m2 = await mod.getCollectionMeta(metaKey);

    expect(m1).not.toBeNull();
    expect(m2).not.toBeNull();
    expect(withSessionMock).toHaveBeenCalledTimes(1);
  });

  it("expires cache entries after TTL", async () => {
    const row = {
      table_name: "qdrant_all_points",
      vector_dimension: 4,
      distance: "Cosine",
      vector_type: "float",
      last_accessed_at: "2025-01-01T00:00:00.000Z",
    };

    withSessionMock.mockResolvedValue([[row]]);
    const mod = await import("../../src/repositories/collectionsRepo.js");
    const metaKey = "t/c";

    await mod.getCollectionMeta(metaKey);
    expect(withSessionMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date(Date.now() + 5 * 60_000 + 1));
    await mod.getCollectionMeta(metaKey);
    expect(withSessionMock).toHaveBeenCalledTimes(2);
  });

  it("invalidates cache on createCollection and deleteCollection", async () => {
    const row = {
      table_name: "qdrant_all_points",
      vector_dimension: 4,
      distance: "Cosine",
      vector_type: "float",
      last_accessed_at: "2025-01-01T00:00:00.000Z",
    };

    withSessionMock.mockResolvedValue([[row]]);
    const mod = await import("../../src/repositories/collectionsRepo.js");
    const metaKey = "tenant/col";

    await mod.getCollectionMeta(metaKey);
    await mod.getCollectionMeta(metaKey);
    expect(withSessionMock).toHaveBeenCalledTimes(1);

    await mod.createCollection(metaKey, 4, "Cosine", "float");
    await mod.getCollectionMeta(metaKey);
    expect(withSessionMock).toHaveBeenCalledTimes(2);

    await mod.deleteCollection(metaKey, "qdr_tenant__col");
    await mod.getCollectionMeta(metaKey);
    expect(withSessionMock).toHaveBeenCalledTimes(3);
  });
});
