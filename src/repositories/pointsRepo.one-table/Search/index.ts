import type { DistanceKind } from "../../../types";
import { SearchMode, SEARCH_OPERATION_TIMEOUT_MS } from "../../../config/env.js";
import { searchPointsOneTableExact } from "./Exact.js";
import { searchPointsOneTableApproximate } from "./Approximate.js";

export async function searchPointsOneTable(
  tableName: string,
  queryVector: number[],
  top: number,
  withPayload: boolean | undefined,
  distance: DistanceKind,
  dimension: number,
  uid: string,
  mode: SearchMode | undefined,
  overfetchMultiplier: number,
  filterPaths?: Array<Array<string>>
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  if (mode === SearchMode.Exact) {
    return await searchPointsOneTableExact({
      tableName,
      queryVector,
      top,
      withPayload,
      distance,
      dimension,
      uid,
      timeoutMs: SEARCH_OPERATION_TIMEOUT_MS,
      filterPaths,
    });
  }

  return await searchPointsOneTableApproximate({
    tableName,
    queryVector,
    top,
    withPayload,
    distance,
    dimension,
    uid,
    overfetchMultiplier,
    timeoutMs: SEARCH_OPERATION_TIMEOUT_MS,
    filterPaths,
  });
}


