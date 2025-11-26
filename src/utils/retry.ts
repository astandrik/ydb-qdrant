import { logger } from "../logging/logger.js";

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
  return /Aborted|schema version mismatch|Table metadata loading|Failed to load metadata/i.test(
    msg
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
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
      const backoffMs = Math.floor(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 100
      );
      logger.warn(
        { ...context, attempt, backoffMs },
        "operation aborted due to transient error; retrying"
      );
      await new Promise((r) => setTimeout(r, backoffMs));
      attempt += 1;
    }
  }
}
