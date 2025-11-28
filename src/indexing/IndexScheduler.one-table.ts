import { logger } from "../logging/logger.js";

export function requestIndexBuildOneTable(tableName: string): void {
  logger.info(
    { tableName },
    "index build skipped (one_table mode: global vector index not supported)"
  );
}


