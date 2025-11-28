import "dotenv/config";
import { buildServer } from "./server.js";
import { PORT, TABLE_LAYOUT, isOneTableLayout } from "./config/env.js";
import { logger } from "./logging/logger.js";
import { readyOrThrow } from "./ydb/client.js";
import { ensureMetaTable, ensureGlobalPointsTable } from "./ydb/schema.js";

async function start(): Promise<void> {
  try {
    await readyOrThrow();
    await ensureMetaTable();
    if (isOneTableLayout(TABLE_LAYOUT)) {
      await ensureGlobalPointsTable();
    }
  } catch (err: unknown) {
    logger.error(
      { err },
      "YDB not ready; startup continues, requests may fail until configured."
    );
  }
  const app = buildServer();
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "ydb-qdrant proxy listening");
  });
}

void start();
