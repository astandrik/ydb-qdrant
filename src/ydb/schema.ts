import { withSession, TableDescription, Column, Types, Ydb } from "./client.js";
import { logger } from "../logging/logger.js";
import { GLOBAL_POINTS_AUTOMIGRATE_ENABLED } from "../config/env.js";

export const GLOBAL_POINTS_TABLE = "qdrant_all_points";
// Shared YDB-related constants for repositories.
export { UPSERT_BATCH_SIZE } from "../config/env.js";

let globalPointsTableReady = false;

function throwMigrationRequired(message: string): never {
  logger.error(message);
  throw new Error(message);
}

export async function ensureMetaTable(): Promise<void> {
  try {
    await withSession(async (s) => {
      // If table exists, describeTable will succeed
      try {
        const tableDescription = await s.describeTable("qdr__collections");
        const columns = tableDescription.columns ?? [];
        const hasLastAccessedAt = columns.some(
          (col) => col.name === "last_accessed_at"
        );

        if (!hasLastAccessedAt) {
          const alterDdl = `
            ALTER TABLE qdr__collections
            ADD COLUMN last_accessed_at Timestamp;
          `;

          // NOTE: ydb-sdk's public TableSession type does not surface executeSchemeQuery,
          // but the underlying implementation provides it. This cast relies on the
          // current ydb-sdk internals (tested with ydb-sdk v5.11.1) to run ALTER TABLE
          // as a scheme query. If the SDK changes its internal API, this may need to be
          // revisited or replaced with an officially supported migration mechanism.
          const rawSession = s as unknown as {
            sessionId: string;
            api: {
              executeSchemeQuery: (req: {
                sessionId: string;
                yqlText: string;
              }) => Promise<unknown>;
            };
          };

          await rawSession.api.executeSchemeQuery({
            sessionId: rawSession.sessionId,
            yqlText: alterDdl,
          });

          logger.info(
            "added last_accessed_at column to metadata table qdr__collections"
          );
        }
        return;
      } catch {
        // create via schema API
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
      }
    });
  } catch (err: unknown) {
    logger.warn(
      { err },
      "ensureMetaTable: failed to verify or migrate qdr__collections; subsequent operations may fail if schema is incomplete"
    );
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
      if (!GLOBAL_POINTS_AUTOMIGRATE_ENABLED) {
        throwMigrationRequired(
          `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_quantized; apply the migration (e.g., ALTER TABLE ${GLOBAL_POINTS_TABLE} RENAME COLUMN embedding_bit TO embedding_quantized) or set YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true after backup to allow automatic migration.`
        );
      }

      const alterDdl = `
          ALTER TABLE ${GLOBAL_POINTS_TABLE}
          ADD COLUMN embedding_quantized String;
        `;

      // NOTE: Same rationale as in ensureMetaTable: executeSchemeQuery is not part of
      // the public TableSession TypeScript surface, so we reach into the underlying
      // ydb-sdk implementation (verified with ydb-sdk v5.11.1) to apply schema changes.
      // If future SDK versions alter this shape, this cast and migration path must be
      // updated accordingly.
      const rawSession = s as unknown as {
        sessionId: string;
        api: {
          executeSchemeQuery: (req: {
            sessionId: string;
            yqlText: string;
          }) => Promise<unknown>;
        };
      };

      await rawSession.api.executeSchemeQuery({
        sessionId: rawSession.sessionId,
        yqlText: alterDdl,
      });

      logger.info(
        `added embedding_quantized column to existing table ${GLOBAL_POINTS_TABLE}`
      );
    }
    // Mark table ready after schema checks/migrations succeed.
    globalPointsTableReady = true;
  });
}
