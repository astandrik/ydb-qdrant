import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/Api.js";

describe("YDB integration (real database via programmatic API)", () => {
  const tenant = process.env.YDB_QDRANT_INTEGRATION_TENANT ?? "itest_tenant";
  const collectionBase =
    process.env.YDB_QDRANT_INTEGRATION_COLLECTION ?? "itest_collection";
  const collection = `${collectionBase}_${Date.now()}`;

  let client: Awaited<ReturnType<typeof createYdbQdrantClient>>;

  beforeAll(async () => {
    client = await createYdbQdrantClient({ defaultTenant: tenant });
  });

  afterAll(async () => {
    if (!client) {
      return;
    }

    try {
      await client.deleteCollection(collection);
    } catch {
      // ignore cleanup failures in integration tests
    }
  });

  it("creates collection, upserts points, and performs search against real YDB", async () => {
    await client.createCollection(collection, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await client.upsertPoints(collection, {
      points: [
        {
          id: "p1",
          vector: [0, 0, 0, 1],
          payload: { label: "p1" },
        },
        {
          id: "p2",
          vector: [0, 0, 1, 0],
          payload: { label: "p2" },
        },
      ],
    });

    const result = await client.searchPoints(collection, {
      vector: [0, 0, 0, 1],
      top: 2,
      with_payload: true,
    });

    expect(result.points).toBeDefined();
    expect(result.points?.length).toBeGreaterThanOrEqual(1);
    const ids = (result.points ?? []).map((p) => p.id);
    expect(ids).toContain("p1");
  });

  it("manages collection lifecycle (create, get, delete)", async () => {
    const col = `${collectionBase}_lifecycle_${Date.now()}`;

    await client.createCollection(col, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    const info = await client.getCollection(col);

    expect(info).toMatchObject({
      name: col,
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await client.deleteCollection(col);

    await expect(client.getCollection(col)).rejects.toThrow();
  });

  it("deletes points and excludes them from subsequent search results", async () => {
    const col = `${collectionBase}_delete_points_${Date.now()}`;

    await client.createCollection(col, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await client.upsertPoints(col, {
      points: [
        { id: "p1", vector: [0, 0, 0, 1], payload: { label: "p1" } },
        { id: "p2", vector: [0, 0, 1, 0], payload: { label: "p2" } },
        { id: "p3", vector: [0, 1, 0, 0], payload: { label: "p3" } },
      ],
    });

    const initial = await client.searchPoints(col, {
      vector: [0, 0, 0, 1],
      top: 10,
      with_payload: true,
    });

    const initialIds = (initial.points ?? []).map((p) => p.id);
    expect(initialIds).toEqual(expect.arrayContaining(["p1", "p2", "p3"]));

    await client.deletePoints(col, { points: ["p1", "p2"] });

    const afterDelete = await client.searchPoints(col, {
      vector: [0, 0, 0, 1],
      top: 10,
      with_payload: true,
    });

    const afterIds = (afterDelete.points ?? []).map((p) => p.id);
    expect(afterIds).toContain("p3");
    expect(afterIds).not.toContain("p1");
    expect(afterIds).not.toContain("p2");

    try {
      await client.deleteCollection(col);
    } catch {
      // ignore cleanup failures
    }
  });

  it("isolates data between tenants when using forTenant", async () => {
    const tenantA = `${tenant}_a`;
    const tenantB = `${tenant}_b`;
    const col = `${collectionBase}_tenant_isolation_${Date.now()}`;

    const clientA = client.forTenant(tenantA);
    const clientB = client.forTenant(tenantB);

    await clientA.createCollection(col, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await clientB.createCollection(col, {
      vectors: {
        size: 5,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await clientA.upsertPoints(col, {
      points: [{ id: "a1", vector: [0, 0, 0, 1], payload: { tenant: "a" } }],
    });

    await clientB.upsertPoints(col, {
      points: [{ id: "b1", vector: [0, 0, 1, 0], payload: { tenant: "b" } }],
    });

    const resA = await clientA.searchPoints(col, {
      vector: [0, 0, 0, 1],
      top: 10,
      with_payload: true,
    });
    const idsA = (resA.points ?? []).map((p) => p.id);
    expect(idsA).toContain("a1");
    expect(idsA).not.toContain("b1");

    const resB = await clientB.searchPoints(col, {
      vector: [0, 0, 1, 0],
      top: 10,
      with_payload: true,
    });
    const idsB = (resB.points ?? []).map((p) => p.id);
    expect(idsB).toContain("b1");
    expect(idsB).not.toContain("a1");

    try {
      await clientA.deleteCollection(col);
    } catch {
      // ignore cleanup failures
    }

    try {
      await clientB.deleteCollection(col);
    } catch {
      // ignore cleanup failures
    }
  });
});
