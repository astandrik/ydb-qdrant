import { UPSERT_OPERATION_TIMEOUT_MS } from "../config/env.js";
import {
    TypedValues,
    Types,
    withSession,
    createExecuteQuerySettingsWithTimeout,
} from "../ydb/client.js";
import type { DistanceKind, VectorType } from "../qdrant/QdrantRestTypes.js";

export async function upsertCollectionMeta(
    metaKey: string,
    dim: number,
    distance: DistanceKind,
    vectorType: VectorType,
    tableName: string,
    userUid?: string
): Promise<void> {
    const now = new Date();
    const upsertMeta = `
    DECLARE $collection AS Utf8;
    DECLARE $table AS Utf8;
    DECLARE $dim AS Uint32;
    DECLARE $distance AS Utf8;
    DECLARE $vtype AS Utf8;
    DECLARE $created AS Timestamp;
    DECLARE $last_accessed AS Timestamp;
    DECLARE $user_uid AS Optional<Utf8>;
    UPSERT INTO qdr__collections (collection, table_name, vector_dimension, distance, vector_type, created_at, last_accessed_at, user_uid)
    VALUES ($collection, $table, $dim, $distance, $vtype, $created, $last_accessed, $user_uid);
  `;
    const userUidValue =
        userUid && userUid.trim().length > 0
            ? TypedValues.optional(TypedValues.utf8(userUid))
            : TypedValues.optionalNull(Types.UTF8);
    await withSession(async (s) => {
        const settings = createExecuteQuerySettingsWithTimeout({
            keepInCache: true,
            idempotent: true,
            timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
        });

        await s.executeQuery(
            upsertMeta,
            {
                $collection: TypedValues.utf8(metaKey),
                $table: TypedValues.utf8(tableName),
                $dim: TypedValues.uint32(dim),
                $distance: TypedValues.utf8(distance),
                $vtype: TypedValues.utf8(vectorType),
                $created: TypedValues.timestamp(now),
                $last_accessed: TypedValues.timestamp(now),
                $user_uid: userUidValue,
            },
            undefined,
            settings
        );
    });
}
