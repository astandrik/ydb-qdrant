import type { UpsertPoint } from "../qdrant/Requests.js";
import type {
    DistanceKind,
    YdbQdrantScoredPoint,
} from "../qdrant/QdrantRestTypes.js";
import {
    SEARCH_MODE,
    OVERFETCH_MULTIPLIER,
    type SearchMode,
} from "../config/env.js";
import {
    upsertPointsOneTable,
    searchPointsOneTable,
    deletePointsOneTable,
    deletePointsByPathSegmentsOneTable,
    retrievePointsByIdsOneTable,
} from "./pointsRepo.one-table.js";
import type { RetrievedPoint } from "./pointsRepo.one-table/Retrieve.js";

export async function upsertPoints(
    tableName: string,
    points: UpsertPoint[],
    dimension: number,
    uid: string,
    apiKey: string
): Promise<number> {
    return await upsertPointsOneTable(tableName, points, dimension, uid, apiKey);
}

export async function searchPoints(
    tableName: string,
    queryVector: number[],
    top: number,
    withPayload: boolean | undefined,
    distance: DistanceKind,
    dimension: number,
    uid: string,
    apiKey: string,
    filterPaths?: Array<Array<string>>
): Promise<YdbQdrantScoredPoint[]> {
    const mode: SearchMode | undefined = SEARCH_MODE;
    return await searchPointsOneTable(
        tableName,
        queryVector,
        top,
        withPayload,
        distance,
        dimension,
        uid,
        mode,
        OVERFETCH_MULTIPLIER,
        apiKey,
        filterPaths
    );
}

export async function deletePoints(
    tableName: string,
    ids: Array<string | number>,
    uid: string
): Promise<number> {
    return await deletePointsOneTable(tableName, ids, uid);
}

export async function deletePointsByPathSegments(
    tableName: string,
    uid: string,
    paths: Array<Array<string>>
): Promise<number> {
    return await deletePointsByPathSegmentsOneTable(tableName, uid, paths);
}

export async function retrievePointsByIds(
    tableName: string,
    ids: Array<string | number>,
    uid: string,
    apiKey: string,
    withPayload: boolean
): Promise<RetrievedPoint[]> {
    return await retrievePointsByIdsOneTable(tableName, ids, uid, apiKey, withPayload);
}
