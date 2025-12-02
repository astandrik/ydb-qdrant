import { Types, TypedValues, withSession } from "../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { buildVectorParam } from "../ydb/helpers.js";
import type { DistanceKind } from "../types";
import { logger } from "../logging/logger.js";
import { notifyUpsert } from "../indexing/IndexScheduler.js";
import { VECTOR_INDEX_BUILD_ENABLED } from "../config/env.js";
import { mapDistanceToKnnFn } from "../utils/distance.js";
import { withRetry, isTransientYdbError } from "../utils/retry.js";
import { UPSERT_BATCH_SIZE } from "../ydb/schema.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };
export async function upsertPointsMultiTable(
  tableName: string,
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>,
  dimension: number
): Promise<number> {
  for (const p of points) {
    const id = String(p.id);
    if (p.vector.length !== dimension) {
      throw new Error(
        `Vector dimension mismatch for id=${id}: got ${p.vector.length}, expected ${dimension}`
      );
    }
  }

  let upserted = 0;

  await withSession(async (s) => {
    for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
      const batch = points.slice(i, i + UPSERT_BATCH_SIZE);

      const ddl = `
        DECLARE $rows AS List<Struct<
          point_id: Utf8,
          vec: List<Float>,
          payload: JsonDocument
        >>;

        UPSERT INTO ${tableName} (point_id, embedding, payload)
        SELECT
          point_id,
          Untag(Knn::ToBinaryStringFloat(vec), "FloatVector") AS embedding,
          payload
        FROM AS_TABLE($rows);
      `;

      const rowType = Types.struct({
        point_id: Types.UTF8,
        vec: Types.list(Types.FLOAT),
        payload: Types.JSON_DOCUMENT,
      });

      const rowsValue = TypedValues.list(
        rowType,
        batch.map((p) => ({
          point_id: String(p.id),
          vec: p.vector,
          payload: JSON.stringify(p.payload ?? {}),
        }))
      );

      const params: QueryParams = {
        $rows: rowsValue,
      };

      await withRetry(() => s.executeQuery(ddl, params), {
        isTransient: isTransientYdbError,
        context: { tableName, batchSize: batch.length },
      });
      upserted += batch.length;
    }
  });
  notifyUpsert(tableName, upserted);
  return upserted;
}

export async function searchPointsMultiTable(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  if (queryVector.length !== dimension) {
    throw new Error(
      `Vector dimension mismatch: got ${queryVector.length}, expected ${dimension}`
    );
  }
  const { fn, order } = mapDistanceToKnnFn(distance);
  const qf = buildVectorParam(queryVector);

  const params: QueryParams = {
    $qf: qf,
    $k2: TypedValues.uint32(top),
  };

  const buildQuery = (useIndex: boolean) => `
    DECLARE $qf AS List<Float>;
    DECLARE $k2 AS Uint32;
    $qbinf = Knn::ToBinaryStringFloat($qf);
    SELECT point_id, ${
      withPayload ? "payload, " : ""
    }${fn}(embedding, $qbinf) AS score
    FROM ${tableName}${useIndex ? " VIEW emb_idx" : ""}
    ORDER BY score ${order}
    LIMIT $k2;
  `;

  let rs;
  if (VECTOR_INDEX_BUILD_ENABLED) {
    try {
      rs = await withSession(async (s) => {
        return await s.executeQuery(buildQuery(true), params);
      });
      logger.info({ tableName }, "vector index found; using index for search");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const indexUnavailable =
        /not found|does not exist|no such index|no global index|is not ready to use/i.test(
          msg
        );
      if (indexUnavailable) {
        logger.info(
          { tableName },
          "vector index not available (missing or building); falling back to table scan"
        );
        rs = await withSession(async (s) => {
          return await s.executeQuery(buildQuery(false), params);
        });
      } else {
        throw e;
      }
    }
  } else {
    rs = await withSession(async (s) => {
      return await s.executeQuery(buildQuery(false), params);
    });
  }

  const rowset = rs.resultSets?.[0];
  const rows = (rowset?.rows ?? []) as Array<{
    items?: Array<
      | {
          textValue?: string;
          floatValue?: number;
        }
      | undefined
    >;
  }>;
  return rows.map((row) => {
    const id = row.items?.[0]?.textValue;
    if (typeof id !== "string") {
      throw new Error("point_id is missing in YDB search result");
    }
    let payload: Record<string, unknown> | undefined;
    let scoreIdx = 1;
    if (withPayload) {
      const payloadText = row.items?.[1]?.textValue;
      if (payloadText) {
        try {
          payload = JSON.parse(payloadText) as Record<string, unknown>;
        } catch {
          payload = undefined;
        }
      }
      scoreIdx = 2;
    }
    const score = Number(
      row.items?.[scoreIdx]?.floatValue ?? row.items?.[scoreIdx]?.textValue
    );
    return { id, score, ...(payload ? { payload } : {}) };
  });
}

export async function deletePointsMultiTable(
  tableName: string,
  ids: Array<string | number>
): Promise<number> {
  let deleted = 0;
  await withSession(async (s) => {
    for (const id of ids) {
      const yql = `
        DECLARE $id AS Utf8;
        DELETE FROM ${tableName} WHERE point_id = $id;
      `;
      const params: QueryParams = {
        $id: TypedValues.utf8(String(id)),
      };
      await s.executeQuery(yql, params);
      deleted += 1;
    }
  });
  return deleted;
}
