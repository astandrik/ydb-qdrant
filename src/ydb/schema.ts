import { withSession, TableDescription, Column, Types } from "./client.js";
import { logger } from "../logging/logger.js";

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
