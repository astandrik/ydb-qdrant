import {
  TypedValues,
  Types,
  withSession,
  createExecuteQuerySettingsWithTimeout,
} from "../../ydb/client.js";
import { buildVectorBinaryParams } from "../../ydb/helpers.js";
import { withRetry, isTransientYdbError } from "../../utils/retry.js";
import { UPSERT_BATCH_SIZE } from "../../ydb/schema.js";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../../config/env.js";
import { logger } from "../../logging/logger.js";
import type { Ydb } from "ydb-sdk";

type QueryParams = { [key: string]: Ydb.ITypedValue };

function assertPointVectorsDimension(args: {
  tableName: string;
  uid: string;
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>;
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

function buildUpsertQueryAndParams(args: {
  tableName: string;
  uid: string;
  batch: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>;
}): { ddl: string; params: QueryParams; debugMode: string } {
  const ddl = `
          DECLARE $rows AS List<Struct<
            uid: Utf8,
            point_id: Utf8,
            embedding: String,
            embedding_quantized: String,
            payload: JsonDocument
          >>;

          UPSERT INTO ${args.tableName} (uid, point_id, embedding, embedding_quantized, payload)
          SELECT
            uid,
            point_id,
            embedding,
            embedding_quantized,
            payload
          FROM AS_TABLE($rows);
        `;

  const rowType = Types.struct({
    uid: Types.UTF8,
    point_id: Types.UTF8,
    embedding: Types.BYTES,
    embedding_quantized: Types.BYTES,
    payload: Types.JSON_DOCUMENT,
  });

  const rowsValue = TypedValues.list(
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

  return {
    ddl,
    params: { $rows: rowsValue },
    debugMode: "one_table_upsert_client_side_serialization",
  };
}

export async function upsertPointsOneTable(
  tableName: string,
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>,
  dimension: number,
  uid: string
): Promise<number> {
  assertPointVectorsDimension({ tableName, uid, points, dimension });

  let upserted = 0;

  await withSession(async (s) => {
    const settings = createExecuteQuerySettingsWithTimeout({
      keepInCache: true,
      idempotent: true,
      timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
    });
    for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
      const batch = points.slice(i, i + UPSERT_BATCH_SIZE);

      const { ddl, params, debugMode } = buildUpsertQueryAndParams({
        tableName,
        uid,
        batch,
      });

      if (logger.isLevelEnabled("debug")) {
        logger.debug(
          {
            tableName,
            mode: debugMode,
            batchSize: batch.length,
            yql: ddl,
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
          "one_table upsert: executing YQL"
        );
      }

      await withRetry(() => s.executeQuery(ddl, params, undefined, settings), {
        isTransient: isTransientYdbError,
        context: { tableName, batchSize: batch.length },
      });
      upserted += batch.length;
    }
  });
  return upserted;
}
