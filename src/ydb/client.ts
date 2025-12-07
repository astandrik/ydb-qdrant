import type {
  Session,
  IAuthService,
  ExecuteQuerySettings as YdbExecuteQuerySettings,
} from "ydb-sdk";
import { createRequire } from "module";
import {
  YDB_DATABASE,
  YDB_ENDPOINT,
  SESSION_POOL_MIN_SIZE,
  SESSION_POOL_MAX_SIZE,
  SESSION_KEEPALIVE_PERIOD_MS,
} from "../config/env.js";
import { logger } from "../logging/logger.js";

const require = createRequire(import.meta.url);
const {
  Driver,
  getCredentialsFromEnv,
  Types,
  TypedValues,
  TableDescription,
  Column,
  ExecuteQuerySettings,
  OperationParams,
  Ydb,
} = require("ydb-sdk") as typeof import("ydb-sdk");

export {
  Types,
  TypedValues,
  TableDescription,
  Column,
  ExecuteQuerySettings,
  Ydb,
};

export function createExecuteQuerySettings(options?: {
  keepInCache?: boolean;
  idempotent?: boolean;
}): YdbExecuteQuerySettings {
  const { keepInCache = true, idempotent = true } = options ?? {};
  const settings = new ExecuteQuerySettings();
  if (keepInCache) {
    settings.withKeepInCache(true);
  }
  if (idempotent) {
    settings.withIdempotent(true);
  }
  return settings;
}

export function createExecuteQuerySettingsWithTimeout(options: {
  keepInCache?: boolean;
  idempotent?: boolean;
  timeoutMs: number;
}): YdbExecuteQuerySettings {
  const settings = createExecuteQuerySettings(options);
  const op = new OperationParams();
  const seconds = Math.max(1, Math.ceil(options.timeoutMs / 1000));
  // Limit both overall operation processing time and cancellation time on the
  // server side so the probe fails fast instead of hanging for the default.
  op.withOperationTimeoutSeconds(seconds);
  op.withCancelAfterSeconds(seconds);
  settings.withOperationParams(op);
  return settings;
}

const DRIVER_READY_TIMEOUT_MS = 15000;
const TABLE_SESSION_TIMEOUT_MS = 20000;
const YDB_HEALTHCHECK_READY_TIMEOUT_MS = 5000;
const DRIVER_REFRESH_COOLDOWN_MS = 30000;
const STARTUP_PROBE_SESSION_TIMEOUT_MS = 3000;

type DriverConfig = {
  endpoint?: string;
  database?: string;
  connectionString?: string;
  authService?: IAuthService;
};

let overrideConfig: DriverConfig | undefined;
let driver: InstanceType<typeof Driver> | undefined;
let lastDriverRefreshAt = 0;
let driverRefreshInFlight: Promise<void> | null = null;

// Test-only: allows injecting a mock Driver factory
let driverFactoryOverride:
  | ((config: unknown) => InstanceType<typeof Driver>)
  | undefined;

export function isCompilationTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message ?? "";
  if (
    /Timeout \(code 400090\)/i.test(msg) ||
    /Query compilation timed out/i.test(msg)
  ) {
    return true;
  }
  // Startup probe uses explicit cancel-after; YDB returns Cancelled with
  // issues like "Cancelling after 3000ms during compilation". Treat this as
  // a compilation-time failure for fatal startup handling.
  if (
    /Cancelled \(code 400160\)/i.test(msg) &&
    /during compilation/i.test(msg)
  ) {
    return true;
  }
  return false;
}

function shouldTriggerDriverRefresh(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message ?? "";
  if (/No session became available within timeout/i.test(msg)) {
    return true;
  }
  if (/SESSION_POOL_EMPTY|session pool empty/i.test(msg)) {
    return true;
  }
  if (/SessionExpired|SESSION_EXPIRED|session.*expired/i.test(msg)) {
    return true;
  }
  // YDB query compilation timeout (TIMEOUT code 400090) – treat as a signal
  // to refresh the driver/session pool so that subsequent attempts use a
  // fresh connection state.
  if (isCompilationTimeoutError(error)) {
    return true;
  }
  return false;
}

