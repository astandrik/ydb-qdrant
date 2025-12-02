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

export enum CollectionStorageMode {
  MultiTable = "multi_table",
  OneTable = "one_table",
}

function resolveCollectionStorageModeEnv(): CollectionStorageMode {
  const explicit =
    process.env.YDB_QDRANT_COLLECTION_STORAGE_MODE ??
    process.env.YDB_QDRANT_TABLE_LAYOUT;
  if (explicit?.trim().toLowerCase() === CollectionStorageMode.OneTable) {
    return CollectionStorageMode.OneTable;
  }
  return CollectionStorageMode.MultiTable;
}

export const COLLECTION_STORAGE_MODE: CollectionStorageMode =
  resolveCollectionStorageModeEnv();

export const GLOBAL_POINTS_AUTOMIGRATE_ENABLED = parseBooleanEnv(
  process.env.YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE,
  false
);

export const VECTOR_INDEX_BUILD_ENABLED = parseBooleanEnv(
  process.env.VECTOR_INDEX_BUILD_ENABLED,
  COLLECTION_STORAGE_MODE === CollectionStorageMode.MultiTable
);

export function isOneTableMode(
  mode: CollectionStorageMode
): mode is CollectionStorageMode.OneTable {
  return mode === CollectionStorageMode.OneTable;
}

export enum SearchMode {
  Exact = "exact",
  Approximate = "approximate",
}

function resolveSearchModeEnv(mode: CollectionStorageMode): SearchMode {
  const raw = process.env.YDB_QDRANT_SEARCH_MODE;
  const normalized = raw?.trim().toLowerCase();

  if (normalized === SearchMode.Exact) {
    return SearchMode.Exact;
  }
  if (normalized === SearchMode.Approximate) {
    return SearchMode.Approximate;
  }

  // Default: keep current behavior for one-table (approximate two-phase search).
  if (isOneTableMode(mode)) {
    return SearchMode.Approximate;
  }

  // For multi-table, this value is currently unused but defaults to approximate.
  return SearchMode.Approximate;
}

export const SEARCH_MODE: SearchMode = resolveSearchModeEnv(
  COLLECTION_STORAGE_MODE
);

export const OVERFETCH_MULTIPLIER = parseIntegerEnv(
  process.env.YDB_QDRANT_OVERFETCH_MULTIPLIER,
  10,
  { min: 1 }
);

export const CLIENT_SIDE_SERIALIZATION_ENABLED = parseBooleanEnv(
  process.env.YDB_QDRANT_CLIENT_SIDE_SERIALIZATION_ENABLED,
  false
);
