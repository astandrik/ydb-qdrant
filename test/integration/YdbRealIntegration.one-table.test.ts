import { beforeAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/api.js";
import { GLOBAL_POINTS_TABLE } from "../../src/ydb/schema.js";
import { withSession } from "../../src/ydb/client.js";
import { Utf8 } from "@ydbjs/value/primitive";
import type {
  QdrantDenseVector,
  QdrantPayload,
  QdrantPointId,
  QdrantPointStructDense,
} from "../../src/qdrant/QdrantTypes.js";
import {
  RECALL_DIM,
  RECALL_K,
  MIN_MEAN_RECALL,
  DATASET_SIZE,
  QUERY_COUNT,
  buildRealisticDataset,
  computeRecall,
  computeF1,
} from "./helpers/recall-test-utils.js";

const RNG_SEED = 4242;

/**
 * Integration tests for one_table storage mode with realistic recall benchmark.
 *
 * Uses ANN-benchmarks methodology with random vectors and exact ground truth.
 * Reference: https://github.com/erikbern/ann-benchmarks
 */
describe("YDB integration with COLLECTION_STORAGE_MODE=one_table", () => {
  const tenant = process.env.YDB_QDRANT_INTEGRATION_TENANT ?? "itest_tenant";
  const collectionBase =
    process.env.YDB_QDRANT_INTEGRATION_COLLECTION ?? "itest_collection";

  let client: Awaited<ReturnType<typeof createYdbQdrantClient>>;

  beforeAll(async () => {
    client = await createYdbQdrantClient({ defaultTenant: tenant });
  });

  it(`achieves reasonable Recall@${RECALL_K} on ${DATASET_SIZE} random ${RECALL_DIM}D vectors (one_table)`, async () => {
    const collection = `${collectionBase}_one_table_recall_${Date.now()}`;

    await client.createCollection(collection, {
      vectors: {
        size: RECALL_DIM,
        distance: "Cosine",
        data_type: "float",
      },
    });

    // Build realistic dataset with random vectors and exact ground truth
    const { points, queries } = buildRealisticDataset(RNG_SEED);

    await client.upsertPoints(collection, {
      points: points.map(
        (p): QdrantPointStructDense => ({
          id: p.id as QdrantPointId,
          vector: p.vector as QdrantDenseVector,
        })
      ),
    });

    const recalls: number[] = [];
    const f1s: number[] = [];

    for (const query of queries) {
      const queryVector: QdrantDenseVector = query.vector;
      const result = await client.searchPoints(collection, {
        vector: queryVector,
        top: RECALL_K,
        with_payload: false,
      });

      const retrievedIds = (result.points ?? []).map((p) => p.id);
      const recall = computeRecall(query.relevantIds, retrievedIds);
      const f1 = computeF1(query.relevantIds, retrievedIds);
      recalls.push(recall);
      f1s.push(f1);
    }

    const meanRecall = recalls.reduce((sum, r) => sum + r, 0) / recalls.length;
    const meanF1 = f1s.reduce((sum, v) => sum + v, 0) / f1s.length;
    const minRecall = Math.min(...recalls);
    const maxRecall = Math.max(...recalls);

    // Output for CI badges and monitoring
    console.log(`RECALL_MEAN_ONE_TABLE ${meanRecall.toFixed(4)}`);
    console.log(`F1_MEAN_ONE_TABLE ${meanF1.toFixed(4)}`);
    console.log(
      `Recall@${RECALL_K} stats: mean=${meanRecall.toFixed(
        4
      )}, min=${minRecall.toFixed(4)}, max=${maxRecall.toFixed(4)}`
    );
    console.log(
      `Dataset: ${DATASET_SIZE} points, ${QUERY_COUNT} queries, ${RECALL_DIM}D vectors`
    );

    expect(meanRecall).toBeGreaterThanOrEqual(MIN_MEAN_RECALL);

    try {
      await client.deleteCollection(collection);
    } catch {
      // ignore cleanup failures
    }
  }, 120000); // Increased timeout for larger dataset with 768D vectors

  it("creates collection, upserts points to global table, and performs search", async () => {
    const collection = `${collectionBase}_one_table_basic_${Date.now()}`;

    await client.createCollection(collection, {
      vectors: {
        size: 4,
        distance: "Cosine",
        data_type: "float",
      },
    });

    const points: QdrantPointStructDense[] = [
      { id: "p1", vector: [0, 0, 0, 1], payload: { label: "p1" } },
      { id: "p2", vector: [0, 0, 1, 0], payload: { label: "p2" } },
    ];
    await client.upsertPoints(collection, { points });

    const queryVector: QdrantDenseVector = [0, 0, 0, 1];
    const result = await client.searchPoints(collection, {
      vector: queryVector,
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

    const points: QdrantPointStructDense[] = [
      { id: "uid_test_point", vector: [1, 0, 0, 0], payload: {} },
    ];
    await client.upsertPoints(collection, { points });

    // Query the global table directly to verify the uid and quantized column
    const query = `
      DECLARE $uid AS Utf8;
      DECLARE $point_id AS Utf8;
      SELECT uid, point_id, embedding, embedding_quantized FROM ${GLOBAL_POINTS_TABLE}
      WHERE uid = $uid AND point_id = $point_id;
    `;

    type Row = {
      uid: string;
      point_id: string;
      embedding: unknown;
      embedding_quantized: unknown;
    };

    const [rows] = await withSession(async (sql, signal) => {
      return await sql<[Row]>`${sql.unsafe(query)}`
        .idempotent(true)
        .signal(signal)
        .parameter("uid", new Utf8(expectedUid))
        .parameter("point_id", new Utf8("uid_test_point"));
    });

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.uid).toBe(expectedUid);
    expect(row.point_id).toBe("uid_test_point");
    expect(row.embedding).toBeDefined();
    expect(row.embedding_quantized).toBeDefined();

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
    const payloadA: QdrantPayload = { tenant: "a" };
    await clientA.upsertPoints(collection, {
      points: [{ id: "shared_id", vector: [1, 0, 0, 0], payload: payloadA }],
    });

    const payloadB: QdrantPayload = { tenant: "b" };
    await clientB.upsertPoints(collection, {
      points: [{ id: "shared_id", vector: [0, 1, 0, 0], payload: payloadB }],
    });

    // Search from tenant A should only see tenant A's data
    const queryVectorA: QdrantDenseVector = [1, 0, 0, 0];
    const resA = await clientA.searchPoints(collection, {
      vector: queryVectorA,
      top: 10,
      with_payload: true,
    });

    const pointA = resA.points?.find((p) => p.id === "shared_id");
    expect(pointA).toBeDefined();
    expect(pointA?.payload?.tenant).toBe("a");

    // Search from tenant B should only see tenant B's data
    const queryVectorB: QdrantDenseVector = [0, 1, 0, 0];
    const resB = await clientB.searchPoints(collection, {
      vector: queryVectorB,
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

  // No schema auto-migration is performed by the service. If an existing deployment has
  // older tables, operators must apply manual migrations or recreate tables.
});
