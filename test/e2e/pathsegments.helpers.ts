import {
    assertOkResponse,
    deletePointsReq,
    upsertPointsReq,
    type JsonObject,
    DEFAULT_API_KEY,
} from "./helpers.js";
import {
    Types,
    TypedValues,
    createExecuteQuerySettings,
    withSession,
} from "../../src/ydb/client.js";
import { normalizeCollectionContextShared } from "../../src/services/CollectionService.shared.js";
import { pathSegmentsToPrefix } from "../../src/utils/pathPrefix.js";
import { expandPathPrefixes } from "../../src/utils/prefixExpansion.js";
import { deriveUserUidFromApiKey } from "../../src/utils/tenant.js";
import {
    GLOBAL_POINTS_TABLE,
    POINTS_BY_FILE_LOOKUP_TABLE,
} from "../../src/ydb/schema.js";

function resolveE2eCollectionUid(args: {
    apiKey?: string;
    collection: string;
    userAgent: string;
}): string {
    const userUid = deriveUserUidFromApiKey(args.apiKey ?? DEFAULT_API_KEY);
    return normalizeCollectionContextShared(
        userUid,
        args.collection,
        args.userAgent
    ).uid;
}

function readRowTextValue(
    row: { items?: Array<Record<string, unknown> | undefined> },
    index: number
): string | undefined {
    const value = row.items?.[index];
    return typeof value?.textValue === "string" ? value.textValue : undefined;
}

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function bigintToSafeNumberOrNull(value: bigint): number | null {
    if (value > MAX_SAFE_BIGINT || value < -MAX_SAFE_BIGINT) {
        return null;
    }
    return Number(value);
}

function longLikeToBigInt(value: {
    low: number;
    high: number;
    unsigned?: boolean;
}): bigint {
    const low = BigInt(value.low >>> 0);
    const high = BigInt(value.high >>> 0);
    let result = low + (high << 32n);

    const isUnsigned = value.unsigned === true;
    const signBitSet = (value.high & 0x8000_0000) !== 0;
    if (!isUnsigned && signBitSet) {
        result -= 1n << 64n;
    }

    return result;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "bigint") {
        return bigintToSafeNumberOrNull(value);
    }
    if (typeof value === "string") {
        if (/^-?\d+$/.test(value.trim())) {
            try {
                return bigintToSafeNumberOrNull(BigInt(value.trim()));
            } catch {
                return null;
            }
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (value && typeof value === "object") {
        const longLike = value as {
            low?: unknown;
            high?: unknown;
            unsigned?: unknown;
        };
        if (
            typeof longLike.low === "number" &&
            typeof longLike.high === "number"
        ) {
            return bigintToSafeNumberOrNull(
                longLikeToBigInt({
                    low: longLike.low,
                    high: longLike.high,
                    unsigned: longLike.unsigned === true,
                })
            );
        }
    }
    return null;
}

function readRowNumberValue(
    row: { items?: Array<Record<string, unknown> | undefined> },
    index: number
): number {
    const value = row.items?.[index];
    const candidates: unknown[] = [
        value?.uint64Value,
        value?.int64Value,
        value?.uint32Value,
        value?.int32Value,
        value?.doubleValue,
        value?.textValue,
    ];
    for (const candidate of candidates) {
        const parsed = toNumber(candidate);
        if (parsed !== null) {
            return parsed;
        }
    }
    throw new Error(`Expected numeric value at column ${index}`);
}

export async function listPrefixesForPoint(args: {
    apiKey?: string;
    collection: string;
    pointId: string;
    userAgent: string;
}): Promise<string[]> {
    const qry = `
    DECLARE $collection AS Utf8;
    DECLARE $point_id AS Utf8;
    SELECT path_prefix
    FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection AND point_id = $point_id
    LIMIT 1;
  `;

    const result = await withSession(async (session) => {
        const settings = createExecuteQuerySettings();
        return await session.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(
                    resolveE2eCollectionUid(args)
                ),
                $point_id: TypedValues.utf8(args.pointId),
            },
            undefined,
            settings
        );
    });

    const rows = result.resultSets?.[0]?.rows ?? [];
    const pathPrefix = rows
        .map((row) =>
            readRowTextValue(
                row as { items?: Array<Record<string, unknown> | undefined> },
                0
            )
        )
        .find((prefix): prefix is string => typeof prefix === "string");

    return pathPrefix ? expandPathPrefixes(pathPrefix) : [];
}

