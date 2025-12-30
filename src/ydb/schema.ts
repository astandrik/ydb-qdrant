import { withSession, TableDescription, Column, Types, Ydb } from "./client.js";
import { logger } from "../logging/logger.js";

export const GLOBAL_POINTS_TABLE = "qdrant_all_points";
// Shared YDB-related constants for repositories.
export { UPSERT_BATCH_SIZE } from "../config/env.js";

let metaTableReady = false;
let metaTableReadyInFlight: Promise<void> | null = null;

let globalPointsTableReady = false;

function throwMigrationRequired(message: string): never {
  logger.error(message);
  throw new Error(message);
}

function isMigrationRequiredError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }
  return (
    /missing required column/i.test(err.message) ||
    /manual schema migration/i.test(err.message)
  );
}

function isTableNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /table.*not found/i.test(msg) ||
    /path.*not found/i.test(msg) ||
    /does not exist/i.test(msg)
  );
}

async function ensureMetaTableOnce(): Promise<void> {
  try {
    await withSession(async (s) => {
      let tableDescription: Awaited<ReturnType<typeof s.describeTable>> | null =
        null;

      try {
        tableDescription = await s.describeTable("qdr__collections");
      } catch (err: unknown) {
        if (!isTableNotFoundError(err)) {
          throw err;
        }

        // Table doesn't exist: create via schema API.
        const desc = new TableDescription()
          .withColumns(
            new Column("collection", Types.UTF8),
            new Column("table_name", Types.UTF8),
            new Column("vector_dimension", Types.UINT32),
            new Column("distance", Types.UTF8),
            new Column("vector_type", Types.UTF8),
            new Column("created_at", Types.TIMESTAMP),
            new Column("last_accessed_at", Types.TIMESTAMP)
          )
          .withPrimaryKey("collection");
        await s.createTable("qdr__collections", desc);
        logger.info("created metadata table qdr__collections");
        return;
      }

      // Table exists: validate required columns.
      const columns = tableDescription.columns ?? [];
      const hasLastAccessedAt = columns.some(
        (col) => col.name === "last_accessed_at"
      );

      if (!hasLastAccessedAt) {
        throwMigrationRequired(
          "Metadata table qdr__collections is missing required column last_accessed_at; please recreate the table or apply a manual schema migration before starting the service"
        );
      }
    });
    metaTableReady = true;
  } catch (err: unknown) {
    if (isMigrationRequiredError(err)) {
      throw err;
    }
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

  await withSession(async (s) => {
    let tableDescription: Awaited<ReturnType<typeof s.describeTable>> | null =
      null;
    try {
      tableDescription = await s.describeTable(GLOBAL_POINTS_TABLE);
    } catch {
      // Table doesn't exist, create it with all columns using the new schema and
      // auto-partitioning enabled.
      const desc = new TableDescription()
        .withColumns(
          new Column("uid", Types.UTF8),
          new Column("point_id", Types.UTF8),
          new Column("embedding", Types.BYTES),
          new Column("embedding_quantized", Types.BYTES),
          new Column("payload", Types.JSON_DOCUMENT)
        )
        .withPrimaryKeys("uid", "point_id");

      desc.withPartitioningSettings({
        partitioningByLoad: Ydb.FeatureFlag.Status.ENABLED,
        partitioningBySize: Ydb.FeatureFlag.Status.ENABLED,
        partitionSizeMb: 100,
      });

      await s.createTable(GLOBAL_POINTS_TABLE, desc);
      globalPointsTableReady = true;
      logger.info(`created global points table ${GLOBAL_POINTS_TABLE}`);
      return;
    }

    // Table exists, require the new embedding_quantized column.
    const columns = tableDescription.columns ?? [];
    const hasEmbeddingQuantized = columns.some(
      (col) => col.name === "embedding_quantized"
    );

    if (!hasEmbeddingQuantized) {
      throwMigrationRequired(
        `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_quantized; please recreate the table or apply a manual schema migration before starting the service`
      );
    }
    // Mark table ready after schema checks/migrations succeed.
    globalPointsTableReady = true;
  });
}
