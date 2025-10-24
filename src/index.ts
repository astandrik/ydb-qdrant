import "dotenv/config";
import type { Server } from "http";
import { buildServer } from "./server";
import { PORT } from "./config/env";
import { logger } from "./logging/logger";
import { readyOrThrow } from "./ydb/client";
import { ensureMetaTable } from "./ydb/schema";

let server: Server | undefined;

async function start(): Promise<void> {
  try {
    await readyOrThrow();
    await ensureMetaTable();
  } catch (err: any) {
    logger.error(
      { err },
      "YDB not ready; startup continues, requests may fail until configured."
    );
  }
  const app = buildServer();
  server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "ydb-qdrant proxy listening");
  });
}

void start();
