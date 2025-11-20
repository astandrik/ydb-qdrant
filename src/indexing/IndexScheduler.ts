import type { DistanceKind, VectorType } from "../types.js";
import { buildVectorIndex } from "../repositories/collectionsRepo.js";
import { logger } from "../logging/logger.js";

type CollectionKey = string; // table name

const QUIET_MS = 10000; // no upserts for 10s => build
const MIN_POINTS_THRESHOLD = 100; // only rebuild if at least this many points upserted

const state: Record<
  CollectionKey,
  {
    lastUpsertMs: number;
    timer?: NodeJS.Timeout;
    pending: boolean;
    pointsUpserted: number;
  }
> = {};

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
  const s = state[tableName] ?? {
    lastUpsertMs: 0,
    pending: false,
    pointsUpserted: 0,
  };
  state[tableName] = s;

  if (opts?.force) {
    logger.info({ tableName }, "index build (force) starting");
    void buildVectorIndex(tableName, dimension, distance, vectorType)
      .then(() => {
        logger.info({ tableName }, "index build (force) completed");
        s.pointsUpserted = 0;
      })
      .catch((err: unknown) => {
        logger.error({ err, tableName }, "index build (force) failed");
      });
    return;
  }

  if (s.pending && s.timer) {
    // already scheduled; timer will check quiet window
    return;
  }

  s.pending = true;
  s.timer = setTimeout(function tryBuild() {
    const since = Date.now() - (state[tableName]?.lastUpsertMs ?? 0);
    if (since < QUIET_MS) {
      s.timer = setTimeout(tryBuild, QUIET_MS - since);
      return;
    }
    const pointsCount = state[tableName]?.pointsUpserted ?? 0;
    if (pointsCount < MIN_POINTS_THRESHOLD) {
      logger.info(
        { tableName, pointsCount, threshold: MIN_POINTS_THRESHOLD },
        "index build skipped (below threshold)"
      );
      s.pending = false;
      s.timer = undefined;
      return;
    }
    logger.info({ tableName, pointsCount }, "index build (scheduled) starting");
    void buildVectorIndex(tableName, dimension, distance, vectorType)
      .then(() => {
        logger.info({ tableName }, "index build (scheduled) completed");
        state[tableName].pointsUpserted = 0;
      })
      .catch((err: unknown) =>
        logger.error({ err, tableName }, "index build (scheduled) failed")
      )
      .finally(() => {
        s.pending = false;
        s.timer = undefined;
      });
  }, QUIET_MS);
}
