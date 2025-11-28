import type { DistanceKind, VectorType } from "../types.js";
import { COLLECTION_STORAGE_MODE, isOneTableMode } from "../config/env.js";
import {
  state,
  requestIndexBuildMultiTable,
} from "./IndexScheduler.multi-table.js";
import { requestIndexBuildOneTable } from "./IndexScheduler.one-table.js";

export function notifyUpsert(tableName: string, count: number = 1): void {
  const now = Date.now();
  const s = state[tableName] ?? {
    lastUpsertMs: 0,
    pending: false,
    pointsUpserted: 0,
  };
  s.lastUpsertMs = now;
  s.pointsUpserted += count;
  state[tableName] = s;
}

export function requestIndexBuild(
  tableName: string,
  dimension: number,
  distance: DistanceKind,
  vectorType: VectorType,
  opts?: { force?: boolean }
): void {
  if (isOneTableMode(COLLECTION_STORAGE_MODE)) {
    requestIndexBuildOneTable(tableName);
    return;
  }
  requestIndexBuildMultiTable(tableName, dimension, distance, vectorType, opts);
}