export async function listLookupRowsForPoint(args: {
    apiKey?: string;
    collection: string;
    pointId: string;
    userAgent: string;
}): Promise<string[]> {
    const qry = `
    DECLARE $collection AS Utf8;
    DECLARE $point_id AS Utf8;
    SELECT file_path
    FROM ${POINTS_BY_FILE_LOOKUP_TABLE}
    WHERE collection = $collection AND point_id = $point_id
    ORDER BY file_path;
  `;

    const result = await withSession(async (session) => {
        const settings = createExecuteQuerySettings();
        return await session.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(
                    resolveE2eCollectionUid(args)
                ),
                $point_id: TypedValues.utf8(args.pointId),
            },
            undefined,
            settings
        );
    });

    const rows = result.resultSets?.[0]?.rows ?? [];
    return rows
        .map((row) =>
            readRowTextValue(
                row as { items?: Array<Record<string, unknown> | undefined> },
                0
            )
        )
        .filter((filePath): filePath is string => typeof filePath === "string");
}

export async function deleteLookupRowsForPoint(args: {
    apiKey?: string;
    collection: string;
    pointId: string;
    userAgent: string;
}): Promise<void> {
    const qry = `
    DECLARE $collection AS Utf8;
    DECLARE $point_id AS Utf8;

    $rows = (
      SELECT collection, file_path, point_id
      FROM ${POINTS_BY_FILE_LOOKUP_TABLE}
      WHERE collection = $collection AND point_id = $point_id
    );

    DELETE FROM ${POINTS_BY_FILE_LOOKUP_TABLE} ON
    SELECT collection, file_path, point_id FROM $rows;
  `;

    await withSession(async (session) => {
        const settings = createExecuteQuerySettings();
        await session.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(
                    resolveE2eCollectionUid(args)
                ),
                $point_id: TypedValues.utf8(args.pointId),
            },
            undefined,
            settings
        );
    });
}

export async function listPrefixesForPoints(args: {
    apiKey?: string;
    collection: string;
    pointIds: string[];
    userAgent: string;
}): Promise<Record<string, string[]>> {
    const prefixesByPointId = Object.fromEntries(
        args.pointIds.map((pointId) => [pointId, [] as string[]])
    );
    if (args.pointIds.length === 0) {
        return prefixesByPointId;
    }

    const qry = `
    DECLARE $collection AS Utf8;
    DECLARE $point_ids AS List<Utf8>;
    SELECT point_id, path_prefix
    FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection AND point_id IN $point_ids
    ORDER BY point_id;
  `;

    const result = await withSession(async (session) => {
        const settings = createExecuteQuerySettings();
        return await session.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(
                    resolveE2eCollectionUid(args)
                ),
                $point_ids: TypedValues.list(Types.UTF8, args.pointIds),
            },
            undefined,
            settings
        );
    });

    const rows = result.resultSets?.[0]?.rows ?? [];
    for (const row of rows) {
        const typedRow = row as {
            items?: Array<Record<string, unknown> | undefined>;
        };
        const pointId = readRowTextValue(typedRow, 0);
        const prefix = readRowTextValue(typedRow, 1);
        if (typeof pointId !== "string" || typeof prefix !== "string") {
            continue;
        }
        const prefixes = prefixesByPointId[pointId];
        if (prefixes) {
            prefixes.push(...expandPathPrefixes(prefix));
        }
    }

    return prefixesByPointId;
}

export async function countDistinctPointsForPrefixSubtree(args: {
    apiKey?: string;
    collection: string;
    pathSegments: string[];
    userAgent: string;
}): Promise<number> {
    const prefix = pathSegmentsToPrefix(args.pathSegments);
    const descendantPrefix = `${prefix}/`;
    const qry = `
    DECLARE $collection AS Utf8;
    DECLARE $prefix AS Utf8;
    DECLARE $descendant_prefix AS Utf8;
    SELECT COUNT(DISTINCT point_id)
    FROM ${GLOBAL_POINTS_TABLE}
    WHERE collection = $collection
      AND (path_prefix = $prefix OR StartsWith(path_prefix, $descendant_prefix));
  `;

    const result = await withSession(async (session) => {
        const settings = createExecuteQuerySettings();
        return await session.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(
                    resolveE2eCollectionUid(args)
                ),
                $prefix: TypedValues.utf8(prefix),
                $descendant_prefix: TypedValues.utf8(descendantPrefix),
            },
            undefined,
            settings
        );
    });

    const firstRow = result.resultSets?.[0]?.rows?.[0] as
        | { items?: Array<Record<string, unknown> | undefined> }
        | undefined;
    if (!firstRow) {
        return 0;
    }
    return readRowNumberValue(firstRow, 0);
}

