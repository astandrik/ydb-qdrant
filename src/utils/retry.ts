import { logger } from "../logging/logger.js";
import { retry as ydbRetry } from "@ydbjs/retry";

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  isTransient?: (error: unknown) => boolean;
  context?: Record<string, unknown>;
}

const DEFAULT_MAX_RETRIES = 6;
const DEFAULT_BASE_DELAY_MS = 250;

export function isTransientYdbError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    /Aborted|schema version mismatch|Table metadata loading|Failed to load metadata|overloaded|is in process of split|wrong shard state|Rejecting data TxId/i.test(
      msg
    )
  ) {
    return true;
  }

  if (typeof error === "object" && error !== null) {
    const issues = (error as { issues?: unknown }).issues;
    if (issues !== undefined) {
      const issuesText =
        typeof issues === "string" ? issues : JSON.stringify(issues);
      if (
        /overloaded|is in process of split|wrong shard state|Rejecting data TxId/i.test(
          issuesText
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const isTransient = options.isTransient ?? isTransientYdbError;
  const context = options.context ?? {};

  // We keep the public API in terms of `maxRetries`, but @ydbjs/retry uses a budget
  // in terms of total attempts. Convert retries→attempts.
  const attemptsBudget = Math.max(0, maxRetries) + 1;
  const delayByAttempt = new Map<number, number>();

  return await ydbRetry(
    {
      budget: attemptsBudget,
      retry: (error) => isTransient(error),
      strategy: (ctx) => {
        // Preserve previous backoff shape: baseDelayMs * 2^attemptIndex + jitter(0..100)
        // where attemptIndex started at 0 for the first retry.
        const attemptIndex = Math.max(0, ctx.attempt - 1);
        const delayMs = Math.floor(
          baseDelayMs * Math.pow(2, attemptIndex) + Math.random() * 100
        );
        delayByAttempt.set(ctx.attempt, delayMs);
        return delayMs;
      },
      onRetry: (ctx) => {
        const attemptIndex = Math.max(0, ctx.attempt - 1);
        logger.warn(
          {
            ...context,
            attempt: attemptIndex,
            backoffMs: delayByAttempt.get(ctx.attempt),
            err:
              ctx.error instanceof Error
                ? ctx.error
                : new Error(
                    typeof ctx.error === "string"
                      ? ctx.error
                      : JSON.stringify(ctx.error)
                  ),
          },
          "operation aborted due to transient error; retrying"
        );
      },
    },
    async () => {
      return await fn();
    }
  );
}
