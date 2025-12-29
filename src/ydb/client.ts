import { Driver, type DriverOptions } from "@ydbjs/core";
import { query, type QueryClient } from "@ydbjs/query";
import type { AsyncLocalStorage } from "node:async_hooks";
import { CredentialsProvider } from "@ydbjs/auth";
import { AnonymousCredentialsProvider } from "@ydbjs/auth/anonymous";
import { AccessTokenCredentialsProvider } from "@ydbjs/auth/access-token";
import { MetadataCredentialsProvider } from "@ydbjs/auth/metadata";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import {
  YDB_DATABASE,
  YDB_ENDPOINT,
  STARTUP_PROBE_SESSION_TIMEOUT_MS,
} from "../config/env.js";
import { logger } from "../logging/logger.js";
import { SessionPool, type PooledQuerySession } from "./SessionPool.js";

const DRIVER_READY_TIMEOUT_MS = 15000;
const YDB_HEALTHCHECK_READY_TIMEOUT_MS = 5000;
const DRIVER_REFRESH_COOLDOWN_MS = 30000;
// Bound `withSession()` so `d.ready()` / session acquire can't hang forever under YDB stalls.
// Matches historical table client session timeout behavior (~20s).
const WITH_SESSION_TIMEOUT_MS = 20000;

type DriverConfig = {
  endpoint?: string;
  database?: string;
  connectionString?: string;
  credentialsProvider?: CredentialsProvider;
};

let overrideConfig: DriverConfig | undefined;
let driver: Driver | undefined;
let sqlClient: QueryClient | undefined;
let sessionPool: SessionPool | undefined;
let lastDriverRefreshAt = 0;
let driverRefreshInFlight: Promise<void> | null = null;

// Test-only: allows injecting a mock Driver factory.
let driverFactoryOverride:
  | ((connectionString: string, options?: DriverOptions) => Driver)
  | undefined;

type QueryCtxModule = {
  ctx: AsyncLocalStorage<{
    nodeId?: bigint;
    sessionId?: string;
    transactionId?: string;
    signal?: AbortSignal;
  }>;
};

let queryCtxPromise: Promise<QueryCtxModule> | null = null;

async function getQueryCtx(): Promise<QueryCtxModule> {
  if (queryCtxPromise) {
    return await queryCtxPromise;
  }
  const require = createRequire(import.meta.url);
  const entry = require.resolve("@ydbjs/query");
  const ctxPath = path.join(path.dirname(entry), "ctx.js");
  queryCtxPromise = import(
    pathToFileURL(ctxPath).href
  ) as Promise<QueryCtxModule>;
  return await queryCtxPromise;
}

const IAM_TOKEN_URL = "https://iam.api.cloud.yandex.net/iam/v1/tokens";
const SA_JWT_MAX_AGE_SECONDS = 3600;
const SA_TOKEN_REFRESH_SKEW_MS = 60_000;
// Yandex Cloud IAM tokens: lifetime does not exceed 12 hours, but the docs recommend
// requesting a token more often (e.g., every hour). We refresh a bit earlier as a
// best-effort fallback when the API response doesn't include expiresAt.
// Source: https://cloud.yandex.com/en/docs/iam/operations/iam-token/create-for-sa
const SA_TOKEN_REFRESH_FALLBACK_MS = 55 * 60_000;

function parseTruthyEnv(value: string | undefined): boolean {
  if (value === undefined) return false;
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

function toBase64Url(input: Buffer | Uint8Array): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function jsonToBase64Url(obj: unknown): string {
  return toBase64Url(Buffer.from(JSON.stringify(obj), "utf8"));
}

function normalizeServiceAccountPrivateKeyPem(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("PLEASE DO NOT REMOVE THIS LINE!")) {
    return trimmed.split("\n").slice(1).join("\n").trim();
  }
  return trimmed;
}

type ServiceAccountKeyFile = {
  id: string;
  service_account_id: string;
  private_key: string;
};

