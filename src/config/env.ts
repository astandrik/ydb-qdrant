import "dotenv/config";

export const YDB_ENDPOINT = process.env.YDB_ENDPOINT ?? "";
export const YDB_DATABASE = process.env.YDB_DATABASE ?? "";
export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
export const APPROX_PRESELECT = process.env.APPROX_PRESELECT
  ? Math.max(1, Math.min(5000, Number(process.env.APPROX_PRESELECT)))
  : 1000;

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
