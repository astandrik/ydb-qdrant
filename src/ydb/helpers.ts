import { Types, TypedValues } from "./client.js";

export function buildVectorParam(vector: number[]) {
  return TypedValues.list(Types.FLOAT, vector);
}

export function buildJsonOrEmpty(payload?: Record<string, unknown>) {
  return TypedValues.jsonDocument(JSON.stringify(payload ?? {}));
}
