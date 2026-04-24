import type {
    Session,
    IAuthService,
    ExecuteQuerySettings as YdbExecuteQuerySettings,
    BulkUpsertSettings as YdbBulkUpsertSettings,
    QuerySession,
    ISslCredentials,
} from "ydb-sdk";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import {
    SESSION_POOL_MIN_SIZE,
    SESSION_POOL_MAX_SIZE,
    SESSION_KEEPALIVE_PERIOD_MS,
    STARTUP_PROBE_SESSION_TIMEOUT_MS,
    YDB_SESSION_RETRY_MAX_RETRIES,
    TABLE_SESSION_TIMEOUT_MS,
    YDB_SSL_ROOT_CERTIFICATES_FILE,
    YDB_STATIC_CREDENTIALS_AUTH_ENDPOINT,
    YDB_STATIC_CREDENTIALS_PASSWORD,
    YDB_STATIC_CREDENTIALS_PASSWORD_FILE,
    YDB_STATIC_CREDENTIALS_USER,
    resolveYdbConnectionConfig,
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
    TableIndex,
    AlterTableDescription,
    ExecuteQuerySettings,
    BulkUpsertSettings,
    OperationParams,
    StaticCredentialsAuthService,
    getDefaultLogger,
    Ydb,
} = require("ydb-sdk") as typeof import("ydb-sdk");

