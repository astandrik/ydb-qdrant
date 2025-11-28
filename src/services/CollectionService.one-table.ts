import {
  uidFor,
  type NormalizedCollectionContextLike,
} from "./CollectionService.shared.js";
import { GLOBAL_POINTS_TABLE } from "../ydb/schema.js";

export function resolvePointsTableAndUidOneTable(
  ctx: NormalizedCollectionContextLike
): {
  tableName: string;
  uid: string | undefined;
} {
  return {
    tableName: GLOBAL_POINTS_TABLE,
    uid: uidFor(ctx.tenant, ctx.collection),
  };
}


