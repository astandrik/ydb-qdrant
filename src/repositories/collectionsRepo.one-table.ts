import { TypedValues, Types, withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { GLOBAL_POINTS_TABLE, ensureGlobalPointsTable } from "../ydb/schema.js";
import { upsertCollectionMeta } from "./collectionsRepo.shared.js";

const DELETE_COLLECTION_BATCH_SIZE = 1000;

function isOutOfBufferMemoryYdbError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (/Out of buffer memory/i.test(msg)) {
    return true;
  }

  if (typeof error === "object" && error !== null) {
    const issues = (error as { issues?: unknown }).issues;
    if (issues !== undefined) {
      const issuesText =
        typeof issues === "string" ? issues : JSON.stringify(issues);
      return /Out of buffer memory/i.test(issuesText);
    }
  }

  return false;
}

async function deletePointsForUidInChunks(
  s: {
    // Deliberately loose typing to accept YDB TableSession.executeQuery
    // without pulling in full SDK types here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeQuery: (...args: any[]) => Promise<unknown>;
  },
  uid: string
): Promise<void> {
  const selectYql = `
    DECLARE $uid AS Utf8;
    DECLARE $limit AS Uint32;
    SELECT point_id
    FROM ${GLOBAL_POINTS_TABLE}
    WHERE uid = $uid
    LIMIT $limit;
  `;

  const deleteBatchYql = `
    DECLARE $uid AS Utf8;
    DECLARE $ids AS List<Utf8>;
    DELETE FROM ${GLOBAL_POINTS_TABLE}
    WHERE uid = $uid AND point_id IN $ids;
  `;

  // Best‑effort loop: stop when there are no more rows for this uid.
  // Each iteration only touches a limited number of rows to avoid
  // hitting YDB's per‑operation buffer limits.
  while (true) {
    const rs = (await s.executeQuery(selectYql, {
      $uid: TypedValues.utf8(uid),
      $limit: TypedValues.uint32(DELETE_COLLECTION_BATCH_SIZE),
    })) as {
      resultSets?: Array<{
        rows?: unknown[];
      }>;
    };

    const rowset = rs.resultSets?.[0];
    const rows =
      (rowset?.rows as
        | Array<{
            items?: Array<{ textValue?: string } | undefined>;
          }>
        | undefined) ?? [];

    const ids = rows
      .map((row) => row.items?.[0]?.textValue)
      .filter((id): id is string => typeof id === "string");

    if (ids.length === 0) {
      break;
    }

    const idsValue = TypedValues.list(Types.list(Types.UTF8), ids);

    await s.executeQuery(deleteBatchYql, {
      $uid: TypedValues.utf8(uid),
      $ids: idsValue,
    });
  }
}

export async function createCollectionOneTable(
  metaKey: string,
  dim: number,
  distance: DistanceKind,
  vectorType: VectorType
): Promise<void> {
  await upsertCollectionMeta(
    metaKey,
    dim,
    distance,
    vectorType,
    GLOBAL_POINTS_TABLE
  );
}

export async function deleteCollectionOneTable(
  metaKey: string,
  uid: string
): Promise<void> {
  await ensureGlobalPointsTable();
  const deletePointsYql = `
    DECLARE $uid AS Utf8;
    DELETE FROM ${GLOBAL_POINTS_TABLE} WHERE uid = $uid;
  `;

  await withSession(async (s) => {
    try {
      await s.executeQuery(deletePointsYql, {
        $uid: TypedValues.utf8(uid),
      });
    } catch (err: unknown) {
      if (!isOutOfBufferMemoryYdbError(err)) {
        throw err;
      }

      await deletePointsForUidInChunks(s, uid);
    }
  });

  const delMeta = `
    DECLARE $collection AS Utf8;
    DELETE FROM qdr__collections WHERE collection = $collection;
  `;
  await withSession(async (s) => {
    await s.executeQuery(delMeta, {
      $collection: TypedValues.utf8(metaKey),
    });
  });
}
