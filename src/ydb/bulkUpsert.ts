import { create } from "@bufbuild/protobuf";
import { StatusIds_StatusCode, type IssueMessage } from "@ydbjs/api/operation";
import { OperationServiceDefinition } from "@ydbjs/api/operation";
import { TableServiceDefinition } from "@ydbjs/api/table";
import { TypedValueSchema } from "@ydbjs/api/value";
import { YDBError } from "@ydbjs/error";
import type { List } from "@ydbjs/value/list";
import { setTimeout as sleep } from "node:timers/promises";
import { __getDriverForInternalUse } from "./client.js";

function tablePath(database: string, tableName: string): string {
  const db = database.endsWith("/") ? database.slice(0, -1) : database;
  const t = tableName.startsWith("/") ? tableName : `/${tableName}`;
  return `${db}${t}`;
}

async function waitOperationReady(args: {
  operationClient: {
    getOperation: (
      req: { id: string },
      opts: { signal: AbortSignal }
    ) => Promise<{
      operation?: {
        ready: boolean;
        status: StatusIds_StatusCode;
        issues: IssueMessage[];
      };
    }>;
  };
  operationId: string;
  signal: AbortSignal;
}): Promise<{ status: StatusIds_StatusCode; issues: IssueMessage[] }> {
  for (;;) {
    const resp = await args.operationClient.getOperation(
      { id: args.operationId },
      { signal: args.signal }
    );

    const op = resp.operation;
    if (!op) {
      throw new Error("BulkUpsert: getOperation returned no operation");
    }
    if (op.ready) {
      return { status: op.status, issues: op.issues };
    }
    // Small delay before next poll.
    await sleep(25, undefined, { signal: args.signal });
  }
}

export async function bulkUpsertRowsOnce(args: {
  tableName: string;
  rowsValue: List;
  timeoutMs: number;
}): Promise<void> {
  const d = __getDriverForInternalUse();

  const fullTablePath = tablePath(d.database, args.tableName);
  const signal = AbortSignal.timeout(args.timeoutMs);

  await d.ready(signal);

  const tableClient = d.createClient(TableServiceDefinition);
  const operationClient = d.createClient(OperationServiceDefinition);

  const typedRows = create(TypedValueSchema, {
    type: args.rowsValue.type.encode(),
    value: args.rowsValue.encode(),
  });

  const resp = await tableClient.bulkUpsert(
    { table: fullTablePath, rows: typedRows },
    { signal }
  );

  const op = resp.operation;
  if (!op) {
    throw new Error("BulkUpsert: response has no operation");
  }

  const final = op.ready
    ? { status: op.status, issues: op.issues }
    : op.id
    ? await waitOperationReady({ operationClient, operationId: op.id, signal })
    : { status: op.status, issues: op.issues };

  if (final.status !== StatusIds_StatusCode.SUCCESS) {
    throw new YDBError(final.status, final.issues);
  }
}
