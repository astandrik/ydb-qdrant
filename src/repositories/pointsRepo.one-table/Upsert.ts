import { getAbortErrorCause, isTimeoutAbortError } from "../../ydb/client.js";
import { buildVectorBinaryParams } from "../../ydb/helpers.js";
import { UPSERT_BATCH_SIZE } from "../../ydb/schema.js";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../../config/env.js";
import { logger } from "../../logging/logger.js";
import { withRetry, isTransientYdbError } from "../../utils/retry.js";
import { bulkUpsertRowsOnce } from "../../ydb/bulkUpsert.js";
import { Bytes, JsonDocument, Utf8 } from "@ydbjs/value/primitive";
import { List } from "@ydbjs/value/list";
import { Struct } from "@ydbjs/value/struct";
import type { QdrantPointStructDense } from "../../qdrant/QdrantTypes.js";

type UpsertRow = {
  uid: Utf8;
  point_id: Utf8;
  embedding: Bytes;
  embedding_quantized: Bytes;
  payload: JsonDocument;
};

function assertPointVectorsDimension(args: {
  tableName: string;
  uid: string;
  points: QdrantPointStructDense[];
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
  batch: QdrantPointStructDense[];
}): {
  rowsValue: List;
} {
  const rows: UpsertRow[] = args.batch.map((p) => {
    const binaries = buildVectorBinaryParams(p.vector);
    return {
      uid: new Utf8(args.uid),
      point_id: new Utf8(String(p.id)),
      embedding: new Bytes(binaries.float),
      embedding_quantized: new Bytes(binaries.bit),
      payload: new JsonDocument(JSON.stringify(p.payload ?? {})),
    };
  });

  const rowsValue = new List(
    ...rows.map(
      (row) =>
        new Struct({
          uid: row.uid,
          point_id: row.point_id,
          embedding: row.embedding,
          embedding_quantized: row.embedding_quantized,
          payload: row.payload,
        })
    )
  );

  return {
    rowsValue,
  };
}

export async function upsertPointsOneTable(
  tableName: string,
  points: QdrantPointStructDense[],
  dimension: number,
  uid: string
): Promise<number> {
  assertPointVectorsDimension({ tableName, uid, points, dimension });

  let upserted = 0;

  for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
    const batch = points.slice(i, i + UPSERT_BATCH_SIZE);

    const { rowsValue } = buildUpsertQueryAndParams({
      tableName,
      uid,
      batch,
    });

    await withRetry(
      async () => {
        const startedAtMs = Date.now();
        try {
          await bulkUpsertRowsOnce({
            tableName,
            rowsValue,
            timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
          });
        } catch (err: unknown) {
          const durationMs = Date.now() - startedAtMs;
          if (err instanceof Error && err.name === "AbortError") {
            logger.warn(
              {
                tableName,
                uid,
                batchStart: i,
                batchSize: batch.length,
                timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
                durationMs,
                err,
                errCause: getAbortErrorCause(err),
                isTimeout: isTimeoutAbortError(err),
              },
              "upsertPointsOneTable: BulkUpsert aborted"
            );
          }
          throw err;
        }
      },
      {
        isTransient: isTransientYdbError,
        context: {
          operation: "upsertPointsOneTable",
          tableName,
          uid,
          batchStart: i,
          batchSize: batch.length,
        },
      }
    );
    upserted += batch.length;
  }
  return upserted;
}
