import {
  readyOrThrow,
  withSession,
  TableDescription,
  Column,
  Types,
} from "../../../src/ydb/client.js";

function isMetaTableNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);

  // local-ydb + ydb-sdk variants observed across versions:
  // - "Table not found"
  // - NotFound (code 400140)
  // - SchemeError (code 400070): []
  return (
    /table.*not found/i.test(msg) ||
    /path.*not found/i.test(msg) ||
    /does not exist/i.test(msg) ||
    /NotFound\s*\(code\s*400140\)/i.test(msg) ||
    (/SchemeError\s*\(code\s*400070\)/i.test(msg) && /:\s*\[\s*\]\s*$/i.test(msg))
  );
}

function isAlreadyExistsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /already exists/i.test(msg) || /path.*exists/i.test(msg);
}

/**
 * Integration tests run against a fresh local-ydb instance in CI.
 * With the current "validate-only" semantics of `ensureMetaTable()`,
 * the metadata table must be created explicitly for integration runs.
 */
export async function createMetaTableIfMissing(): Promise<void> {
  await readyOrThrow();

  await withSession(async (s) => {
    try {
      await s.describeTable("qdr__collections");
      return;
    } catch (err: unknown) {
      if (!isMetaTableNotFoundError(err)) {
        throw err;
      }
    }

    const desc = new TableDescription()
      .withColumns(
        new Column("collection", Types.UTF8),
        new Column("table_name", Types.UTF8),
        new Column("vector_dimension", Types.UINT32),
        new Column("distance", Types.UTF8),
        new Column("vector_type", Types.UTF8),
        new Column("created_at", Types.TIMESTAMP),
        new Column("last_accessed_at", Types.TIMESTAMP)
      )
      .withPrimaryKey("collection");

    try {
      await s.createTable("qdr__collections", desc);
    } catch (err: unknown) {
      // Race-safe: if another test file created the table concurrently, ignore.
      if (!isAlreadyExistsError(err)) {
        throw err;
      }
    }
  });
}


