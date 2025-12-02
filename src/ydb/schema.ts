import { withSession, TableDescription, Column, Types } from "./client.js";
import { logger } from "../logging/logger.js";
import { GLOBAL_POINTS_AUTOMIGRATE_ENABLED } from "../config/env.js";
import type { Ydb } from "ydb-sdk";

export const GLOBAL_POINTS_TABLE = "qdrant_all_points";
// Shared YDB-related constants for repositories.
export const UPSERT_BATCH_SIZE = 100;

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
        await s.describeTable("qdr__collections");
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
            new Column("created_at", Types.TIMESTAMP)
          )
          .withPrimaryKey("collection");
        await s.createTable("qdr__collections", desc);
        logger.info("created metadata table qdr__collections");
      }
    });
  } catch (err: unknown) {
    logger.debug({ err }, "ensureMetaTable: ignored");
  }
}

export async function ensureGlobalPointsTable(): Promise<void> {
  if (globalPointsTableReady) {
    return;
  }

  await withSession(async (s) => {
    let tableDescription: Ydb.Table.DescribeTableResult | null = null;
    try {
      tableDescription = await s.describeTable(GLOBAL_POINTS_TABLE);
    } catch {
      // Table doesn't exist, create it with all columns
      const desc = new TableDescription()
        .withColumns(
          new Column("uid", Types.UTF8),
          new Column("point_id", Types.UTF8),
          new Column("embedding", Types.BYTES),
          new Column("embedding_bit", Types.BYTES),
          new Column("payload", Types.JSON_DOCUMENT)
        )
        .withPrimaryKeys("uid", "point_id");
      await s.createTable(GLOBAL_POINTS_TABLE, desc);
      globalPointsTableReady = true;
      logger.info(`created global points table ${GLOBAL_POINTS_TABLE}`);
      return;
    }

    // Table exists, check if embedding_bit column is present
    const columns = tableDescription.columns ?? [];
    const hasEmbeddingBit = columns.some((col) => col.name === "embedding_bit");

    let needsBackfill = false;

    if (!hasEmbeddingBit) {
      if (!GLOBAL_POINTS_AUTOMIGRATE_ENABLED) {
        throwMigrationRequired(
          `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_bit; set YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true after backup to apply the migration manually.`
        );
      }

      const alterDdl = `
          ALTER TABLE ${GLOBAL_POINTS_TABLE}
          ADD COLUMN embedding_bit String;
        `;

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
        `added embedding_bit column to existing table ${GLOBAL_POINTS_TABLE}`
      );
      needsBackfill = true;
    } else {
      const checkNullsDdl = `
          SELECT 1 AS has_null
          FROM ${GLOBAL_POINTS_TABLE}
          WHERE embedding_bit IS NULL
          LIMIT 1;
        `;
      const checkRes = await s.executeQuery(checkNullsDdl);
      const rows = checkRes?.resultSets?.[0]?.rows ?? [];
      needsBackfill = rows.length > 0;
    }

    if (needsBackfill) {
      if (!GLOBAL_POINTS_AUTOMIGRATE_ENABLED) {
        throwMigrationRequired(
          `Global points table ${GLOBAL_POINTS_TABLE} requires backfill for embedding_bit; set YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true after backup to apply the migration manually.`
        );
      }

      const backfillDdl = `
          UPDATE ${GLOBAL_POINTS_TABLE}
          SET embedding_bit = Untag(Knn::ToBinaryStringBit(Knn::FloatFromBinaryString(embedding)), "BitVector")
          WHERE embedding_bit IS NULL;
        `;
      await s.executeQuery(backfillDdl);
      logger.info(
        `backfilled embedding_bit column from embedding in ${GLOBAL_POINTS_TABLE}`
      );
    }

    // Mark table ready only after schema (and any required backfill) succeed
    globalPointsTableReady = true;
  });
}
