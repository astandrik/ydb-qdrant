import { Types, TypedValues } from "./client.js";

export function buildVectorParam(
  vector: number[],
  vectorType: "float" | "uint8"
) {
  const list =
    vectorType === "uint8"
      ? vector.map((v) => Math.max(0, Math.min(255, Math.round(v))))
      : vector;
  return TypedValues.list(
    vectorType === "uint8" ? Types.UINT8 : Types.FLOAT,
    list
  );
}

export function buildJsonOrEmpty(payload?: Record<string, unknown>) {
  return TypedValues.jsonDocument(JSON.stringify(payload ?? {}));
}
