import type { Session, IAuthService } from "ydb-sdk";
import { createRequire } from "module";
import { YDB_DATABASE, YDB_ENDPOINT } from "../config/env.js";

const require = createRequire(import.meta.url);
const {
  Driver,
  getCredentialsFromEnv,
  Types,
  TypedValues,
  TableDescription,
  Column,
} = require("ydb-sdk") as typeof import("ydb-sdk");

export { Types, TypedValues, TableDescription, Column };

type DriverConfig = {
  endpoint?: string;
  database?: string;
  connectionString?: string;
  authService?: IAuthService;
};

let overrideConfig: DriverConfig | undefined;
let driver: InstanceType<typeof Driver> | undefined;

export function configureDriver(config: DriverConfig): void {
  if (driver) {
    // Driver already created; keep existing connection settings.
    return;
  }
  overrideConfig = config;
}

function getOrCreateDriver(): InstanceType<typeof Driver> {
  if (driver) {
    return driver;
  }

  const base =
    overrideConfig?.connectionString != null
      ? { connectionString: overrideConfig.connectionString }
      : {
          endpoint: overrideConfig?.endpoint ?? YDB_ENDPOINT,
          database: overrideConfig?.database ?? YDB_DATABASE,
        };

  driver = new Driver({
    ...base,
    authService: overrideConfig?.authService ?? getCredentialsFromEnv(),
  });

  return driver;
}

export async function readyOrThrow(): Promise<void> {
  const d = getOrCreateDriver();
  const ok = await d.ready(10000);
  if (!ok) {
    throw new Error(
      "YDB driver is not ready in 10s. Check connectivity and credentials."
    );
  }
}

export async function withSession<T>(
  fn: (s: Session) => Promise<T>
): Promise<T> {
  const d = getOrCreateDriver();
  return await d.tableClient.withSession(fn, 15000);
}
