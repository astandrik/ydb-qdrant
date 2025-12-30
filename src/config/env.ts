import "dotenv/config";

export const YDB_ENDPOINT = process.env.YDB_ENDPOINT ?? "";
export const YDB_DATABASE = process.env.YDB_DATABASE ?? "";
export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

function parseIntegerEnv(
  value: string | undefined,
  defaultValue: number,
  opts?: { min?: number; max?: number }
): number {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }
  let result = parsed;
  if (opts?.min !== undefined && result < opts.min) {
    result = opts.min;
  }
  if (opts?.max !== undefined && result > opts.max) {
    result = opts.max;
  }
  return result;
}

function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "" ||
    normalized === "0" ||
    normalized === "false" ||
    normalized === "no" ||
    normalized === "off"
  ) {
    return false;
  }
  return true;
}

export const USE_BATCH_DELETE_FOR_COLLECTIONS = parseBooleanEnv(
  process.env.YDB_QDRANT_USE_BATCH_DELETE,
  false
);

export enum SearchMode {
  Exact = "exact",
  Approximate = "approximate",
}

export function resolveSearchMode(raw: string | undefined): SearchMode {
  const normalized = raw?.trim().toLowerCase();

  if (normalized === SearchMode.Exact) {
    return SearchMode.Exact;
  }
  if (normalized === SearchMode.Approximate) {
    return SearchMode.Approximate;
  }

  // Default: exact search (single-phase over full-precision embedding) for the one-table layout.
  return SearchMode.Exact;
}

function resolveSearchModeEnv(): SearchMode {
  return resolveSearchMode(process.env.YDB_QDRANT_SEARCH_MODE);
}

export const SEARCH_MODE: SearchMode = resolveSearchModeEnv();

export const OVERFETCH_MULTIPLIER = parseIntegerEnv(
  process.env.YDB_QDRANT_OVERFETCH_MULTIPLIER,
  10,
  { min: 1 }
);

export const UPSERT_BATCH_SIZE = parseIntegerEnv(
  process.env.YDB_QDRANT_UPSERT_BATCH_SIZE,
  100,
  { min: 1 }
);

// Session pool configuration
const RAW_SESSION_POOL_MIN_SIZE = parseIntegerEnv(
  process.env.YDB_SESSION_POOL_MIN_SIZE,
  5,
  { min: 1, max: 500 }
);

const RAW_SESSION_POOL_MAX_SIZE = parseIntegerEnv(
  process.env.YDB_SESSION_POOL_MAX_SIZE,
  100,
  { min: 1, max: 500 }
);

const NORMALIZED_SESSION_POOL_MIN_SIZE =
  RAW_SESSION_POOL_MIN_SIZE > RAW_SESSION_POOL_MAX_SIZE
    ? RAW_SESSION_POOL_MAX_SIZE
    : RAW_SESSION_POOL_MIN_SIZE;

export const SESSION_POOL_MIN_SIZE = NORMALIZED_SESSION_POOL_MIN_SIZE;
export const SESSION_POOL_MAX_SIZE = RAW_SESSION_POOL_MAX_SIZE;

export const SESSION_KEEPALIVE_PERIOD_MS = parseIntegerEnv(
  process.env.YDB_SESSION_KEEPALIVE_PERIOD_MS,
  5000,
  { min: 1000, max: 60000 }
);

export const STARTUP_PROBE_SESSION_TIMEOUT_MS = parseIntegerEnv(
  process.env.YDB_QDRANT_STARTUP_PROBE_SESSION_TIMEOUT_MS,
  5000,
  { min: 1000 }
);

export const UPSERT_OPERATION_TIMEOUT_MS = parseIntegerEnv(
  process.env.YDB_QDRANT_UPSERT_TIMEOUT_MS,
  5000,
  { min: 1000 }
);

export const SEARCH_OPERATION_TIMEOUT_MS = parseIntegerEnv(
  process.env.YDB_QDRANT_SEARCH_TIMEOUT_MS,
  10000,
  { min: 1000 }
);

export const LAST_ACCESS_MIN_WRITE_INTERVAL_MS = parseIntegerEnv(
  process.env.YDB_QDRANT_LAST_ACCESS_MIN_WRITE_INTERVAL_MS,
  60000,
  { min: 1000 }
);
