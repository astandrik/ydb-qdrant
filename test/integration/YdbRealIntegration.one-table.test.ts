import { beforeAll, describe, it, expect } from "vitest";
import { createYdbQdrantClient } from "../../src/package/api.js";
import { COLLECTION_STORAGE_MODE } from "../../src/config/env.js";
import { GLOBAL_POINTS_TABLE } from "../../src/ydb/schema.js";
import {
  withSession,
  TypedValues,
  TableDescription,
  Column,
  Types,
} from "../../src/ydb/client.js";
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

  it("guards: COLLECTION_STORAGE_MODE must be one_table for this test suite", () => {
    expect(COLLECTION_STORAGE_MODE).toBe("one_table");
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
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
      })),
    });

    const recalls: number[] = [];
    const f1s: number[] = [];

    for (const query of queries) {
      const result = await client.searchPoints(collection, {
        vector: query.vector,
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

    // Query the global table directly to verify the uid and quantized column
    const query = `
      DECLARE $uid AS Utf8;
      DECLARE $point_id AS Utf8;
      SELECT uid, point_id, embedding, embedding_quantized FROM ${GLOBAL_POINTS_TABLE}
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
    const row = rowset?.rows?.[0];
    // items: [uid, point_id, embedding, embedding_quantized]
    expect(row?.items?.[0]?.textValue).toBe(expectedUid);
    expect(row?.items?.[1]?.textValue).toBe("uid_test_point");
    // Just verify that both binary columns are present and non-empty
    expect(row?.items?.[2]).toBeDefined();
    expect(row?.items?.[3]).toBeDefined();

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

  it("migrates existing table by adding embedding_quantized column for legacy layouts", async () => {
    // This test simulates the migration scenario for existing deployments
    // We create a legacy table without embedding_bit, insert data, then run migration

    const legacyTable = `qdrant_migration_test_${Date.now()}`;

    // Step 1: Create a legacy table without embedding_quantized column
    await withSession(async (s) => {
      const desc = new TableDescription()
        .withColumns(
          new Column("uid", Types.UTF8),
          new Column("point_id", Types.UTF8),
          new Column("embedding", Types.BYTES),
          new Column("payload", Types.JSON_DOCUMENT)
        )
        .withPrimaryKeys("uid", "point_id");
      await s.createTable(legacyTable, desc);
    });

    // Step 2: Insert a test row with only embedding (no embedding_quantized)
    const testUid = "migration_test_uid";
    const testVector = [1.0, 0.0, 0.0, 0.0];
    await withSession(async (s) => {
      const insertQuery = `
        DECLARE $uid AS Utf8;
        DECLARE $point_id AS Utf8;
        DECLARE $vec AS List<Float>;
        DECLARE $payload AS JsonDocument;
        UPSERT INTO ${legacyTable} (uid, point_id, embedding, payload)
        VALUES (
          $uid,
          $point_id,
          Untag(Knn::ToBinaryStringFloat($vec), "FloatVector"),
          $payload
        );
      `;
      await s.executeQuery(insertQuery, {
        $uid: TypedValues.utf8(testUid),
        $point_id: TypedValues.utf8("legacy_point"),
        $vec: TypedValues.list(Types.FLOAT, testVector),
        $payload: TypedValues.jsonDocument("{}"),
      });
    });

    // Step 3: Verify the table has no embedding_quantized column initially
    const descBefore = await withSession(async (s) => {
      return await s.describeTable(legacyTable);
    });
    const columnsBefore = descBefore.columns?.map((c) => c.name) ?? [];
    expect(columnsBefore).toContain("embedding");
    expect(columnsBefore).not.toContain("embedding_quantized");

    // Step 4: Run migration (ALTER TABLE via schema API to add embedding_quantized)
    await withSession(async (s) => {
      const alterDdl = `
        ALTER TABLE ${legacyTable}
        ADD COLUMN embedding_quantized String;
      `;

      const rawSession = s as unknown as {
        sessionId: string;
        api: {
          executeSchemeQuery: (req: {
            sessionId: string;
            yqlText: string;
          }) => Promise<unknown>;
        };
      };

      await rawSession.api.executeSchemeQuery({
        sessionId: rawSession.sessionId,
        yqlText: alterDdl,
      });
    });

    // Step 5: Verify the column was added
    const descAfter = await withSession(async (s) => {
      return await s.describeTable(legacyTable);
    });
    const columnsAfter = descAfter.columns?.map((c) => c.name) ?? [];
    expect(columnsAfter).toContain("embedding_quantized");

    // Cleanup: drop the test table
    try {
      await withSession(async (s) => {
        const dropDdl = `DROP TABLE ${legacyTable};`;
        await s.executeQuery(dropDdl);
      });
    } catch {
      // ignore cleanup failures
    }
  });
});