export type E2ePoint = {
    id: string;
    vector: [number, number, number, number];
    payload: {
        label: string;
        pathSegments: string[];
    };
};

export function buildPathPoints(args: {
    idPrefix: string;
    count: number;
    vector: [number, number, number, number];
    baseSegments: string[];
    labelPrefix: string;
    extension?: string;
}): E2ePoint[] {
    const extension = args.extension ?? ".ts";
    return Array.from({ length: args.count }, (_, index) => {
        const item = String(index).padStart(4, "0");
        return {
            id: `${args.idPrefix}-${item}`,
            vector: args.vector,
            payload: {
                label: `${args.labelPrefix}-${item}`,
                pathSegments: [
                    ...args.baseSegments,
                    `${args.labelPrefix}-${item}${extension}`,
                ],
            },
        };
    });
}

export function buildMixedDepthPathPoints(args: {
    idPrefix: string;
    count: number;
    vector: [number, number, number, number];
    baseSegments: string[];
    labelPrefix: string;
    variants: string[][];
    extension?: string;
    groupSize?: number;
}): E2ePoint[] {
    if (args.variants.length === 0) {
        throw new Error("buildMixedDepthPathPoints requires at least one variant");
    }

    const extension = args.extension ?? ".ts";
    const groupSize = args.groupSize ?? 25;

    return Array.from({ length: args.count }, (_, index) => {
        const item = String(index).padStart(4, "0");
        const variantIndex = index % args.variants.length;
        const groupIndex = Math.floor(index / groupSize);
        const variantSegments = args.variants[variantIndex] ?? [];
        const groupSegment = `group-${String(groupIndex).padStart(4, "0")}`;

        return {
            id: `${args.idPrefix}-${item}`,
            vector: args.vector,
            payload: {
                label: `${args.labelPrefix}-${item}`,
                pathSegments: [
                    ...args.baseSegments,
                    ...variantSegments,
                    groupSegment,
                    `${args.labelPrefix}-${item}${extension}`,
                ],
            },
        };
    });
}

export async function upsertPointsInChunks(args: {
    baseUrl: string;
    collection: string;
    points: E2ePoint[];
    headers?: Record<string, string>;
    chunkSize?: number;
    context: string;
}): Promise<void> {
    const chunkSize = args.chunkSize ?? 250;
    for (let index = 0; index < args.points.length; index += chunkSize) {
        const chunk = args.points.slice(index, index + chunkSize);
        const upsert = await upsertPointsReq(
            args.baseUrl,
            args.collection,
            chunk as JsonObject[],
            args.headers
        );
        assertOkResponse(
            upsert.response,
            upsert.body,
            `${args.context}: batch ${Math.floor(index / chunkSize) + 1}`
        );
    }
}

function buildPathDeleteFilter(paths: string[][]): Record<string, unknown> {
    if (paths.length === 1) {
        return {
            must:
                paths[0]?.map((value, index) => ({
                    key: `pathSegments.${index}`,
                    match: { value },
                })) ?? [],
        };
    }

    return {
        should: paths.map((pathSegments) => ({
            must: pathSegments.map((value, index) => ({
                key: `pathSegments.${index}`,
                match: { value },
            })),
        })),
    };
}

export async function deletePointsByPathsInChunks(args: {
    baseUrl: string;
    collection: string;
    paths: string[][];
    headers?: Record<string, string>;
    chunkSize?: number;
    context: string;
}): Promise<void> {
    const chunkSize = args.chunkSize ?? 100;
    for (let index = 0; index < args.paths.length; index += chunkSize) {
        const chunk = args.paths.slice(index, index + chunkSize);
        const del = await deletePointsReq(
            args.baseUrl,
            args.collection,
            {
                filter: buildPathDeleteFilter(chunk),
            },
            args.headers
        );
        assertOkResponse(
            del.response,
            del.body,
            `${args.context}: batch ${Math.floor(index / chunkSize) + 1}`
        );
    }
}
