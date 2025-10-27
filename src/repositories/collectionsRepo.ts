import {
  Types,
  TypedValues,
  withSession,
  TableDescription,
  Column,
} from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { withSession as _withSession } from "../ydb/client.js";

export async function createCollection(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string
): Promise<void> {
  await withSession(async (s) => {
    const desc = new TableDescription()
      .withColumns(
        new Column("point_id", Types.UTF8),
        new Column("embedding", Types.BYTES),
        new Column("payload", Types.JSON_DOCUMENT)
      )
      .withPrimaryKey("point_id");
    await s.createTable(tableName, desc);
  });

  const upsertMeta = `
    DECLARE $collection AS Utf8;
    DECLARE $table AS Utf8;
    DECLARE $dim AS Uint32;
    DECLARE $distance AS Utf8;
    DECLARE $vtype AS Utf8;
    DECLARE $created AS Timestamp;
    UPSERT INTO qdr__collections (collection, table_name, vector_dimension, distance, vector_type, created_at)
    VALUES ($collection, $table, $dim, $distance, $vtype, $created);
  `;
  await withSession(async (s) => {
    await s.executeQuery(upsertMeta, {
      $collection: TypedValues.utf8(metaKey),
      $table: TypedValues.utf8(tableName),
      $dim: TypedValues.uint32(dim),
      $distance: TypedValues.utf8(distance),
      $vtype: TypedValues.utf8(vectorType),
      $created: TypedValues.timestamp(new Date()),
    });
  });
}

export async function getCollectionMeta(metaKey: string): Promise<{
  table: string;
  dimension: number;
  distance: DistanceKind;
  vectorType: VectorType;
} | null> {
  const qry = `
    DECLARE $collection AS Utf8;
    SELECT table_name, vector_dimension, distance, vector_type
    FROM qdr__collections
    WHERE collection = $collection;
  `;
  const res = await withSession(async (s) => {
    return await s.executeQuery(qry, {
      $collection: TypedValues.utf8(metaKey),
    });
  });
  const rowset = res.resultSets?.[0];
  if (!rowset || rowset.rows?.length !== 1) return null;
  const row = rowset.rows[0] as any;
  const table = row.items?.[0]?.textValue as string;
  const dimension = Number(
    row.items?.[1]?.uint32Value ?? row.items?.[1]?.textValue
  );
  const distance =
    (row.items?.[2]?.textValue as DistanceKind) ?? ("Cosine" as DistanceKind);
  const vectorType = (row.items?.[3]?.textValue as VectorType) ?? "float";
  return { table, dimension, distance, vectorType };
}

export async function deleteCollection(metaKey: string): Promise<void> {
  const meta = await getCollectionMeta(metaKey);
  if (!meta) return;
  await withSession(async (s) => {
    await s.dropTable(meta.table);
  });
  const delMeta = `
    DECLARE $collection AS Utf8;
    DELETE FROM qdr__collections WHERE collection = $collection;
  `;
  await withSession(async (s) => {
    await s.executeQuery(delMeta, { $collection: TypedValues.utf8(metaKey) });
  });
}

export async function buildVectorIndex(
  tableName: string,
  dimension: number,
  distance: DistanceKind,
  vectorType: VectorType
): Promise<void> {
  const distParam = mapDistanceToIndexParam(distance);
  // defaults for <100k vectors
  const levels = 1;
  const clusters = 128;

  await withSession(async (s) => {
    // Drop existing index if present
    const dropDdl = `ALTER TABLE ${tableName} DROP INDEX emb_idx;`;
    try {
      const dropReq = { sessionId: (s as any).sessionId, yqlText: dropDdl };
      await (s as any).api.executeSchemeQuery(dropReq);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      // ignore if index doesn't exist
      if (!/not found|does not exist|no such index/i.test(msg)) {
        throw e;
      }
    }

    // Create new index
    const createDdl = `
      ALTER TABLE ${tableName}
      ADD INDEX emb_idx GLOBAL SYNC USING vector_kmeans_tree
      ON (embedding)
      WITH (
        ${
          distParam === "inner_product"
            ? `similarity="inner_product"`
            : `distance="${distParam}"`
        },
        vector_type="${vectorType}",
        vector_dimension=${dimension},
        clusters=${clusters},
        levels=${levels}
      );
    `;
    const createReq = { sessionId: (s as any).sessionId, yqlText: createDdl };
    await (s as any).api.executeSchemeQuery(createReq);
  });
}

function mapDistanceToIndexParam(distance: DistanceKind): string {
  switch (distance) {
    case "Cosine":
      return "cosine";
    case "Dot":
      return "inner_product";
    case "Euclid":
      return "euclidean";
    case "Manhattan":
      return "manhattan";
    default:
      return "cosine";
  }
}
