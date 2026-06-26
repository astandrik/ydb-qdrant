export type JsonRpcId = number | string | null;

export type JsonRpcRequest = {
    id?: JsonRpcId;
    jsonrpc: "2.0";
    method: string;
    params?: unknown;
};

export type JsonRpcResponse =
    | {
          id: JsonRpcId;
          jsonrpc: "2.0";
          result: unknown;
      }
    | {
          error: {
              code: number;
              message: string;
          };
          id: JsonRpcId;
          jsonrpc: "2.0";
      };

export class McpProtocolError extends Error {
    readonly code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isRequest(value: unknown): value is JsonRpcRequest {
    return (
        isRecord(value) &&
        value.jsonrpc === "2.0" &&
        typeof value.method === "string" &&
        (value.id === undefined ||
            typeof value.id === "string" ||
            typeof value.id === "number" ||
            value.id === null)
    );
}

export function response(id: JsonRpcId, result: unknown): JsonRpcResponse {
    return { id, jsonrpc: "2.0", result };
}

export function errorResponse(
    id: JsonRpcId,
    code: number,
    message: string
): JsonRpcResponse {
    return { error: { code, message }, id, jsonrpc: "2.0" };
}
