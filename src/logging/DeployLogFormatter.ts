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

    switch (level) {
        case 60:
        case 50:
            return { level: 40000, levelStr: "ERROR" };
        case 40:
            return { level: 30000, levelStr: "WARNING" };
        case 30:
            return { level: 20000, levelStr: "INFO" };
        case 20:
        case 10:
            return { level: 10000, levelStr: "DEBUG" };
        default:
            return undefined;
    }
}

function getDeployMessage(obj: Record<string, unknown>): string {
    if (typeof obj.msg === "string") {
        return obj.msg;
    }
    if (typeof obj.message === "string") {
        return obj.message;
    }
    return "";
}

function chunkToUtf8Text(chunk: unknown): string {
    if (typeof chunk === "string") {
        return chunk;
    }
    if (Buffer.isBuffer(chunk)) {
        return chunk.toString("utf8");
    }
    if (chunk instanceof Uint8Array) {
        return Buffer.from(chunk).toString("utf8");
    }
    return String(chunk);
}

function convertToDeployLine(obj: Record<string, unknown>): string {
    const fields: Record<string, unknown> = {};
    const msg = getDeployMessage(obj);

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

export function createDeployLogFormatter(): Transform {
    let buffered = "";

    return new Transform({
        readableObjectMode: false,
        writableObjectMode: false,
        transform(chunk: unknown, _encoding, callback) {
            const text = chunkToUtf8Text(chunk);

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
