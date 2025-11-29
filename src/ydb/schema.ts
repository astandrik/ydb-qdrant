import { withSession, TableDescription, Column, Types } from "./client.js";
import { logger } from "../logging/logger.js";
import type { Ydb } from "ydb-sdk";

export const GLOBAL_POINTS_TABLE = "qdrant_all_points";

let globalPointsTableReady = false;

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

  try {
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
      const hasEmbeddingBit = columns.some(
        (col) => col.name === "embedding_bit"
      );

      if (!hasEmbeddingBit) {
        // Add the missing embedding_bit column
        const alterDdl = `
          ALTER TABLE ${GLOBAL_POINTS_TABLE}
          ADD COLUMN embedding_bit String;
        `;
        await s.executeQuery(alterDdl);
        logger.info(
          `added embedding_bit column to existing table ${GLOBAL_POINTS_TABLE}`
        );

        // Backfill existing rows: convert embedding to bit representation
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

      globalPointsTableReady = true;
    });
  } catch (err: unknown) {
    logger.debug({ err }, "ensureGlobalPointsTable: ignored");
  }
}
