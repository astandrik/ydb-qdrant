import type { DistanceKind, UpsertPoint } from "../types.js";
import type { YdbQdrantScoredPoint } from "../qdrant/QdrantRestTypes.js";
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
} from "./pointsRepo.one-table.js";

export async function upsertPoints(
  tableName: string,
  points: UpsertPoint[],
  dimension: number,
  uid: string
): Promise<number> {
  return await upsertPointsOneTable(tableName, points, dimension, uid);
}

export async function searchPoints(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number,
  uid: string,
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
