import type { UpsertPoint } from "../qdrant/Requests.js";
import type {
    DistanceKind,
    YdbQdrantScoredPoint,
} from "../qdrant/QdrantRestTypes.js";
import {
    upsertPoints as upsertPointsFromStorage,
    searchPoints as searchPointsFromStorage,
    deletePoints as deletePointsFromStorage,
    deletePointsByPathSegments as deletePointsByPathSegmentsFromStorage,
    retrievePointsByIds as retrievePointsByIdsFromStorage,
} from "./pointsRepo.storage.js";
import type { RetrievedPoint } from "./pointsRepo.storage/Retrieve.js";

export async function upsertPoints(
    tableName: string,
    points: UpsertPoint[],
    dimension: number,
    uid: string,
    apiKey: string
): Promise<number> {
    return await upsertPointsFromStorage(
        tableName,
        points,
        dimension,
        uid,
        apiKey
    );
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
    return await searchPointsFromStorage(
        tableName,
        queryVector,
        top,
        withPayload,
        distance,
        dimension,
        uid,
        apiKey,
        filterPaths
    );
}

export async function deletePoints(
    tableName: string,
    ids: Array<string | number>,
    uid: string
): Promise<number> {
    return await deletePointsFromStorage(tableName, ids, uid);
}

export async function deletePointsByPathSegments(
    tableName: string,
    uid: string,
    paths: Array<Array<string>>
): Promise<number> {
    return await deletePointsByPathSegmentsFromStorage(tableName, uid, paths);
}

export async function retrievePointsByIds(
    tableName: string,
    ids: Array<string | number>,
    uid: string,
    apiKey: string,
    withPayload: boolean
): Promise<RetrievedPoint[]> {
    return await retrievePointsByIdsFromStorage(
        tableName,
        ids,
        uid,
        apiKey,
        withPayload
    );
}
