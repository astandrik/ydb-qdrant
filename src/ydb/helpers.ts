import { Types, TypedValues } from "./client.js";

export function buildVectorParam(vector: number[]) {
  const list = vector;
  return TypedValues.list(Types.FLOAT, list);
}

export function buildJsonOrEmpty(payload?: Record<string, unknown>) {
  return TypedValues.jsonDocument(JSON.stringify(payload ?? {}));
}
