import {
  Column,
  TableDescription,
  Types,
  destroyDriver,
  readyOrThrow,
  withSession,
} from "./client.js";

function isTableNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /table.*not found/i.test(msg) ||
    /path.*not found/i.test(msg) ||
    /does not exist/i.test(msg) ||
    /NotFound\s*\(code\s*400140\)/i.test(msg) ||
    (/SchemeError\s*\(code\s*400070\)/i.test(msg) &&
      /:\s*\[\s*\]\s*$/i.test(msg))
  );
}

function isAlreadyExistsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /already exists/i.test(msg) || /path.*exists/i.test(msg);
}

/**
 * Creates the qdr__collections metadata table if it does not exist.
 *
 * Intended for CI and local dev environments where a fresh YDB is provisioned
 * and schema creation is handled out-of-band from `ensureMetaTable()`.
 */
export async function bootstrapMetaTable(): Promise<void> {
  await readyOrThrow();

  await withSession(async (s) => {
    let desc: Awaited<ReturnType<typeof s.describeTable>> | null = null;
    try {
      desc = await s.describeTable("qdr__collections");
    } catch (err: unknown) {
      if (!isTableNotFoundError(err)) {
        throw err;
      }

      const td = new TableDescription()
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
        await s.createTable("qdr__collections", td);
        console.log("bootstrapMetaTable: created qdr__collections");
      } catch (createErr: unknown) {
        if (!isAlreadyExistsError(createErr)) {
          throw createErr;
        }
      }

      desc = await s.describeTable("qdr__collections");
    }

    const cols = desc?.columns ?? [];
    const hasLastAccessedAt = cols.some((c) => c.name === "last_accessed_at");
    if (!hasLastAccessedAt) {
      throw new Error(
        "bootstrapMetaTable: qdr__collections exists but is missing required column last_accessed_at"
      );
    }
  });
}

// CLI entrypoint
if (process.argv[1]?.endsWith("bootstrapMetaTable.js")) {
  const main = async (): Promise<void> => {
    await bootstrapMetaTable();
    // Important: ydb-sdk driver/session pool keeps timers alive; explicitly
    // destroy it so this script can terminate in CI steps.
    await destroyDriver();
  };

  main()
    .then(() => {
      process.exit(0);
    })
    .catch(async (err: unknown) => {
      console.error(err);
      try {
        await destroyDriver();
      } catch {
        // ignore cleanup errors
      }
      process.exit(1);
    });
}
