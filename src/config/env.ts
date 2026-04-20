import "dotenv/config";
import { parseBooleanEnv, parseIntegerEnv } from "../utils/EnvParsers.js";

export const YDB_QDRANT_ENDPOINT = process.env.YDB_QDRANT_ENDPOINT?.trim() ?? "";
export const YDB_QDRANT_DATABASE = process.env.YDB_QDRANT_DATABASE?.trim() ?? "";

const LEGACY_YDB_ENDPOINT = process.env.YDB_ENDPOINT?.trim() ?? "";
const LEGACY_YDB_DATABASE = process.env.YDB_DATABASE?.trim() ?? "";

if (LEGACY_YDB_ENDPOINT || LEGACY_YDB_DATABASE) {
    throw new Error(
        [
            "Legacy env vars YDB_ENDPOINT/YDB_DATABASE are not supported by ydb-qdrant.",
            "Reason: ydb-sdk uses process.env.YDB_ENDPOINT as a dev-only override that forces all discovered endpoints to that host, breaking discovery and potentially causing session hangs/timeouts.",
            "Fix: set YDB_QDRANT_ENDPOINT and YDB_QDRANT_DATABASE instead.",
        ].join(" ")
    );
}

export const YDB_ENDPOINT = YDB_QDRANT_ENDPOINT;
export const YDB_DATABASE = YDB_QDRANT_DATABASE;

if (!YDB_ENDPOINT || !YDB_DATABASE) {
    throw new Error(
        [
            "Missing YDB connection settings.",
            "Set YDB_QDRANT_ENDPOINT (grpc(s)://host:port) and YDB_QDRANT_DATABASE (/path/to/db).",
            "Legacy YDB_ENDPOINT/YDB_DATABASE are not supported.",
        ].join(" ")
    );
}
export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

export const UPSERT_BATCH_SIZE = parseIntegerEnv(
    process.env.YDB_QDRANT_UPSERT_BATCH_SIZE,
    100,
    { min: 1 }
);

export const DELETE_FILTER_SELECT_BATCH_SIZE = parseIntegerEnv(
    process.env.YDB_QDRANT_DELETE_FILTER_SELECT_BATCH_SIZE,
    10000,
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

export const YDB_SESSION_RETRY_MAX_RETRIES = parseIntegerEnv(
    process.env.YDB_SESSION_RETRY_MAX_RETRIES,
    3,
    { min: 0, max: 50 }
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

const RAW_UPSERT_BODY_TIMEOUT_MS =
    process.env.YDB_QDRANT_UPSERT_BODY_TIMEOUT_MS?.trim();

export const UPSERT_BODY_TIMEOUT_MS =
    RAW_UPSERT_BODY_TIMEOUT_MS === "0"
        ? 0
        : parseIntegerEnv(RAW_UPSERT_BODY_TIMEOUT_MS, 60000, {
              min: 1000,
          });

const RAW_UPSERT_HTTP_TIMEOUT_MS =
    process.env.YDB_QDRANT_UPSERT_HTTP_TIMEOUT_MS?.trim();

export const UPSERT_HTTP_TIMEOUT_MS =
    RAW_UPSERT_HTTP_TIMEOUT_MS === "0"
        ? 0
        : parseIntegerEnv(RAW_UPSERT_HTTP_TIMEOUT_MS, 10000, {
              min: 1000,
          });

export const SEARCH_OPERATION_TIMEOUT_MS = parseIntegerEnv(
    process.env.YDB_QDRANT_SEARCH_TIMEOUT_MS,
    10000,
    { min: 1000 }
);

export const TABLE_SESSION_TIMEOUT_MS = parseIntegerEnv(
    process.env.YDB_QDRANT_SESSION_TIMEOUT_MS,
    30000,
    { min: 5000, max: 120000 }
);

export const LAST_ACCESS_MIN_WRITE_INTERVAL_MS = parseIntegerEnv(
    process.env.YDB_QDRANT_LAST_ACCESS_MIN_WRITE_INTERVAL_MS,
    60000,
    { min: 1000 }
);

export const WORKERS_ENABLED = parseBooleanEnv(
    process.env.YDB_QDRANT_WORKERS_ENABLED,
    false
);

const RAW_WORKERS_MIN_THREADS = parseIntegerEnv(
    process.env.YDB_QDRANT_WORKERS_MIN_THREADS,
    0,
    { min: 0, max: 512 }
);

const RAW_WORKERS_MAX_THREADS = parseIntegerEnv(
    process.env.YDB_QDRANT_WORKERS_MAX_THREADS,
    1,
    { min: 1, max: 512 }
);

export const WORKERS_MAX_THREADS = RAW_WORKERS_MAX_THREADS;
export const WORKERS_MIN_THREADS =
    RAW_WORKERS_MIN_THREADS > RAW_WORKERS_MAX_THREADS
        ? RAW_WORKERS_MAX_THREADS
        : RAW_WORKERS_MIN_THREADS;

export const WORKERS_IDLE_TIMEOUT_MS = parseIntegerEnv(
    process.env.YDB_QDRANT_WORKERS_IDLE_TIMEOUT_MS,
    10000,
    { min: 0, max: 600000 }
);

export const WORKERS_MAX_QUEUE:
    | number
    | "auto"
    | undefined = (() => {
    const raw = process.env.YDB_QDRANT_WORKERS_MAX_QUEUE?.trim().toLowerCase();
    if (!raw) {
        return "auto";
    }
    if (raw === "auto") {
        return "auto";
    }
    const n = parseIntegerEnv(raw, 0, { min: 1 });
    return n > 0 ? n : undefined;
})();
