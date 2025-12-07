import {
  TypedValues,
  withSession,
  createExecuteQuerySettings,
  withStartupProbeSession,
  createExecuteQuerySettingsWithTimeout,
} from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { uidFor } from "../utils/tenant.js";
import {
  createCollectionOneTable,
  deleteCollectionOneTable,
} from "./collectionsRepo.one-table.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";

export async function createCollection(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType
): Promise<void> {
  await createCollectionOneTable(metaKey, dim, distance, vectorType);
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
    const settings = createExecuteQuerySettings();
    return await s.executeQuery(
      qry,
      {
        $collection: TypedValues.utf8(metaKey),
      },
      undefined,
      settings
    );
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

export async function verifyCollectionsQueryCompilationForStartup(): Promise<void> {
  const probeKey = "__startup_probe__/__startup_probe__";
  const qry = `
    DECLARE $collection AS Utf8;
    SELECT table_name, vector_dimension, distance, vector_type
    FROM qdr__collections
    WHERE collection = $collection;
  `;
  await withRetry(
    async () => {
      await withStartupProbeSession(async (s) => {
        const settings = createExecuteQuerySettingsWithTimeout({
          keepInCache: true,
          idempotent: true,
          timeoutMs: 3000,
        });
        await s.executeQuery(
          qry,
          {
            $collection: TypedValues.utf8(probeKey),
          },
          undefined,
          settings
        );
      });
    },
    {
      isTransient: isTransientYdbError,
      maxRetries: 2,
      baseDelayMs: 200,
      context: { probe: "collections_startup_compilation" },
    }
  );
}

export async function deleteCollection(
  metaKey: string,
  uid?: string
): Promise<void> {
  const meta = await getCollectionMeta(metaKey);
  if (!meta) return;

  let effectiveUid = uid;
  if (!effectiveUid) {
    const [tenant, collection] = metaKey.split("/", 2);
    if (!tenant || !collection) {
      throw new Error(
        `deleteCollection: cannot derive uid from malformed metaKey=${metaKey}`
      );
    }
    effectiveUid = uidFor(tenant, collection);
  }
  await deleteCollectionOneTable(metaKey, effectiveUid);
}
