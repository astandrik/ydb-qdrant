import type { DistanceKind, VectorType } from "../types.js";
import { TABLE_LAYOUT, isOneTableLayout } from "../config/env.js";
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
  if (isOneTableLayout(TABLE_LAYOUT)) {
    requestIndexBuildOneTable(tableName);
    return;
  }
  requestIndexBuildMultiTable(tableName, dimension, distance, vectorType, opts);
}