export {
    Types,
    TypedValues,
    TableDescription,
    Column,
    TableIndex,
    AlterTableDescription,
    ExecuteQuerySettings,
    BulkUpsertSettings,
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

export function createBulkUpsertSettingsWithTimeout(options: {
    timeoutMs: number;
}): YdbBulkUpsertSettings {
    const settings = new BulkUpsertSettings();
    const op = new OperationParams();
    const seconds = Math.max(1, Math.ceil(options.timeoutMs / 1000));
    op.withOperationTimeoutSeconds(seconds);
    op.withCancelAfterSeconds(seconds);
    settings.withOperationParams(op);
    return settings;
}

const DRIVER_READY_TIMEOUT_MS = 15000;
const YDB_HEALTHCHECK_READY_TIMEOUT_MS = 5000;
const DRIVER_REFRESH_COOLDOWN_MS = 30000;
const DRIVER_DESTROY_GRACE_PERIOD_MS = TABLE_SESSION_TIMEOUT_MS + 5000;

type DriverConfig = {
    endpoint?: string;
    database?: string;
    connectionString?: string;
    authService?: IAuthService;
};

type ResolvedYdbConnectionConfig = ReturnType<typeof resolveYdbConnectionConfig>;
type SdkSslCredentialsModule = {
    makeDefaultSslCredentials: () => ISslCredentials;
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
        /Query compilation timed out/i.test(msg) ||
        (/Timeout \(code 400090\)/i.test(msg) && /compilation/i.test(msg))
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

function readStaticCredentialsPasswordFromFile(path: string): string {
    try {
        return readFileSync(path, "utf8").replace(/[\r\n]+$/, "");
    } catch (cause) {
        throw new Error(
            `Failed to read YDB_STATIC_CREDENTIALS_PASSWORD_FILE at ${path}.`,
            { cause }
        );
    }
}

function readSslRootCertificatesFromFile(path: string): Buffer {
    try {
        return readFileSync(path);
    } catch (cause) {
        throw new Error(
            `Failed to read YDB_SSL_ROOT_CERTIFICATES_FILE at ${path}.`,
            { cause }
        );
    }
}

function resolveStaticCredentialsPassword(): string | undefined {
    if (YDB_STATIC_CREDENTIALS_PASSWORD_FILE) {
        const password = readStaticCredentialsPasswordFromFile(
            YDB_STATIC_CREDENTIALS_PASSWORD_FILE
        );
        return password.length > 0 ? password : undefined;
    }

    return YDB_STATIC_CREDENTIALS_PASSWORD.length > 0
        ? YDB_STATIC_CREDENTIALS_PASSWORD
        : undefined;
}

function endpointFromConnectionString(connectionString: string): string {
    const url = new URL(connectionString);
    return `${url.protocol}//${url.host}`;
}

function resolveStaticCredentialsAuthEndpoint(
    base: ResolvedYdbConnectionConfig
): string {
    if (YDB_STATIC_CREDENTIALS_AUTH_ENDPOINT) {
        return YDB_STATIC_CREDENTIALS_AUTH_ENDPOINT;
    }

    if ("endpoint" in base) {
        return base.endpoint;
    }

    return endpointFromConnectionString(base.connectionString);
}

function isSecureEndpoint(endpoint: string): boolean {
    return /^(grpcs|https):\/\//i.test(endpoint);
}

function createPrivateCaSslCredentialsForEndpoint(
    endpoint: string
): ISslCredentials | undefined {
    if (!isSecureEndpoint(endpoint) || !YDB_SSL_ROOT_CERTIFICATES_FILE) {
        return undefined;
    }

    return {
        rootCertificates: readSslRootCertificatesFromFile(
            YDB_SSL_ROOT_CERTIFICATES_FILE
        ),
    };
}

function createSdkDefaultSslCredentialsForStaticAuth(): ISslCredentials {
    try {
        // ydb-sdk does not publicly export this helper; keep the private lookup lazy and non-fatal.
        const { makeDefaultSslCredentials } = require(
            join(dirname(require.resolve("ydb-sdk")), "utils/ssl-credentials.js")
        ) as SdkSslCredentialsModule;

        return makeDefaultSslCredentials();
    } catch (cause) {
        logger.warn(
            { err: cause },
            "YDB SDK default SSL credentials unavailable; falling back to grpc default TLS roots"
        );
        return {};
    }
}

function createStaticAuthSslCredentialsForEndpoint(
    endpoint: string
): ISslCredentials | undefined {
    if (!isSecureEndpoint(endpoint)) {
        return undefined;
    }

    return (
        createPrivateCaSslCredentialsForEndpoint(endpoint) ??
        createSdkDefaultSslCredentialsForStaticAuth()
    );
}

function createStaticCredentialsAuthService(
    base: ResolvedYdbConnectionConfig
): IAuthService | undefined {
    if (!YDB_STATIC_CREDENTIALS_USER) {
        return undefined;
    }

    const password = resolveStaticCredentialsPassword();
    if (!password) {
        throw new Error(
            "YDB_STATIC_CREDENTIALS_USER is set, but neither YDB_STATIC_CREDENTIALS_PASSWORD_FILE nor YDB_STATIC_CREDENTIALS_PASSWORD provides a non-empty password."
        );
    }

    const authEndpoint = resolveStaticCredentialsAuthEndpoint(base);
    const sslCredentials =
        createStaticAuthSslCredentialsForEndpoint(authEndpoint);

    return new StaticCredentialsAuthService(
        YDB_STATIC_CREDENTIALS_USER,
        password,
        authEndpoint,
        getDefaultLogger(),
        sslCredentials ? { sslCredentials } : undefined
    );
}

function getDriverConfig(): ConstructorParameters<typeof Driver>[0] {
    const base = resolveYdbConnectionConfig({
        endpoint: overrideConfig?.endpoint,
        database: overrideConfig?.database,
        connectionString: overrideConfig?.connectionString,
    });
    const sslCredentials =
        "endpoint" in base
            ? createPrivateCaSslCredentialsForEndpoint(base.endpoint)
            : createPrivateCaSslCredentialsForEndpoint(
                  endpointFromConnectionString(base.connectionString)
              );

    return {
        ...base,
        authService:
            overrideConfig?.authService ??
            createStaticCredentialsAuthService(base) ??
            getCredentialsFromEnv(),
        ...(sslCredentials ? { sslCredentials } : {}),
        poolSettings: {
            minLimit: SESSION_POOL_MIN_SIZE,
            maxLimit: SESSION_POOL_MAX_SIZE,
            keepAlivePeriod: SESSION_KEEPALIVE_PERIOD_MS,
        },
    } as ConstructorParameters<typeof Driver>[0];
}

function createDriverInstance(): InstanceType<typeof Driver> {
    const driverConfig = getDriverConfig();
    const created = driverFactoryOverride
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

    return created;
}

function getOrCreateDriver(): InstanceType<typeof Driver> {
    if (driver) {
        return driver;
    }
    driver = createDriverInstance();

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
        return await d.tableClient.withSessionRetry(
            fn,
            TABLE_SESSION_TIMEOUT_MS,
            YDB_SESSION_RETRY_MAX_RETRIES
        );
    } catch (err) {
        void maybeRefreshDriverOnSessionError(err);
        throw err;
    }
}

/**
 * Runs a callback in a single session without re-running the callback on session errors.
 *
 * Use this for multi-step callbacks where rerunning from the beginning would cause
 * incorrect counters or repeated side effects. Prefer `withSession()` for single-shot
 * operations to auto-retry on BadSession/SessionBusy via ydb-sdk.
 */
export async function withSessionOnce<T>(
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

export async function withQuerySession<T>(
    fn: (s: QuerySession) => Promise<T>,
    options?: { timeoutMs?: number; idempotent?: boolean }
): Promise<T> {
    const d = getOrCreateDriver();
    try {
        return await d.queryClient.do({
            fn,
            timeout: options?.timeoutMs ?? TABLE_SESSION_TIMEOUT_MS,
            idempotent: options?.idempotent,
        });
    } catch (err) {
        // Query sessions can also get stuck/busy; reuse the same driver refresh path.
        void maybeRefreshDriverOnSessionError(err);
        throw err;
    }
}

export async function withStartupProbeSession<T>(
    fn: (s: Session) => Promise<T>
): Promise<T> {
    const d = getOrCreateDriver();
    try {
        return await d.tableClient.withSessionRetry(
            fn,
            STARTUP_PROBE_SESSION_TIMEOUT_MS,
            YDB_SESSION_RETRY_MAX_RETRIES
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
    const toDestroy = driver;
    driver = undefined;
    try {
        await toDestroy.destroy();
    } catch (err) {
        logger.warn({ err }, "Error during driver destruction (ignored)");
    }
}

/**
 * Destroys the current driver and immediately creates a fresh one.
 * Use this to recover from session pool exhaustion or zombie sessions.
 */
export async function refreshDriver(): Promise<void> {
    logger.info("Refreshing YDB driver");

    const oldDriver = driver;
    const newDriver = createDriverInstance();

    let ok: boolean;
    try {
        ok = await newDriver.ready(DRIVER_READY_TIMEOUT_MS);
    } catch (err) {
        try {
            await newDriver.destroy();
        } catch (destroyErr) {
            logger.warn(
                { err: destroyErr },
                "Error during fresh driver destruction after failed ready() (ignored)"
            );
        }
        throw err;
    }
    if (!ok) {
        try {
            await newDriver.destroy();
        } catch (err) {
            logger.warn(
                { err },
                "Error during fresh driver destruction after failed ready() (ignored)"
            );
        }
        throw new Error(
            `YDB driver is not ready in ${
                DRIVER_READY_TIMEOUT_MS / 1000
            }s. Check connectivity and credentials.`
        );
    }

    driver = newDriver;
    logger.info(
        { gracePeriodMs: DRIVER_DESTROY_GRACE_PERIOD_MS },
        "YDB driver swapped successfully; scheduling old driver destruction"
    );

    if (oldDriver) {
        setTimeout(() => {
            void (async () => {
                try {
                    await oldDriver.destroy();
                } catch (err) {
                    logger.warn(
                        { err },
                        "Error during delayed old driver destruction (ignored)"
                    );
                }
            })();
        }, DRIVER_DESTROY_GRACE_PERIOD_MS);
    }
}
