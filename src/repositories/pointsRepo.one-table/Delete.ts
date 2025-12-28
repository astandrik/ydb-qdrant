import { withSession } from "../../ydb/client.js";
import { buildPathSegmentsWhereClause } from "./PathSegmentsFilter.js";
import type { Query } from "@ydbjs/query";
import type { Value } from "@ydbjs/value";
import { Uint32, Utf8 } from "@ydbjs/value/primitive";
import { withRetry, isTransientYdbError } from "../../utils/retry.js";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../../config/env.js";

const DELETE_FILTER_SELECT_BATCH_SIZE = 1000;

export async function deletePointsOneTable(
  tableName: string,
  ids: Array<string | number>,
  uid: string
): Promise<number> {
  let deleted = 0;
  await withSession(async (sql, signal) => {
    for (const id of ids) {
      const yql = `
        DELETE FROM ${tableName} WHERE uid = $uid AND point_id = $id;
      `;

      await withRetry(
        async () => {
          await sql`${sql.unsafe(yql)}`
            .parameter("uid", new Utf8(uid))
            .parameter("id", new Utf8(String(id)))
            .idempotent(true)
            .timeout(UPSERT_OPERATION_TIMEOUT_MS)
            .signal(signal);
        },
        {
          isTransient: isTransientYdbError,
          context: {
            operation: "deletePointsOneTable",
            tableName,
            uid,
            pointId: String(id),
          },
        }
      );
      deleted += 1;
    }
  });
  return deleted;
}

function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function deletePointsByPathSegmentsOneTable(
  tableName: string,
  uid: string,
  paths: Array<Array<string>>
): Promise<number> {
  if (paths.length === 0) {
    return 0;
  }

  const { whereSql, params: whereParams } = buildPathSegmentsWhereClause(paths);

  const deleteBatchYql = `
    $to_delete = (
      SELECT uid, point_id
      FROM ${tableName}
      WHERE uid = $uid AND ${whereSql}
      LIMIT $limit
    );

    DELETE FROM ${tableName} ON
    SELECT uid, point_id FROM $to_delete;

    SELECT COUNT(*) AS deleted FROM $to_delete;
  `;

  let deleted = 0;
  await withSession(async (sql, signal) => {
    type DeleteCountRow = { deleted: unknown };
    type ResultSets = [DeleteCountRow];

    // Best-effort loop: stop when there are no more matching rows.
    // Use limited batches to avoid per-operation buffer limits.
    while (true) {
      const [rows] = await withRetry(
        async () => {
          let q: Query<ResultSets> = sql<ResultSets>`${sql.unsafe(
            deleteBatchYql
          )}`
            .idempotent(true)
            .timeout(UPSERT_OPERATION_TIMEOUT_MS)
            .signal(signal)
            .parameter("uid", new Utf8(uid))
            .parameter("limit", new Uint32(DELETE_FILTER_SELECT_BATCH_SIZE));

          for (const [key, value] of Object.entries(
            whereParams as Record<string, Value>
          )) {
            q = q.parameter(key, value);
          }

          return await q;
        },
        {
          isTransient: isTransientYdbError,
          context: {
            operation: "deletePointsByPathSegmentsOneTable",
            tableName,
            uid,
            batchLimit: DELETE_FILTER_SELECT_BATCH_SIZE,
            pathsCount: paths.length,
          },
        }
      );
      const batchDeleted = toCount(rows[0]?.deleted);
      if (batchDeleted <= 0) {
        break;
      }
      deleted += batchDeleted;
    }
  });

  return deleted;
}
