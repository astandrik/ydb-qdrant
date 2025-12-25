import "dotenv/config";
import { buildServer } from "./server.js";
import { PORT } from "./config/env.js";
import { logger } from "./logging/logger.js";
import { readyOrThrow, isCompilationTimeoutError } from "./ydb/client.js";
import { ensureMetaTable, ensureGlobalPointsTable } from "./ydb/schema.js";
import { verifyCollectionsQueryCompilationForStartup } from "./repositories/collectionsRepo.js";
import { scheduleExit } from "./utils/exit.js";

function describeUnknownError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function installStderrAsErrorLogger(): void {
  // Some infra log collectors treat raw stderr lines as DEBUG by default.
  // Redirect stderr writes into structured error logs so severity is preserved.
  // NOTE: This intentionally suppresses the original stderr output.
  process.stderr.write = ((
    chunk: string | Uint8Array,
    encoding?: BufferEncoding | ((err?: Error) => void),
    cb?: (err?: Error) => void
  ): boolean => {
    const callback = typeof encoding === "function" ? encoding : cb;
    const enc = typeof encoding === "string" ? encoding : undefined;

    const text =
      typeof chunk === "string"
        ? chunk
        : Buffer.from(chunk).toString(enc ?? "utf8");

    for (const line of text.split(/\r?\n/)) {
      if (line.length > 0) {
        logger.error({ stream: "stderr" }, line);
      }
    }

    if (callback) {
      callback();
    }
    return true;
  }) as typeof process.stderr.write;
}

installStderrAsErrorLogger();

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  scheduleExit(1);
});

process.on("unhandledRejection", (reason) => {
  if (reason instanceof Error) {
    logger.fatal({ err: reason }, "Unhandled rejection");
  } else {
    logger.fatal(
      { err: new Error(describeUnknownError(reason)), reason },
      "Unhandled rejection"
    );
  }
  scheduleExit(1);
});

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
