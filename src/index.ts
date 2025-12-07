import "dotenv/config";
import { buildServer } from "./server.js";
import { PORT } from "./config/env.js";
import { logger } from "./logging/logger.js";
import { readyOrThrow, isCompilationTimeoutError } from "./ydb/client.js";
import { ensureMetaTable, ensureGlobalPointsTable } from "./ydb/schema.js";
import { verifyCollectionsQueryCompilationForStartup } from "./repositories/collectionsRepo.js";

async function start(): Promise<void> {
  try {
    await readyOrThrow();
    await ensureMetaTable();
    await ensureGlobalPointsTable();
    await verifyCollectionsQueryCompilationForStartup();
    logger.info(
      "YDB compilation startup probe for qdr__collections completed successfully"
    );
  } catch (err: unknown) {
    if (isCompilationTimeoutError(err)) {
      logger.error(
        { err },
        "Fatal YDB compilation timeout during startup probe; exiting so supervisor can restart the process"
      );
      process.exit(1);
    }
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
