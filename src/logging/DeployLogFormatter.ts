import { Transform } from "node:stream";

type DeployLevelStr = "ERROR" | "WARNING" | "INFO" | "DEBUG";

type DeployLogDescriptor = {
  "@fields": Record<string, unknown>;
  message: string;
  level?: number;
  levelStr?: DeployLevelStr;
  stackTrace?: string;
};

const RESERVED_FIELDS = new Set([
  "msg",
  "message",
  "level",
  "levelStr",
  "@fields",
  "stackTrace",
  "stack",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPinoLine(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }
  return "hostname" in value && "pid" in value;
}

function mapPinoLevelToDeploy(
  level: unknown
): { level: number; levelStr: DeployLevelStr } | undefined {
  if (typeof level !== "number") {
    return undefined;
  }
  // Mirror ydb-embedded-ui/core deploy formatter mapping.
  switch (level) {
    case 60: // fatal
    case 50: // error
      return { level: 40000, levelStr: "ERROR" };
    case 40: // warn
      return { level: 30000, levelStr: "WARNING" };
    case 30: // info
      return { level: 20000, levelStr: "INFO" };
    case 20: // debug
    case 10: // trace
      return { level: 10000, levelStr: "DEBUG" };
    default:
      return undefined;
  }
}

function convertToDeployLine(obj: Record<string, unknown>): string {
  const fields: Record<string, unknown> = {};
  const msg =
    typeof obj.msg === "string"
      ? obj.msg
      : typeof obj.message === "string"
      ? obj.message
      : "";

  const mapped = mapPinoLevelToDeploy(obj.level);
  const log: DeployLogDescriptor = {
    "@fields": fields,
    message: msg,
    ...(mapped ? { level: mapped.level, levelStr: mapped.levelStr } : {}),
  };

  if (typeof obj.stack === "string" && obj.stack.length > 0) {
    log.stackTrace = obj.stack;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (!RESERVED_FIELDS.has(key)) {
      fields[key] = value;
    }
  }

  return JSON.stringify(log);
}

/**
 * Create a Transform stream that converts Pino JSON lines to the deploy
 * log format used by ydb-embedded-ui (@yandex-data-ui/core).
 */
export function createDeployLogFormatter(): Transform {
  let buffered = "";

  return new Transform({
    readableObjectMode: false,
    writableObjectMode: false,
    transform(chunk: unknown, _encoding, callback) {
      const text =
        typeof chunk === "string"
          ? chunk
          : Buffer.isBuffer(chunk)
          ? chunk.toString("utf8")
          : chunk instanceof Uint8Array
          ? Buffer.from(chunk).toString("utf8")
          : String(chunk);

      buffered += text;

      let nl: number;
      while ((nl = buffered.indexOf("\n")) !== -1) {
        const line = buffered.slice(0, nl);
        buffered = buffered.slice(nl + 1);

        if (line.trim().length === 0) {
          this.push("\n");
          continue;
        }

        try {
          const parsed = JSON.parse(line) as unknown;
          if (!isPinoLine(parsed)) {
            this.push(line + "\n");
            continue;
          }
          this.push(convertToDeployLine(parsed) + "\n");
        } catch {
          this.push(line + "\n");
        }
      }

      callback();
    },
    flush(callback) {
      if (buffered.trim().length === 0) {
        callback();
        return;
      }
      const line = buffered;
      buffered = "";
      try {
        const parsed = JSON.parse(line) as unknown;
        if (!isPinoLine(parsed)) {
          this.push(line + "\n");
        } else {
          this.push(convertToDeployLine(parsed) + "\n");
        }
      } catch {
        this.push(line + "\n");
      }
      callback();
    },
  });
}
