import { TypedValues, withSession, createExecuteQuerySettings } from "../../ydb/client.js";
import { withRetry, isTransientYdbError } from "../../utils/retry.js";
import type { Ydb } from "ydb-sdk";
import { buildPathSegmentsWhereClause } from "./PathSegmentsFilter.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };

const DELETE_FILTER_SELECT_BATCH_SIZE = 1000;

export async function deletePointsOneTable(
  tableName: string,
  ids: Array<string | number>,
  uid: string
): Promise<number> {
  let deleted = 0;
  await withSession(async (s) => {
    const settings = createExecuteQuerySettings();
    for (const id of ids) {
      const yql = `
        DECLARE $uid AS Utf8;
        DECLARE $id AS Utf8;
        DELETE FROM ${tableName} WHERE uid = $uid AND point_id = $id;
      `;
      const params: QueryParams = {
        $uid: TypedValues.utf8(uid),
        $id: TypedValues.utf8(String(id)),
      };

      await withRetry(() => s.executeQuery(yql, params, undefined, settings), {
        isTransient: isTransientYdbError,
        context: { tableName, uid, pointId: String(id) },
      });
      deleted += 1;
    }
  });
  return deleted;
}

type Cell = {
  uint64Value?: unknown;
  int64Value?: unknown;
  uint32Value?: unknown;
  int32Value?: unknown;
  textValue?: string;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === "object") {
    // ydb-sdk may return Uint64/Int64 as protobufjs Long-like objects:
    // { low: number, high: number, unsigned?: boolean }
    const v = value as { low?: unknown; high?: unknown };
    if (typeof v.low === "number" && typeof v.high === "number") {
      const low = BigInt(v.low >>> 0);
      const high = BigInt(v.high >>> 0);
      const n = Number(low + (high << 32n));
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

function readDeletedCountFromResult(rs: {
  resultSets?: Array<{
    rows?: unknown[];
  }>;
}): number {
  const sets = rs.resultSets ?? [];
  for (let i = sets.length - 1; i >= 0; i -= 1) {
    const rowset = sets[i];
    const rows =
      (rowset?.rows as
        | Array<{
            items?: Array<Cell | undefined>;
          }>
        | undefined) ?? [];
    const cell = rows[0]?.items?.[0];
    if (!cell) continue;

    const candidates: unknown[] = [
      cell.uint64Value,
      cell.int64Value,
      cell.uint32Value,
      cell.int32Value,
      cell.textValue,
    ];
    for (const c of candidates) {
      const n = toNumber(c);
      if (n !== null) return n;
    }
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

  const whereParamDeclarations = Object.keys(whereParams)
    .sort()
    .map((key) => `DECLARE ${key} AS Utf8;`)
    .join("\n    ");

  const deleteBatchYql = `
    DECLARE $uid AS Utf8;
    DECLARE $limit AS Uint32;
    ${whereParamDeclarations}

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
  await withSession(async (s) => {
    const settings = createExecuteQuerySettings();
    // Best-effort loop: stop when there are no more matching rows.
    // Use limited batches to avoid per-operation buffer limits.
    while (true) {
      const rs = (await withRetry(
        () =>
          s.executeQuery(
            deleteBatchYql,
            {
              ...whereParams,
              $uid: TypedValues.utf8(uid),
              $limit: TypedValues.uint32(DELETE_FILTER_SELECT_BATCH_SIZE),
            },
            undefined,
            settings
          ),
        {
          isTransient: isTransientYdbError,
          context: {
            tableName,
            uid,
            filterPathsCount: paths.length,
            batchLimit: DELETE_FILTER_SELECT_BATCH_SIZE,
          },
        }
      )) as {
        resultSets?: Array<{
          rows?: unknown[];
        }>;
      };

      const batchDeleted = readDeletedCountFromResult(rs);
      if (batchDeleted <= 0) {
        break;
      }
      deleted += batchDeleted;
    }
  });

  return deleted;
}


