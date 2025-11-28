import { TypedValues, withSession } from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../types";
import { GLOBAL_POINTS_TABLE } from "../ydb/schema.js";
import { upsertCollectionMeta } from "./collectionsRepo.shared.js";

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
  const deletePointsYql = `
    DECLARE $uid AS Utf8;
    DELETE FROM ${GLOBAL_POINTS_TABLE} WHERE uid = $uid;
  `;
  await withSession(async (s) => {
    await s.executeQuery(deletePointsYql, {
      $uid: TypedValues.utf8(uid),
    });
  });

  const delMeta = `
    DECLARE $collection AS Utf8;
    DELETE FROM qdr__collections WHERE collection = $collection;
  `;
  await withSession(async (s) => {
    await s.executeQuery(delMeta, { $collection: TypedValues.utf8(metaKey) });
  });
}
