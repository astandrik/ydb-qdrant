import { withSession } from "../../../ydb/client.js";
import { buildVectorBinaryParams } from "../../../ydb/helpers.js";
import type { Query } from "@ydbjs/query";
import type { Value } from "@ydbjs/value";
import { Bytes, Uint32, Utf8 } from "@ydbjs/value/primitive";
import type { DistanceKind } from "../../../types";
import {
  mapDistanceToBitKnnFn,
  mapDistanceToKnnFn,
} from "../../../utils/distance.js";
import { buildPathSegmentsFilter } from "../PathSegmentsFilter.js";

type QueryParams = Record<string, Value>;

type SearchRow = { point_id: string; score: number; payload?: string };

function assertVectorDimension(
  vector: number[],
  dimension: number,
  messagePrefix = "Vector dimension mismatch"
): void {
  if (vector.length !== dimension) {
    throw new Error(
      `${messagePrefix}: got ${vector.length}, expected ${dimension}`
    );
  }
}

function parsePayloadJson(
  payloadText: unknown
): Record<string, unknown> | undefined {
  if (typeof payloadText !== "string" || payloadText.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(payloadText) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function buildApproxSearchParams(args: {
  queryVector: number[];
  top: number;
  uid: string;
  overfetchMultiplier: number;
  filterPaths?: Array<Array<string>>;
}): {
  params: QueryParams;
  filterWhereSql?: string;
} {
  const safeTop = args.top > 0 ? args.top : 1;
  const rawCandidateLimit = safeTop * args.overfetchMultiplier;
  const candidateLimit = Math.max(safeTop, rawCandidateLimit);

  const filter = buildPathSegmentsFilter(args.filterPaths);
  const binaries = buildVectorBinaryParams(args.queryVector);

  return {
    params: {
      ...(filter?.whereParams ?? {}),
      $qbin_bit: new Bytes(binaries.bit),
      $qbinf: new Bytes(binaries.float),
      $candidateLimit: new Uint32(candidateLimit),
      $safeTop: new Uint32(safeTop),
      $uid: new Utf8(args.uid),
    },
    filterWhereSql: filter?.whereSql,
  };
}

export async function searchPointsOneTableApproximate(args: {
  tableName: string;
  queryVector: number[];
  top: number;
  withPayload: boolean | undefined;
  distance: DistanceKind;
  dimension: number;
  uid: string;
  overfetchMultiplier: number;
  timeoutMs: number;
  filterPaths?: Array<Array<string>>;
}): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  assertVectorDimension(args.queryVector, args.dimension);

  return await withSession(async (sql, signal) => {
    const { fn, order } = mapDistanceToKnnFn(args.distance);
    const { fn: bitFn, order: bitOrder } = mapDistanceToBitKnnFn(args.distance);
    const { params, filterWhereSql } = buildApproxSearchParams({
      queryVector: args.queryVector,
      top: args.top,
      uid: args.uid,
      overfetchMultiplier: args.overfetchMultiplier,
      filterPaths: args.filterPaths,
    });

    type ResultSets = [SearchRow];

    let payloadColumn: ReturnType<typeof sql.unsafe>;
    if (args.withPayload) {
      payloadColumn = sql.unsafe(", payload");
    } else {
      payloadColumn = sql.unsafe("");
    }

    let filterClause: ReturnType<typeof sql.unsafe>;
    if (filterWhereSql) {
      filterClause = sql.unsafe(` AND ${filterWhereSql}`);
    } else {
      filterClause = sql.unsafe("");
    }

    const baseQuery: Query<ResultSets> = sql<ResultSets>`
      $candidates = (
        SELECT point_id
        FROM ${sql.identifier(args.tableName)}
        WHERE uid = $uid
          AND embedding_quantized IS NOT NULL${filterClause}
        ORDER BY ${sql.unsafe(
          bitFn
        )}(embedding_quantized, $qbin_bit) ${sql.unsafe(bitOrder)}
        LIMIT $candidateLimit
      );

      SELECT
        point_id${payloadColumn},
        ${sql.unsafe(fn)}(embedding, $qbinf) AS score
      FROM ${sql.identifier(args.tableName)}
      WHERE uid = $uid
        AND point_id IN $candidates${filterClause}
      ORDER BY score ${sql.unsafe(order)}
      LIMIT $safeTop;
    `;

    let q: Query<ResultSets> = baseQuery
      .idempotent(true)
      .timeout(args.timeoutMs)
      .signal(signal);
    for (const [key, value] of Object.entries(params)) {
      q = q.parameter(key, value);
    }

    const [rows] = await q;
    return rows.map((r) => {
      if (!r.point_id) {
        throw new Error("point_id is missing in YDB search result");
      }
      const payload = args.withPayload
        ? parsePayloadJson(r.payload)
        : undefined;
      return {
        id: r.point_id,
        score: Number(r.score),
        ...(payload ? { payload } : {}),
      };
    });
  });
}
