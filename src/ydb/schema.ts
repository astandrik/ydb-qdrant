import { withSession } from "./client.js";
import { logger } from "../logging/logger.js";
import { STARTUP_PROBE_SESSION_TIMEOUT_MS } from "../config/env.js";

export const GLOBAL_POINTS_TABLE = "qdrant_all_points";
// Shared YDB-related constants for repositories.
export { UPSERT_BATCH_SIZE } from "../config/env.js";

const SCHEMA_DDL_TIMEOUT_MS = 5000;

let metaTableReady = false;
let metaTableReadyInFlight: Promise<void> | null = null;

let globalPointsTableReady = false;

function collectIssueMessages(err: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<object>();

  // Hard guardrails to guarantee termination even for pathological error graphs.
  const MAX_DEPTH = 8;
  const MAX_NODES = 500;

  const queue: Array<{ v: unknown; depth: number }> = [{ v: err, depth: 0 }];
  let visited = 0;

  while (queue.length > 0 && visited < MAX_NODES) {
    const next = queue.shift();
    if (!next) break;
    const { v, depth } = next;

    if (depth > MAX_DEPTH) continue;
    if (v === null || typeof v !== "object") continue;

    if (seen.has(v)) continue;
    seen.add(v);
    visited++;

    const maybeMessage = (v as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      out.push(maybeMessage);
    }

    const maybeIssues = (v as { issues?: unknown }).issues;
    if (Array.isArray(maybeIssues)) {
      for (const child of maybeIssues) {
        queue.push({ v: child, depth: depth + 1 });
      }
    }
  }

  return out;
}

function isAlreadyExistsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/already exists/i.test(msg) || /path exists/i.test(msg)) {
    return true;
  }

  // YDBError often carries the useful text in nested `issues`, while `message`
  // is a generic wrapper like "Type annotation".
  const issueMsgs = collectIssueMessages(err).join("\n");
  return (
    /already exists/i.test(issueMsgs) ||
    /path exists/i.test(issueMsgs) ||
    /table name conflict/i.test(issueMsgs)
  );
}

function isUnknownColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const re = /unknown column|cannot resolve|member not found/i;
  if (re.test(msg)) {
    return true;
  }

  // YDBError may carry the real message in nested `issues`.
  const issueMsgs = collectIssueMessages(err).join("\n");
  return re.test(issueMsgs);
}

function throwMigrationRequired(message: string): never {
  logger.error(message);
  throw new Error(message);
}

async function ensureMetaTableOnce(): Promise<void> {
  await withSession(async (sql, signal) => {
    try {
      await sql`
        CREATE TABLE qdr__collections (
          collection Utf8,
          table_name Utf8,
          vector_dimension Uint32,
          distance Utf8,
          vector_type Utf8,
          created_at Timestamp,
          last_accessed_at Timestamp,
          PRIMARY KEY (collection)
        );
      `
        .idempotent(true)
        .timeout(SCHEMA_DDL_TIMEOUT_MS)
        .signal(signal);
      logger.info("created metadata table qdr__collections");
    } catch (err) {
      if (!isAlreadyExistsError(err)) {
        throw err;
      }
    }

    // Fail fast if schema is old/mismatched: we do not auto-migrate tables.
    try {
      await sql`SELECT last_accessed_at FROM qdr__collections LIMIT 0;`
        .idempotent(true)
        .timeout(STARTUP_PROBE_SESSION_TIMEOUT_MS)
        .signal(signal);
    } catch (err) {
      if (!isUnknownColumnError(err)) {
        throw err;
      }
      throwMigrationRequired(
        "Metadata table qdr__collections is missing required column last_accessed_at; apply a manual migration (ALTER TABLE qdr__collections ADD COLUMN last_accessed_at Timestamp)."
      );
    }
  });

  metaTableReady = true;
}

export async function ensureMetaTable(): Promise<void> {
  if (metaTableReady) {
    return;
  }
  if (metaTableReadyInFlight) {
    await metaTableReadyInFlight;
    return;
  }

  metaTableReadyInFlight = ensureMetaTableOnce();
  try {
    await metaTableReadyInFlight;
  } finally {
    metaTableReadyInFlight = null;
  }
}

export async function ensureGlobalPointsTable(): Promise<void> {
  if (globalPointsTableReady) {
    return;
  }

  await withSession(async (sql, signal) => {
    try {
      await sql`
        CREATE TABLE ${sql.identifier(GLOBAL_POINTS_TABLE)} (
          uid Utf8,
          point_id Utf8,
          embedding String,
          embedding_quantized String,
          payload JsonDocument,
          PRIMARY KEY (uid, point_id)
        )
        WITH (
          AUTO_PARTITIONING_BY_LOAD = ENABLED,
          AUTO_PARTITIONING_BY_SIZE = ENABLED,
          AUTO_PARTITIONING_PARTITION_SIZE_MB = 100
        );
      `
        .idempotent(true)
        .timeout(SCHEMA_DDL_TIMEOUT_MS)
        .signal(signal);
      logger.info(`created global points table ${GLOBAL_POINTS_TABLE}`);
    } catch (err) {
      if (!isAlreadyExistsError(err)) {
        // YDB may return non-"already exists" errors for concurrent CREATE TABLE attempts
        // or name resolution conflicts. Probe existence before failing startup.
        try {
          await sql`SELECT uid FROM ${sql.identifier(
            GLOBAL_POINTS_TABLE
          )} LIMIT 0;`
            .idempotent(true)
            .timeout(STARTUP_PROBE_SESSION_TIMEOUT_MS)
            .signal(signal);
          logger.warn(
            { err },
            `CREATE TABLE ${GLOBAL_POINTS_TABLE} failed, but the table appears to exist; continuing`
          );
        } catch {
          // If the table doesn't exist but CREATE TABLE failed for another reason,
          // let the error surface; callers depend on the table being present.
          throw err;
        }
      }
    }

    // Fail fast if schema is old/mismatched: we do not auto-migrate tables.
    try {
      await sql`SELECT embedding_quantized FROM ${sql.identifier(
        GLOBAL_POINTS_TABLE
      )} LIMIT 0;`
        .idempotent(true)
        .timeout(STARTUP_PROBE_SESSION_TIMEOUT_MS)
        .signal(signal);
    } catch (err) {
      if (!isUnknownColumnError(err)) {
        throw err;
      }
      throwMigrationRequired(
        `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_quantized; apply a manual migration (ALTER TABLE ${GLOBAL_POINTS_TABLE} ADD COLUMN embedding_quantized String). If your legacy schema used embedding_bit, rename it or recreate the table.`
      );
    }

    globalPointsTableReady = true;
  });
}
