import {
  vectorToFloatBinary,
  vectorToBitBinary,
} from "../utils/vectorBinary.js";

export function buildVectorBinaryParams(vector: number[]) {
  return {
    float: vectorToFloatBinary(vector),
    bit: vectorToBitBinary(vector),
  };
}
