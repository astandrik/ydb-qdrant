import {
  tableNameFor,
  type NormalizedCollectionContextLike,
} from "./CollectionService.shared.js";

export function resolvePointsTableAndUidMultiTable(
  ctx: NormalizedCollectionContextLike
): {
  tableName: string;
  uid: string | undefined;
} {
  return {
    tableName: tableNameFor(ctx.tenant, ctx.collection),
    uid: undefined,
  };
}


