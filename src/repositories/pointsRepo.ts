import type { DistanceKind } from "../types";
import {
  upsertPointsMultiTable,
  searchPointsMultiTable,
  deletePointsMultiTable,
} from "./pointsRepo.multi-table.js";
import {
  upsertPointsOneTable,
  searchPointsOneTable,
  deletePointsOneTable,
} from "./pointsRepo.one-table.js";

export async function upsertPoints(
  tableName: string,
  points: Array<{
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
  }>,
  dimension: number,
  uid?: string
): Promise<number> {
  if (uid) {
    return await upsertPointsOneTable(tableName, points, dimension, uid);
  }
  return await upsertPointsMultiTable(tableName, points, dimension);
}

export async function searchPoints(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number,
  uid?: string
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  if (uid) {
    return await searchPointsOneTable(
      tableName,
      queryVector,
      top,
      withPayload,
      distance,
      dimension,
      uid
    );
  }
  return await searchPointsMultiTable(
    tableName,
    queryVector,
    top,
    withPayload,
    distance,
    dimension
  );
}

export async function deletePoints(
  tableName: string,
  ids: Array<string | number>,
  uid?: string
): Promise<number> {
  if (uid) {
    return await deletePointsOneTable(tableName, ids, uid);
  }
  return await deletePointsMultiTable(tableName, ids);
}