async function maybeRefreshDriverOnSessionError(error: unknown): Promise<void> {
  if (!shouldTriggerDriverRefresh(error)) {
    return;
  }
  const now = Date.now();
  if (now - lastDriverRefreshAt < DRIVER_REFRESH_COOLDOWN_MS) {
    logger.warn(
      { lastDriverRefreshAt, cooldownMs: DRIVER_REFRESH_COOLDOWN_MS },
      "YDB driver refresh skipped due to cooldown"
    );
    return;
  }
  if (driverRefreshInFlight) {
    logger.warn(
      { lastDriverRefreshAt, cooldownMs: DRIVER_REFRESH_COOLDOWN_MS },
      "YDB driver refresh already in flight; skipping"
    );
    return;
  }

  lastDriverRefreshAt = now;
  const errorMessage =
    error instanceof Error ? error.message ?? "" : String(error);
  logger.warn(
    { err: error, errorMessage, lastDriverRefreshAt },
    "YDB session-related error detected; refreshing driver"
  );
  try {
    const refreshPromise = refreshDriver();
    driverRefreshInFlight = refreshPromise;
    await refreshPromise;
  } catch (refreshErr) {
    logger.error(
      { err: refreshErr },
      "YDB driver refresh failed; keeping current driver"
    );
  } finally {
    driverRefreshInFlight = null;
  }
}

export function __setDriverForTests(fake: unknown): void {
  driver = fake as InstanceType<typeof Driver> | undefined;
}

export function __setDriverFactoryForTests(
  factory: ((config: unknown) => unknown) | undefined
): void {
  driverFactoryOverride = factory as typeof driverFactoryOverride;
}

export function __resetRefreshStateForTests(): void {
  lastDriverRefreshAt = 0;
  driverRefreshInFlight = null;
}

export function configureDriver(config: DriverConfig): void {
  if (driver) {
    // Driver already created; keep existing connection settings.
    return;
  }
  overrideConfig = config;
}

function getOrCreateDriver(): InstanceType<typeof Driver> {
  if (driver) {
    return driver;
  }

  const base =
    overrideConfig?.connectionString != null
      ? { connectionString: overrideConfig.connectionString }
      : {
          endpoint: overrideConfig?.endpoint ?? YDB_ENDPOINT,
          database: overrideConfig?.database ?? YDB_DATABASE,
        };

  const driverConfig = {
    ...base,
    authService: overrideConfig?.authService ?? getCredentialsFromEnv(),
    poolSettings: {
      minLimit: SESSION_POOL_MIN_SIZE,
      maxLimit: SESSION_POOL_MAX_SIZE,
      keepAlivePeriod: SESSION_KEEPALIVE_PERIOD_MS,
    },
  };

  driver = driverFactoryOverride
    ? driverFactoryOverride(driverConfig)
    : new Driver(driverConfig);

  logger.info(
    {
      poolMinSize: SESSION_POOL_MIN_SIZE,
      poolMaxSize: SESSION_POOL_MAX_SIZE,
      keepAlivePeriodMs: SESSION_KEEPALIVE_PERIOD_MS,
    },
    "YDB driver created with session pool settings"
  );

  return driver;
}

export async function readyOrThrow(): Promise<void> {
  const d = getOrCreateDriver();
  const ok = await d.ready(DRIVER_READY_TIMEOUT_MS);
  if (!ok) {
    throw new Error(
      `YDB driver is not ready in ${
        DRIVER_READY_TIMEOUT_MS / 1000
      }s. Check connectivity and credentials.`
    );
  }
}

export async function withSession<T>(
  fn: (s: Session) => Promise<T>
): Promise<T> {
  const d = getOrCreateDriver();
  try {
    return await d.tableClient.withSession(fn, TABLE_SESSION_TIMEOUT_MS);
  } catch (err) {
    void maybeRefreshDriverOnSessionError(err);
    throw err;
  }
}

export async function withStartupProbeSession<T>(
  fn: (s: Session) => Promise<T>
): Promise<T> {
  const d = getOrCreateDriver();
  try {
    return await d.tableClient.withSession(
      fn,
      STARTUP_PROBE_SESSION_TIMEOUT_MS
    );
  } catch (err) {
    void maybeRefreshDriverOnSessionError(err);
    throw err;
  }
}

export async function isYdbAvailable(
  timeoutMs = YDB_HEALTHCHECK_READY_TIMEOUT_MS
): Promise<boolean> {
  const d = getOrCreateDriver();
  try {
    return await d.ready(timeoutMs);
  } catch {
    return false;
  }
}

/**
 * Destroys the current driver and its session pool.
 * Next call to withSession or readyOrThrow will create a new driver.
 */
export async function destroyDriver(): Promise<void> {
  if (!driver) {
    return;
  }
  logger.info("Destroying YDB driver and session pool");
  try {
    await driver.destroy();
  } catch (err) {
    logger.warn({ err }, "Error during driver destruction (ignored)");
  }
  driver = undefined;
}

/**
 * Destroys the current driver and immediately creates a fresh one.
 * Use this to recover from session pool exhaustion or zombie sessions.
 */
export async function refreshDriver(): Promise<void> {
  logger.info("Refreshing YDB driver");
  await destroyDriver();
  await readyOrThrow();
  logger.info("YDB driver refreshed successfully");
}
