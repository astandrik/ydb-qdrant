import { bootstrapMetaTable } from "../../../src/ydb/bootstrapMetaTable.js";

export async function createMetaTableIfMissing(): Promise<void> {
  await bootstrapMetaTable();
}

