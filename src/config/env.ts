import "dotenv/config";

export const YDB_ENDPOINT = process.env.YDB_ENDPOINT ?? "";
export const YDB_DATABASE = process.env.YDB_DATABASE ?? "";
export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
export const GLOBAL_POINTS_AUTOMIGRATE_ENABLED = parseBooleanEnv(
  process.env.YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE,
  false
);

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

export const VECTOR_INDEX_BUILD_ENABLED = parseBooleanEnv(
  process.env.VECTOR_INDEX_BUILD_ENABLED,
  false
);

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

export function isOneTableMode(
  mode: CollectionStorageMode
): mode is CollectionStorageMode.OneTable {
  return mode === CollectionStorageMode.OneTable;
}
