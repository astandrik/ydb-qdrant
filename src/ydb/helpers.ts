import { Types, TypedValues } from "./client.js";
import {
  vectorToFloatBinary,
  vectorToBitBinary,
} from "../utils/vectorBinary.js";

export function buildVectorParam(vector: number[]) {
  return TypedValues.list(Types.FLOAT, vector);
}

export function buildJsonOrEmpty(payload?: Record<string, unknown>) {
  return TypedValues.jsonDocument(JSON.stringify(payload ?? {}));
}

export function buildVectorBinaryParams(vector: number[]) {
  return {
    float: vectorToFloatBinary(vector),
    bit: vectorToBitBinary(vector),
  };
}
