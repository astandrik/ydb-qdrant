import {
    Types,
    TypedValues,
    withSession,
    createExecuteQuerySettingsWithTimeout,
} from "../../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import type { DistanceKind, Payload } from "../../qdrant/QdrantRestTypes.js";
import { mapDistanceToKnnFn } from "../../utils/distance.js";
import { vectorToFloatBinary } from "../../utils/vectorBinary.js";
import { logger } from "../../logging/logger.js";
import { SEARCH_OPERATION_TIMEOUT_MS } from "../../config/env.js";
import { buildPrefixPathSegmentsFilter } from "./PathSegmentsFilter.js";
import type { YdbQdrantScoredPoint } from "../../qdrant/QdrantRestTypes.js";
import { computePayloadSign } from "../../utils/PayloadSign.js";
import {
    isComputePoolEnabled,
    isComputePoolQueueAtLimitError,
    runVerifySearchRows,
} from "../../compute/ComputePool.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };

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

function typedBytesOrFallback(value: Buffer): Ydb.ITypedValue {
    const typedValuesCompat = TypedValues as unknown as {
        bytes?: (v: Buffer) => Ydb.ITypedValue;
        fromNative?: (type: unknown, v: unknown) => Ydb.ITypedValue;
    };

    if (typeof typedValuesCompat.bytes === "function") {
        return typedValuesCompat.bytes(value);
    }

    if (typeof typedValuesCompat.fromNative === "function") {
        return typedValuesCompat.fromNative(Types.BYTES, value);
    }

    throw new Error(
        "ydb-sdk does not support constructing BYTES typed parameters (TypedValues.bytes/fromNative missing); cannot execute vector search"
    );
}

function parseSearchRows(
    rows: Array<{
        items?: Array<
            | {
                  textValue?: string;
                  floatValue?: number;
              }
            | undefined
        >;
    }>,
    args: {
        collection: string;
        apiKey: string;
        withPayload: boolean | undefined;
    }
): YdbQdrantScoredPoint[] {
    const apiKey = args.apiKey.trim();

    const out: YdbQdrantScoredPoint[] = [];

    for (const row of rows) {
        const id = row.items?.[0]?.textValue;
        if (typeof id !== "string") {
            throw new Error("point_id is missing in YDB search result");
        }

        const payloadText = row.items?.[1]?.textValue;
        const payloadSign = row.items?.[2]?.textValue;

        let payload: Payload | undefined;
        if (payloadText) {
            try {
                payload = JSON.parse(payloadText) as Payload;
            } catch {
                payload = undefined;
            }
        }

        if (!payload || typeof payloadSign !== "string" || payloadSign === "") {
            logger.warn(
                { collection: args.collection, pointId: id },
                "payload signature mismatch: missing payload or signature"
            );
            continue;
        }

        const expected = computePayloadSign({ apiKey, payload });
        if (expected !== payloadSign) {
            logger.warn(
                { collection: args.collection, pointId: id },
                "payload signature mismatch: dropping point from search results"
            );
            continue;
        }

        const scoreIdx = 3;
        const score = Number(
            row.items?.[scoreIdx]?.floatValue ??
                row.items?.[scoreIdx]?.textValue
        );

        const shouldReturnPayload = args.withPayload === true;
        out.push({
            id,
            score,
            ...(shouldReturnPayload && payload ? { payload } : {}),
        });
    }

    return out;
}

async function parseSearchRowsWithWorkers(
    rows: Array<{
        items?: Array<
            | {
                  textValue?: string;
                  floatValue?: number;
              }
            | undefined
        >;
    }>,
    args: {
        collection: string;
        apiKey: string;
        withPayload: boolean | undefined;
    }
): Promise<YdbQdrantScoredPoint[]> {
    const taskRows = rows.map((row) => {
        const id = row.items?.[0]?.textValue;
        if (typeof id !== "string") {
            throw new Error("point_id is missing in YDB search result");
        }

        const payloadText = row.items?.[1]?.textValue;
        const payloadSign = row.items?.[2]?.textValue;

        const scoreIdx = 3;
        const scoreFloat = row.items?.[scoreIdx]?.floatValue;
        const scoreText = row.items?.[scoreIdx]?.textValue;

        return {
            pointId: id,
            payloadText,
            payloadSign,
            scoreFloat,
            scoreText,
        };
    });

    const result = await runVerifySearchRows({
        collection: args.collection,
        apiKey: args.apiKey,
        withPayload: args.withPayload,
        rows: taskRows,
    });

    for (const d of result.dropped) {
        if (d.reason === "missing_payload_or_signature") {
            logger.warn(
                { collection: args.collection, pointId: d.pointId },
                "payload signature mismatch: missing payload or signature"
            );
            continue;
        }
        logger.warn(
            { collection: args.collection, pointId: d.pointId },
            "payload signature mismatch: dropping point from search results"
        );
    }

    return result.points;
}

