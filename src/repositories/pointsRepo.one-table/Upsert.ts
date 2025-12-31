import {
  TypedValues,
  Types,
  withSession,
  Ydb as YdbRuntime,
  createBulkUpsertSettingsWithTimeout,
} from "../../ydb/client.js";
import { buildVectorBinaryParams } from "../../ydb/helpers.js";
import { withRetry, isTransientYdbError } from "../../utils/retry.js";
import { UPSERT_BATCH_SIZE } from "../../ydb/schema.js";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../../config/env.js";
import { logger } from "../../logging/logger.js";
import type { UpsertPoint } from "../../types.js";
import type { Ydb as YdbTypes } from "ydb-sdk";

function assertPointVectorsDimension(args: {
  tableName: string;
  uid: string;
  points: UpsertPoint[];
  dimension: number;
}): void {
  for (const p of args.points) {
    const id = String(p.id);
    if (p.vector.length !== args.dimension) {
      const previewLength = Math.min(16, p.vector.length);
      const vectorPreview =
        previewLength > 0 ? p.vector.slice(0, previewLength) : [];
      logger.warn(
        {
          tableName: args.tableName,
          uid: args.uid,
          pointId: id,
          vectorLen: p.vector.length,
          expectedDimension: args.dimension,
          vectorPreview,
        },
        "upsertPointsOneTable: vector dimension mismatch"
      );
      throw new Error(
        `Vector dimension mismatch for id=${id}: got ${p.vector.length}, expected ${args.dimension}`
      );
    }
  }
}

function buildBulkUpsertRowsValue(args: {
  uid: string;
  batch: Array<Pick<UpsertPoint, "id" | "vector" | "payload">>;
}): YdbTypes.ITypedValue {
  const rowType = Types.struct({
    uid: Types.UTF8,
    point_id: Types.UTF8,
    embedding: Types.BYTES,
    embedding_quantized: Types.BYTES,
    payload: Types.JSON_DOCUMENT,
  });

  return TypedValues.list(
    rowType,
    args.batch.map((p) => {
      const binaries = buildVectorBinaryParams(p.vector);
      return {
        uid: args.uid,
        point_id: String(p.id),
        embedding: binaries.float,
        embedding_quantized: binaries.bit,
        payload: JSON.stringify(p.payload ?? {}),
      };
    })
  );
}

export async function upsertPointsOneTable(
  tableName: string,
  points: UpsertPoint[],
  dimension: number,
  uid: string
): Promise<number> {
  if (!tableName) {
    throw new Error("bulkUpsert: tableName is empty");
  }
  assertPointVectorsDimension({ tableName, uid, points, dimension });

  let upserted = 0;

  await withSession(async (s) => {
    const bulkSettings = createBulkUpsertSettingsWithTimeout({
      timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
    });

    for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
      const batch = points.slice(i, i + UPSERT_BATCH_SIZE);

      const rowsValue = buildBulkUpsertRowsValue({
        uid,
        batch,
      });

      if (logger.isLevelEnabled("debug")) {
        logger.debug(
          {
            tableName,
            mode: "one_table_bulk_upsert_client_side_serialization",
            batchSize: batch.length,
            params: {
              rows: batch.map((p) => ({
                uid,
                point_id: String(p.id),
                vectorLength: p.vector.length,
                vectorPreview: p.vector.slice(0, 3),
                payload: p.payload ?? {},
              })),
            },
          },
          "one_table upsert: executing BulkUpsert"
        );
      }

      const typedRows = YdbRuntime.TypedValue.create(rowsValue);
      await withRetry(() => s.bulkUpsert(tableName, typedRows, bulkSettings), {
        isTransient: isTransientYdbError,
        context: { tableName, batchSize: batch.length, mode: "bulkUpsert" },
      });
      upserted += batch.length;
    }
  });
  return upserted;
}
