import { beforeAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/api.js";
import { COLLECTION_STORAGE_MODE } from "../../src/config/env.js";
import { GLOBAL_POINTS_TABLE } from "../../src/ydb/schema.js";
import { withSession, TypedValues } from "../../src/ydb/client.js";

describe("YDB integration with COLLECTION_STORAGE_MODE=one_table", () => {
  const tenant = process.env.YDB_QDRANT_INTEGRATION_TENANT ?? "itest_tenant";
  const collectionBase =
    process.env.YDB_QDRANT_INTEGRATION_COLLECTION ?? "itest_collection";

  let client: Awaited<ReturnType<typeof createYdbQdrantClient>>;

  beforeAll(async () => {
    client = await createYdbQdrantClient({ defaultTenant: tenant });
  });

  it("guards: COLLECTION_STORAGE_MODE must be one_table for this test suite", () => {
    expect(COLLECTION_STORAGE_MODE).toBe("one_table");
  });

  it("creates collection, upserts points to global table, and performs search", async () => {
    const collection = `${collectionBase}_one_table_basic_${Date.now()}`;

    await client.createCollection(collection, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await client.upsertPoints(collection, {
      points: [
        { id: "p1", vector: [0, 0, 0, 1], payload: { label: "p1" } },
        { id: "p2", vector: [0, 0, 1, 0], payload: { label: "p2" } },
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

    // Cleanup
    try {
      await client.deleteCollection(collection);
    } catch {
      // ignore cleanup failures
    }
  });

  it("stores points in the global table with correct uid", async () => {
    const collection = `${collectionBase}_one_table_uid_${Date.now()}`;
    const expectedUid = `qdr_${tenant}__${collection}`;

    await client.createCollection(collection, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await client.upsertPoints(collection, {
      points: [{ id: "uid_test_point", vector: [1, 0, 0, 0], payload: {} }],
    });

    // Query the global table directly to verify the uid
    const query = `
      DECLARE $uid AS Utf8;
      DECLARE $point_id AS Utf8;
      SELECT uid, point_id FROM ${GLOBAL_POINTS_TABLE}
      WHERE uid = $uid AND point_id = $point_id;
    `;

    const res = await withSession(async (s) => {
      return await s.executeQuery(query, {
        $uid: TypedValues.utf8(expectedUid),
        $point_id: TypedValues.utf8("uid_test_point"),
      });
    });

    const rowset = res.resultSets?.[0];
    expect(rowset?.rows?.length).toBe(1);

    // Cleanup
    try {
      await client.deleteCollection(collection);
    } catch {
      // ignore cleanup failures
    }
  });

  it("isolates data between tenants using uid filtering in global table", async () => {
    const tenantA = `${tenant}_onetbl_a`;
    const tenantB = `${tenant}_onetbl_b`;
    const collection = `${collectionBase}_one_table_isolation_${Date.now()}`;

    const clientA = client.forTenant(tenantA);
    const clientB = client.forTenant(tenantB);

    // Create same collection for both tenants
    await clientA.createCollection(collection, {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });

    await clientB.createCollection(collection, {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });

    // Upsert points for each tenant
    await clientA.upsertPoints(collection, {
      points: [
        { id: "shared_id", vector: [1, 0, 0, 0], payload: { tenant: "a" } },
      ],
    });

    await clientB.upsertPoints(collection, {
      points: [
        { id: "shared_id", vector: [0, 1, 0, 0], payload: { tenant: "b" } },
      ],
    });

    // Search from tenant A should only see tenant A's data
    const resA = await clientA.searchPoints(collection, {
      vector: [1, 0, 0, 0],
      top: 10,
      with_payload: true,
    });

    const pointA = resA.points?.find((p) => p.id === "shared_id");
    expect(pointA).toBeDefined();
    expect(pointA?.payload?.tenant).toBe("a");

    // Search from tenant B should only see tenant B's data
    const resB = await clientB.searchPoints(collection, {
      vector: [0, 1, 0, 0],
      top: 10,
      with_payload: true,
    });

    const pointB = resB.points?.find((p) => p.id === "shared_id");
    expect(pointB).toBeDefined();
    expect(pointB?.payload?.tenant).toBe("b");

    // Cleanup
    try {
      await clientA.deleteCollection(collection);
    } catch {
      // ignore cleanup failures
    }
    try {
      await clientB.deleteCollection(collection);
    } catch {
      // ignore cleanup failures
    }
  });

  it("deletes only the collection's points from global table, not other collections", async () => {
    const collectionToDelete = `${collectionBase}_one_table_del_${Date.now()}`;
    const collectionToKeep = `${collectionBase}_one_table_keep_${Date.now()}`;

    // Create two collections
    await client.createCollection(collectionToDelete, {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });

    await client.createCollection(collectionToKeep, {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });

    // Upsert points to both
    await client.upsertPoints(collectionToDelete, {
      points: [{ id: "del_point", vector: [1, 0, 0, 0], payload: {} }],
    });

    await client.upsertPoints(collectionToKeep, {
      points: [{ id: "keep_point", vector: [0, 1, 0, 0], payload: {} }],
    });

    // Delete one collection
    await client.deleteCollection(collectionToDelete);

    // Verify the kept collection still has its points
    const result = await client.searchPoints(collectionToKeep, {
      vector: [0, 1, 0, 0],
      top: 10,
      with_payload: true,
    });

    const ids = (result.points ?? []).map((p) => p.id);
    expect(ids).toContain("keep_point");

    // Verify deleted collection throws 404
    await expect(client.getCollection(collectionToDelete)).rejects.toThrow();

    // Cleanup
    try {
      await client.deleteCollection(collectionToKeep);
    } catch {
      // ignore cleanup failures
    }
  });

  it("deletes individual points from global table using uid filter", async () => {
    const collection = `${collectionBase}_one_table_del_pts_${Date.now()}`;

    await client.createCollection(collection, {
      vectors: { size: 4, distance: "Cosine", data_type: "float" },
    });

    await client.upsertPoints(collection, {
      points: [
        { id: "p1", vector: [1, 0, 0, 0], payload: { label: "p1" } },
        { id: "p2", vector: [0, 1, 0, 0], payload: { label: "p2" } },
        { id: "p3", vector: [0, 0, 1, 0], payload: { label: "p3" } },
      ],
    });

    // Delete p1 and p2
    await client.deletePoints(collection, { points: ["p1", "p2"] });

    // Search should only return p3
    const result = await client.searchPoints(collection, {
      vector: [0, 0, 1, 0],
      top: 10,
      with_payload: true,
    });

    const ids = (result.points ?? []).map((p) => p.id);
    expect(ids).toContain("p3");
    expect(ids).not.toContain("p1");
    expect(ids).not.toContain("p2");

    // Cleanup
    try {
      await client.deleteCollection(collection);
    } catch {
      // ignore cleanup failures
    }
  });
});
