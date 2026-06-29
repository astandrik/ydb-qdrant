import { type NormalizedCollectionContextLike } from "./CollectionService.shared.js";
import { GLOBAL_POINTS_TABLE, ensureGlobalPointsTable } from "../ydb/schema.js";

export async function resolvePointsTableAndUid(
    ctx: NormalizedCollectionContextLike
): Promise<{
    tableName: string;
    uid: string;
}> {
    await ensureGlobalPointsTable();
    return {
        tableName: GLOBAL_POINTS_TABLE,
        uid: ctx.uid,
    };
}
