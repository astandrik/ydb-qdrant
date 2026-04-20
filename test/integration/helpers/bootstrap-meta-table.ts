import {
  GLOBAL_POINTS_TABLE,
  POINTS_BY_FILE_LOOKUP_TABLE,
  ensureGlobalPointsTable,
  ensurePointsByFileTable,
} from "../../../src/ydb/schema.js";
import { bootstrapMetaTable } from "../../../src/ydb/bootstrapMetaTable.js";
import { withSession } from "../../../src/ydb/client.js";

async function recreateExactOnlyTablesIfNeeded(): Promise<void> {
  let shouldRecreate = false;

  await withSession(async (session) => {
    try {
      const desc = await session.describeTable(GLOBAL_POINTS_TABLE);
      const columns = (desc.columns ?? []).map((column) => column.name);
      shouldRecreate = columns.includes("embedding_quantized");
    } catch {
      shouldRecreate = false;
    }
  });

  if (!shouldRecreate) {
    await ensureGlobalPointsTable();
    await ensurePointsByFileTable();
    return;
  }

  await withSession(async (session) => {
    try {
      await session.dropTable(GLOBAL_POINTS_TABLE);
    } catch {
      // ignore if already missing
    }

    try {
      await session.dropTable(POINTS_BY_FILE_LOOKUP_TABLE);
    } catch {
      // ignore if already missing
    }
  });

  await ensureGlobalPointsTable();
  await ensurePointsByFileTable();
}

export async function createMetaTableIfMissing(): Promise<void> {
  await bootstrapMetaTable();
  await recreateExactOnlyTablesIfNeeded();
}
