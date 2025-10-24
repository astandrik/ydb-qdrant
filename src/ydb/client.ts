import type { Session } from "ydb-sdk";
import { createRequire } from "module";
import { YDB_DATABASE, YDB_ENDPOINT } from "../config/env.js";
import { logger } from "../logging/logger.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  Driver,
  getCredentialsFromEnv,
  Types,
  TypedValues,
  TableDescription,
  Column,
} = require("ydb-sdk");

export { Types, TypedValues, TableDescription, Column };

export const driver = new (Driver as new (args: any) => any)({
  endpoint: YDB_ENDPOINT,
  database: YDB_DATABASE,
  authService: getCredentialsFromEnv(),
});

export async function readyOrThrow(): Promise<void> {
  const ok = await driver.ready(10000);
  if (!ok) {
    throw new Error(
      "YDB driver is not ready in 10s. Check connectivity and credentials."
    );
  }
}

export async function withSession<T>(
  fn: (s: Session) => Promise<T>
): Promise<T> {
  return await driver.tableClient.withSession(fn as any, 15000);
}
