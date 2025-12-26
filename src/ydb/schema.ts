import { withSession } from "./client.js";
import { logger } from "../logging/logger.js";
import {
  GLOBAL_POINTS_AUTOMIGRATE_ENABLED,
  STARTUP_PROBE_SESSION_TIMEOUT_MS,
} from "../config/env.js";

export const GLOBAL_POINTS_TABLE = "qdrant_all_points";
// Shared YDB-related constants for repositories.
export { UPSERT_BATCH_SIZE } from "../config/env.js";

const SCHEMA_DDL_TIMEOUT_MS = 5000;

let metaTableReady = false;
let metaTableReadyInFlight: Promise<void> | null = null;

let globalPointsTableReady = false;

function collectIssueMessages(err: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<unknown>();

  const walk = (v: unknown): void => {
    if (v === null || typeof v !== "object") {
      return;
    }
    if (seen.has(v)) {
      return;
    }
    seen.add(v);

    const maybeMessage = (v as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      out.push(maybeMessage);
    }

    const maybeIssues = (v as { issues?: unknown }).issues;
    if (Array.isArray(maybeIssues)) {
      for (const child of maybeIssues) {
        walk(child);
      }
    }
  };

  walk(err);
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
  try {
    await withSession(async (sql, signal) => {
      const createTableYql = `
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
      `;

      try {
        await sql`${sql.unsafe(createTableYql)}`
          .idempotent(true)
          .timeout(SCHEMA_DDL_TIMEOUT_MS)
          .signal(signal);
        logger.info("created metadata table qdr__collections");
      } catch (err) {
        if (!isAlreadyExistsError(err)) {
          throw err;
        }
      }

      // Best-effort schema migration: add last_accessed_at if it is missing.
      try {
        await sql`SELECT last_accessed_at FROM qdr__collections LIMIT 0;`
          .idempotent(true)
          .timeout(STARTUP_PROBE_SESSION_TIMEOUT_MS)
          .signal(signal);
      } catch (err) {
        if (!isUnknownColumnError(err)) {
          throw err;
        }
        const alter = `
          ALTER TABLE qdr__collections
          ADD COLUMN last_accessed_at Timestamp;
        `;
        await sql`${sql.unsafe(alter)}`
          .idempotent(true)
          .timeout(SCHEMA_DDL_TIMEOUT_MS)
          .signal(signal);
        logger.info(
          "added last_accessed_at column to metadata table qdr__collections"
        );
      }
    });

    metaTableReady = true;
  } catch (err: unknown) {
    logger.warn(
      { err },
      "ensureMetaTable: failed to verify or migrate qdr__collections; subsequent operations may fail if schema is incomplete"
    );
  }
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
    const createTableYql = `
      CREATE TABLE ${GLOBAL_POINTS_TABLE} (
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
    `;

    try {
      await sql`${sql.unsafe(createTableYql)}`
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

    // Require the embedding_quantized column.
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

      if (!GLOBAL_POINTS_AUTOMIGRATE_ENABLED) {
        throwMigrationRequired(
          `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_quantized; apply the migration (e.g., ALTER TABLE ${GLOBAL_POINTS_TABLE} RENAME COLUMN embedding_bit TO embedding_quantized) or set YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true after backup to allow automatic migration.`
        );
      }

      const alter = `
        ALTER TABLE ${GLOBAL_POINTS_TABLE}
        ADD COLUMN embedding_quantized String;
      `;
      await sql`${sql.unsafe(alter)}`
        .idempotent(true)
        .timeout(SCHEMA_DDL_TIMEOUT_MS)
        .signal(signal);
      logger.info(
        `added embedding_quantized column to existing table ${GLOBAL_POINTS_TABLE}`
      );
    }

    globalPointsTableReady = true;
  });
}