async function parseSearchRowsMaybeWithWorkers(
    rows: Array<{
        items?: Array<
            | {
                  textValue?: string;
                  floatValue?: number;
              }
            | undefined
        >;
    }>,
    args: {
        collection: string;
        apiKey: string;
        withPayload: boolean | undefined;
    }
): Promise<YdbQdrantScoredPoint[]> {
    if (!isComputePoolEnabled()) {
        return parseSearchRows(rows, args);
    }
    try {
        return await parseSearchRowsWithWorkers(rows, args);
    } catch (err: unknown) {
        if (!isComputePoolQueueAtLimitError(err)) {
            throw err;
        }
        // Backpressure: fall back to inline compute to avoid failing the request.
        return parseSearchRows(rows, args);
    }
}

function buildExactSearchQueryAndParams(args: {
    tableName: string;
    queryVector: number[];
    top: number;
    distance: DistanceKind;
    collection: string;
    filterPaths?: Array<Array<string>>;
}): { yql: string; params: QueryParams; modeLog: string } {
    const { fn, order } = mapDistanceToKnnFn(args.distance);
    const filter = buildPrefixPathSegmentsFilter(args.filterPaths, "path_prefix");
    const filterWhere = filter ? ` AND ${filter.whereSql}` : "";

    const qbinf = vectorToFloatBinary(args.queryVector);
    const yql = `
        DECLARE $qbinf AS String;
        DECLARE $k AS Uint32;
        DECLARE $collection AS Utf8;
        ${filter?.whereParamDeclarations ?? ""}
        SELECT point_id, payload, payload_sign, ${fn}(embedding, $qbinf) AS score
        FROM ${args.tableName}
        WHERE collection = $collection${filterWhere}
        ORDER BY score ${order}
        LIMIT $k;
      `;

    const params: QueryParams = {
        ...(filter?.whereParams ?? {}),
        $qbinf: typedBytesOrFallback(qbinf),
        $k: TypedValues.uint32(args.top),
        $collection: TypedValues.utf8(args.collection),
    };

    return {
        yql,
        params,
        modeLog: "one_table_exact_client_side_serialization",
    };
}

async function searchPointsOneTableExact(
    tableName: string,
    queryVector: number[],
    top: number,
    withPayload: boolean | undefined,
    apiKey: string,
    distance: DistanceKind,
    dimension: number,
    collection: string,
    filterPaths?: Array<Array<string>>
): Promise<YdbQdrantScoredPoint[]> {
    assertVectorDimension(queryVector, dimension);

    const results = await withSession(async (s) => {
        const { yql, params, modeLog } = buildExactSearchQueryAndParams({
            tableName,
            queryVector,
            top,
            distance,
            collection,
            filterPaths,
        });

        if (logger.isLevelEnabled("debug")) {
            logger.debug(
                {
                    tableName,
                    distance,
                    top,
                    withPayload,
                    mode: modeLog,
                    yql,
                    params: {
                        collection,
                        top,
                        vectorLength: queryVector.length,
                        vectorPreview: queryVector.slice(0, 3),
                    },
                },
                "one_table search (exact): executing YQL"
            );
        }

        const settings = createExecuteQuerySettingsWithTimeout({
            keepInCache: true,
            idempotent: true,
            timeoutMs: SEARCH_OPERATION_TIMEOUT_MS,
        });
        const rs = await s.executeQuery(yql, params, undefined, settings);
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

        return await parseSearchRowsMaybeWithWorkers(rows, {
            collection,
            withPayload,
            apiKey,
        });
    });

    return results;
}

export async function searchPointsOneTable(
    tableName: string,
    queryVector: number[],
    top: number,
    withPayload: boolean | undefined,
    distance: DistanceKind,
    dimension: number,
    collection: string,
    apiKey: string,
    filterPaths?: Array<Array<string>>
): Promise<YdbQdrantScoredPoint[]> {
    return await searchPointsOneTableExact(
        tableName,
        queryVector,
        top,
        withPayload,
        apiKey,
        distance,
        dimension,
        collection,
        filterPaths
    );
}