async function readServiceAccountKeyFile(
  absPath: string
): Promise<ServiceAccountKeyFile> {
  const raw = await readFile(absPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<ServiceAccountKeyFile>;
  if (
    typeof parsed.id !== "string" ||
    typeof parsed.service_account_id !== "string" ||
    typeof parsed.private_key !== "string"
  ) {
    throw new Error(
      "Invalid service account key JSON: expected fields id, service_account_id, private_key"
    );
  }
  return {
    id: parsed.id,
    service_account_id: parsed.service_account_id,
    private_key: parsed.private_key,
  };
}

function createServiceAccountJwt(args: {
  keyId: string;
  serviceAccountId: string;
  privateKeyPem: string;
  nowSec: number;
}): string {
  // Per Yandex Cloud IAM docs, the service account JWT must be PS256 with kid
  // and audience set to the IAM token endpoint.
  const header = { typ: "JWT", alg: "PS256", kid: args.keyId };
  const payload = {
    iss: args.serviceAccountId,
    aud: IAM_TOKEN_URL,
    iat: args.nowSec,
    exp: args.nowSec + SA_JWT_MAX_AGE_SECONDS,
  };

  const encodedHeader = jsonToBase64Url(header);
  const encodedPayload = jsonToBase64Url(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), {
    key: normalizeServiceAccountPrivateKeyPem(args.privateKeyPem),
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  });

  return `${signingInput}.${toBase64Url(signature)}`;
}

