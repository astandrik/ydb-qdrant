import { logger } from "../logging/logger.js";

export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxBackoffMs?: number;
    isTransient?: (error: unknown) => boolean;
    context?: Record<string, unknown>;
}

const DEFAULT_MAX_RETRIES = 6;
const DEFAULT_BASE_DELAY_MS = 250;

const UNDETERMINED_OPERATION_UNKNOWN_RE =
    /Undetermined \(code 400170\)|State of operation is unknown|Failed to d(?:eliver|eviler) message|issueCode["']?\s*:\s*2026/i;
const SESSION_RECREATION_ERROR_RE =
    /BadSession \(code 400100\)|Session is under shutdown|SessionBusy|SESSION_BUSY/i;
const SESSION_EXPIRED_ERROR_RE = /SessionExpired|SESSION_EXPIRED/i;
const SESSION_POOL_CONTENTION_RE =
    /SESSION_POOL_EMPTY|No session became available within timeout/i;
const SAME_SESSION_TRANSIENT_YDB_ERROR_RE =
    /Aborted|Unavailable \(code 400050\)|schema version mismatch|Table metadata loading|Failed to load metadata|overloaded|is in process of split|wrong shard state|Rejecting data TxId/i;
const TIMEOUT_ERROR_RE = /Timeout \(code 400090\)/i;

function normalizeMaxBackoffMs(value: number | undefined): number {
    if (value === undefined) {
        return Number.POSITIVE_INFINITY;
    }
    if (!Number.isFinite(value) || value < 0) {
        return Number.POSITIVE_INFINITY;
    }
    return value;
}

function getErrorMessageAndIssuesText(error: unknown): {
    msg: string;
    issuesText?: string;
} {
    const msg = error instanceof Error ? error.message : String(error);

    if (typeof error !== "object" || error === null) {
        return { msg };
    }

    const issues = (error as { issues?: unknown }).issues;
    if (issues === undefined) {
        return { msg };
    }

    return {
        msg,
        issuesText: typeof issues === "string" ? issues : JSON.stringify(issues),
    };
}

function matchesPatternSet(error: unknown, patterns: RegExp[]): boolean {
    const { msg, issuesText } = getErrorMessageAndIssuesText(error);

    for (const pattern of patterns) {
        if (pattern.test(msg)) {
            return true;
        }
        if (issuesText !== undefined && pattern.test(issuesText)) {
            return true;
        }
    }

    return false;
}

export function isTransientYdbError(error: unknown): boolean {
    return matchesPatternSet(error, [
        UNDETERMINED_OPERATION_UNKNOWN_RE,
        SESSION_RECREATION_ERROR_RE,
        SESSION_EXPIRED_ERROR_RE,
        SESSION_POOL_CONTENTION_RE,
        SAME_SESSION_TRANSIENT_YDB_ERROR_RE,
        TIMEOUT_ERROR_RE,
    ]);
}

export function isTransientYdbErrorInAcquiredSession(
    error: unknown
): boolean {
    return matchesPatternSet(error, [
        UNDETERMINED_OPERATION_UNKNOWN_RE,
        SAME_SESSION_TRANSIENT_YDB_ERROR_RE,
        TIMEOUT_ERROR_RE,
    ]);
}
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    const maxBackoffMs = normalizeMaxBackoffMs(options.maxBackoffMs);
    const isTransient = options.isTransient ?? isTransientYdbError;
    const context = options.context ?? {};

    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (e: unknown) {
            if (!isTransient(e) || attempt >= maxRetries) {
                throw e;
            }
            const computedBackoffMs = Math.floor(
                baseDelayMs * Math.pow(2, attempt) + Math.random() * 100
            );
            const backoffMs = Math.min(computedBackoffMs, maxBackoffMs);
            logger.warn(
                {
                    ...context,
                    attempt,
                    backoffMs,
                    err:
                        e instanceof Error
                            ? e
                            : new Error(
                                  typeof e === "string" ? e : JSON.stringify(e)
                              ),
                },
                "operation aborted due to transient error; retrying"
            );
            await new Promise((r) => setTimeout(r, backoffMs));
            attempt += 1;
        }
    }
}
