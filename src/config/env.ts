import "dotenv/config";

export const YDB_ENDPOINT = process.env.YDB_ENDPOINT ?? "";
export const YDB_DATABASE = process.env.YDB_DATABASE ?? "";
export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
export const INDEX_REBUILD_ON_UPSERT =
  process.env.INDEX_REBUILD_ON_UPSERT === "1";
export const APPROX_PRESELECT = process.env.APPROX_PRESELECT
  ? Math.max(1, Math.min(5000, Number(process.env.APPROX_PRESELECT)))
  : 1000;