async function exchangeJwtForIamToken(args: {
  jwt: string;
  signal?: AbortSignal;
}): Promise<{ iamToken: string; expiresAtMs: number | null }> {
  const res = await fetch(IAM_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jwt: args.jwt }),
    signal: args.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to exchange JWT for IAM token: HTTP ${res.status}${
        text ? `: ${text}` : ""
      }`
    );
  }
  const body = (await res.json()) as Partial<{
    iamToken: string;
    expiresAt: string;
    expires_at: string;
  }>;
  const token = body.iamToken;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("IAM token exchange response is missing iamToken");
  }

  const expiresAtRaw = body.expiresAt ?? body.expires_at;
  const expiresAtMs =
    typeof expiresAtRaw === "string" ? Date.parse(expiresAtRaw) : NaN;
  return {
    iamToken: token,
    expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : null,
  };
}

class ServiceAccountKeyFileCredentialsProvider extends CredentialsProvider {
  private cached: {
    token: string;
    expiresAtMs: number | null;
    cachedAtMs: number;
  } | null = null;

  constructor(private readonly keyFilePath: string) {
    super();
  }

  async getToken(force = false, signal?: AbortSignal): Promise<string> {
    const nowMs = Date.now();
    if (!force && this.cached) {
      const { token, expiresAtMs, cachedAtMs } = this.cached;
      if (expiresAtMs !== null) {
        if (nowMs + SA_TOKEN_REFRESH_SKEW_MS < expiresAtMs) {
          return token;
        }
      } else {
        // If the API doesn't provide expiresAt, refresh hourly (best-effort).
        if (nowMs - cachedAtMs < SA_TOKEN_REFRESH_FALLBACK_MS) {
          return token;
        }
      }
    }

    const key = await readServiceAccountKeyFile(this.keyFilePath);
    const nowSec = Math.floor(nowMs / 1000);
    const jwt = createServiceAccountJwt({
      keyId: key.id,
      serviceAccountId: key.service_account_id,
      privateKeyPem: key.private_key,
      nowSec,
    });
    const { iamToken, expiresAtMs } = await exchangeJwtForIamToken({
      jwt,
      signal,
    });
    this.cached = { token: iamToken, expiresAtMs, cachedAtMs: nowMs };
    return iamToken;
  }
}

function resolveCredentialsProviderFromEnv(): CredentialsProvider {
  const saKeyPath =
    process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS?.trim();
  if (saKeyPath) {
    return new ServiceAccountKeyFileCredentialsProvider(saKeyPath);
  }

  if (parseTruthyEnv(process.env.YDB_METADATA_CREDENTIALS)) {
    return new MetadataCredentialsProvider();
  }

  const accessToken = process.env.YDB_ACCESS_TOKEN_CREDENTIALS?.trim();
  if (accessToken) {
    return new AccessTokenCredentialsProvider({ token: accessToken });
  }

  if (parseTruthyEnv(process.env.YDB_ANONYMOUS_CREDENTIALS)) {
    return new AnonymousCredentialsProvider();
  }

  throw new Error(
    "No YDB credentials configured. Set one of: YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS, YDB_METADATA_CREDENTIALS=1, YDB_ACCESS_TOKEN_CREDENTIALS, YDB_ANONYMOUS_CREDENTIALS=1"
  );
}

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
  // Compilation timeout is treated as a signal to refresh the driver so that
  // subsequent attempts use a fresh connection state.
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
  driver = fake as Driver | undefined;
  sqlClient = undefined;
  sessionPool = undefined;
  queryCtxPromise = null;
}

export function __setSessionPoolForTests(fake: unknown): void {
  sessionPool = fake as SessionPool | undefined;
}

export function __setDriverFactoryForTests(
  factory:
    | ((connectionString: string, options?: DriverOptions) => Driver)
    | undefined
): void {
  driverFactoryOverride = factory;
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

function buildConnectionString(args: {
  endpoint: string;
  database: string;
}): string {
  const endpoint = args.endpoint.trim();
  const database = args.database.trim();
  if (!endpoint) {
    throw new Error("YDB endpoint is empty; set YDB_ENDPOINT");
  }
  if (!database) {
    throw new Error("YDB database is empty; set YDB_DATABASE");
  }
  const url = new URL(endpoint);
  const dbPath = database.startsWith("/") ? database : `/${database}`;
  url.pathname = dbPath;
  return url.toString();
}

function getOrCreateDriver(): Driver {
  if (driver) {
    return driver;
  }

  const endpoint = overrideConfig?.endpoint ?? YDB_ENDPOINT;
  const database = overrideConfig?.database ?? YDB_DATABASE;

  let connectionString: string;
  if (overrideConfig?.connectionString) {
    connectionString = overrideConfig.connectionString;
  } else if (driverFactoryOverride) {
    // Tests may inject a driver factory without setting env vars.
    // If endpoint/database are available, still build a real connection string.
    const hasEndpoint = endpoint.trim().length > 0;
    const hasDatabase = database.trim().length > 0;
    connectionString =
      hasEndpoint && hasDatabase
        ? buildConnectionString({ endpoint, database })
        : "";
  } else {
    connectionString = buildConnectionString({ endpoint, database });
  }

  const credentialsProvider = overrideConfig?.credentialsProvider
    ? overrideConfig.credentialsProvider
    : driverFactoryOverride
    ? undefined
    : resolveCredentialsProviderFromEnv();

  const driverOptions: DriverOptions = {
    ...(credentialsProvider ? { credentialsProvider } : {}),
    "ydb.sdk.ready_timeout_ms": DRIVER_READY_TIMEOUT_MS,
  };

  driver = driverFactoryOverride
    ? driverFactoryOverride(connectionString, driverOptions)
    : new Driver(connectionString, driverOptions);

  logger.info(
    { hasCredentialsProvider: true, connectionStringMasked: true },
    "YDB driver created"
  );

  return driver;
}

function getOrCreateQueryClient(): QueryClient {
  if (sqlClient) {
    return sqlClient;
  }
  const d = getOrCreateDriver();
  sqlClient = query(d);
  return sqlClient;
}

function getOrCreateSessionPool(): SessionPool {
  if (sessionPool) {
    return sessionPool;
  }
  const d = getOrCreateDriver();
  sessionPool = new SessionPool(d);
  // Keepalive is best-effort; don't block startup.
  sessionPool.start();
  return sessionPool;
}

async function withTimeoutSignal<T>(
  timeoutMs: number,
  fn: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fn(ac.signal);
  } finally {
    clearTimeout(t);
  }
}

export async function readyOrThrow(): Promise<void> {
  const d = getOrCreateDriver();
  await withTimeoutSignal(DRIVER_READY_TIMEOUT_MS, async (signal) => {
    await d.ready(signal);
  });
}

export async function withSession<T>(
  fn: (sql: QueryClient, signal: AbortSignal) => Promise<T>
): Promise<T> {
  const sql = getOrCreateQueryClient();
  const d = getOrCreateDriver();
  const pool = getOrCreateSessionPool();
  try {
    // Bound only `d.ready()` and `pool.acquire()` so stalls in driver readiness or session
    // availability can't hang forever. We intentionally do NOT abort the user callback,
    // because request operations can legitimately exceed this bound (e.g. multi-batch upserts).
    await withTimeoutSignal(WITH_SESSION_TIMEOUT_MS, async (signal) => {
      await d.ready(signal);
    });

    // Ensure we have a few sessions ready to reduce cold-start session churn.
    // Best-effort: ignore failures/timeouts.
    void withTimeoutSignal(WITH_SESSION_TIMEOUT_MS, async (signal) => {
      await pool.warmup(signal);
    }).catch(() => undefined);

    // @ydbjs/query QueryClient.do() is not implemented in the currently published builds.
    // Cancellation is cooperative: we provide an AbortSignal to `fn()` and also store it in
    // the @ydbjs/query async-local context so query operations can observe it via `.signal(...)`.
    // (Note: this signal is not auto-aborted by `withSession()`; query-level `.timeout(...)`
    // is the primary guard for long-running YQL statements.)
    const operationSignal = new AbortController().signal;

    const ctxMod = await getQueryCtx();
    let leased: PooledQuerySession | null = null;

    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      leased = await withTimeoutSignal(WITH_SESSION_TIMEOUT_MS, async (signal) => {
        return await pool.acquire(signal);
      });
      try {
        const store = {
          nodeId: leased.nodeId,
          sessionId: leased.sessionId,
          signal: operationSignal,
        };
        const result = await ctxMod.ctx.run(store, async () => {
          return await fn(sql, operationSignal);
        });
        pool.release(leased);
        return result;
      } catch (err) {
        const shouldRetryWithFreshSession =
          err instanceof Error &&
          /BAD_SESSION|SESSION_EXPIRED|SessionExpired|No session became available/i.test(
            err.message ?? ""
          );
        if (shouldRetryWithFreshSession) {
          await pool.discard(leased);
          leased = null;
          if (attempt === MAX_ATTEMPTS - 1) {
            throw err;
          }
          continue;
        }
        pool.release(leased);
        throw err;
      }
    }
    throw new Error("withSession: exhausted attempts to acquire a healthy session");
  } catch (err) {
    void maybeRefreshDriverOnSessionError(err);
    throw err;
  }
}

export async function withStartupProbeSession<T>(
  fn: (sql: QueryClient, signal: AbortSignal) => Promise<T>
): Promise<T> {
  const sql = getOrCreateQueryClient();
  const d = getOrCreateDriver();
  const pool = getOrCreateSessionPool();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), STARTUP_PROBE_SESSION_TIMEOUT_MS);

  try {
    // Ensure the startup probe timeout also applies to driver readiness.
    await d.ready(ac.signal);
    void pool.warmup(ac.signal);

    const ctxMod = await getQueryCtx();
    const leased = await pool.acquire(ac.signal);
    try {
      const store = {
        nodeId: leased.nodeId,
        sessionId: leased.sessionId,
        signal: ac.signal,
      };
      const result = await ctxMod.ctx.run(store, async () => {
        return await fn(sql, ac.signal);
      });
      pool.release(leased);
      return result;
    } catch (err) {
      pool.release(leased);
      throw err;
    }
  } catch (err) {
    void maybeRefreshDriverOnSessionError(err);
    throw err;
  } finally {
    clearTimeout(t);
  }
}

export async function isYdbAvailable(
  timeoutMs = YDB_HEALTHCHECK_READY_TIMEOUT_MS
): Promise<boolean> {
  const d = getOrCreateDriver();
  try {
    await withTimeoutSignal(timeoutMs, async (signal) => {
      await d.ready(signal);
    });
    return true;
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
  logger.info("Destroying YDB driver");
  try {
    if (sessionPool) {
      try {
        await sessionPool.close();
      } catch (err) {
        logger.warn({ err }, "Error during session pool close (ignored)");
      }
      sessionPool = undefined;
    }
    if (sqlClient) {
      try {
        await sqlClient[Symbol.asyncDispose]();
      } catch (err) {
        logger.warn({ err }, "Error during query client disposal (ignored)");
      }
      sqlClient = undefined;
    }
    driver.close();
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
