import type { Query } from "@ydbjs/query";
import { StatsMode } from "@ydbjs/api/query";
import {
  QUERY_RETRY_LOG_ENABLED,
  QUERY_STATS_MODE,
  QueryStatsMode,
} from "../config/env.js";
import { logger } from "../logging/logger.js";

type QueryDiagContext = Record<string, unknown> & {
  operation: string;
};

function mapStatsMode(mode: QueryStatsMode): StatsMode | null {
  if (mode === QueryStatsMode.Basic) return StatsMode.BASIC;
  if (mode === QueryStatsMode.Full) return StatsMode.FULL;
  if (mode === QueryStatsMode.Profile) return StatsMode.PROFILE;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickStatsSummary(stats: unknown): Record<string, unknown> {
  if (!isRecord(stats)) {
    return {};
  }
  const phase = stats.queryPhaseStats;
  if (!isRecord(phase)) {
    return {};
  }
  return {
    cpuTimeUs: phase.cpuTimeUs,
    durationUs: phase.durationUs,
  };
}

export function attachQueryDiagnostics<T extends unknown[]>(
  q: Query<T>,
  context: QueryDiagContext
): Query<T> {
  const statsMode = mapStatsMode(QUERY_STATS_MODE);
  let out: Query<T> = q;

  if (statsMode) {
    out = out.withStats(statsMode);
    out.on("stats", (stats: unknown) => {
      logger.info(
        {
          ...context,
          queryStatsMode: QUERY_STATS_MODE,
          ...pickStatsSummary(stats),
        },
        `${context.operation}: stats`
      );
    });
  }

  if (QUERY_RETRY_LOG_ENABLED) {
    out.on("retry", (ctx) => {
      logger.warn(
        {
          ...context,
          attempt: ctx.attempt,
          err:
            ctx.error instanceof Error
              ? ctx.error
              : new Error(String(ctx.error)),
        },
        `${context.operation}: retry`
      );
    });
  }

  return out;
}
