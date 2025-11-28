import { TypedValues, withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { mapDistanceToIndexParam } from "../utils/distance.js";
import {
  COLLECTION_STORAGE_MODE,
  isOneTableMode,
  type CollectionStorageMode,
} from "../config/env.js";
import {
  createCollectionMultiTable,
  deleteCollectionMultiTable,
} from "./collectionsRepo.multi-table.js";
import {
  createCollectionOneTable,
  deleteCollectionOneTable,
} from "./collectionsRepo.one-table.js";

export async function createCollection(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType,
  tableName: string,
  layout: CollectionStorageMode = COLLECTION_STORAGE_MODE
): Promise<void> {
  if (isOneTableMode(layout)) {
    await createCollectionOneTable(
      metaKey,
      dim,
      distance,
      vectorType,
      tableName
    );
    return;
  }
  await createCollectionMultiTable(
    metaKey,
    dim,
    distance,
    vectorType,
    tableName
  );
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
  const row = rowset.rows[0] as {
    items?: Array<
      | {
          textValue?: string;
          uint32Value?: number;
        }
      | undefined
    >;
  };
  const table = row.items?.[0]?.textValue as string;
  const dimension = Number(
    row.items?.[1]?.uint32Value ?? row.items?.[1]?.textValue
  );
  const distance =
    (row.items?.[2]?.textValue as DistanceKind) ?? ("Cosine" as DistanceKind);
  const vectorType = (row.items?.[3]?.textValue as VectorType) ?? "float";
  return { table, dimension, distance, vectorType };
}

export async function deleteCollection(
  metaKey: string,
  uid?: string,
  layout: CollectionStorageMode = COLLECTION_STORAGE_MODE
): Promise<void> {
  const meta = await getCollectionMeta(metaKey);
  if (!meta) return;

  if (isOneTableMode(layout)) {
    if (!uid) {
      throw new Error(
        `deleteCollection: uid is required when using one_table layout (metaKey=${metaKey})`
      );
    }
    await deleteCollectionOneTable(metaKey, uid);
    return;
  }

  await deleteCollectionMultiTable(metaKey, meta.table);
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
    const rawSession = s as unknown as {
      sessionId: string;
      api: {
        executeSchemeQuery: (req: {
          sessionId: string;
          yqlText: string;
        }) => Promise<unknown>;
      };
    };
    try {
      const dropReq = { sessionId: rawSession.sessionId, yqlText: dropDdl };
      await rawSession.api.executeSchemeQuery(dropReq);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
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
    const createReq = { sessionId: rawSession.sessionId, yqlText: createDdl };
    await rawSession.api.executeSchemeQuery(createReq);
  });
}
