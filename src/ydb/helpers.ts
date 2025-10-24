import { Types, TypedValues } from "./client.js";

export function buildVectorParam(
  vector: number[],
  vectorType: "float" | "uint8"
) {
  let list: number[];
  
  if (vectorType === "uint8") {
    // Check if vector is already quantized (integers in [0,255])
    const isAlreadyQuantized = vector.every(
      v => Number.isInteger(v) && v >= 0 && v <= 255
    );
    
    if (isAlreadyQuantized) {
      list = vector;
    } else {
      // Float embeddings need quantization. Per YDB docs (knn.md lines 282-294):
      // Formula: ((x - min) / (max - min)) * 255
      const min = Math.min(...vector);
      const max = Math.max(...vector);
      
      // Determine quantization strategy based on detected range
      if (min >= 0 && max <= 1.01) {
        // Normalized [0,1] embeddings (common for some models)
        list = vector.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255));
      } else if (min >= -1.01 && max <= 1.01) {
        // Normalized [-1,1] embeddings (most common)
        // Map to [0,255]: ((x + 1) / 2) * 255 = (x + 1) * 127.5
        list = vector.map(v => Math.round((Math.max(-1, Math.min(1, v)) + 1) * 127.5));
      } else {
        // General case: linear scaling from [min,max] to [0,255]
        const range = max - min;
        if (range > 0) {
          list = vector.map(v => Math.round(((v - min) / range) * 255));
        } else {
          // All values identical; map to midpoint
          list = vector.map(() => 127);
        }
      }
    }
  } else {
    list = vector;
  }
  
  return TypedValues.list(
    vectorType === "uint8" ? Types.UINT8 : Types.FLOAT,
    list
  );
}

export function buildJsonOrEmpty(payload?: Record<string, unknown>) {
  return TypedValues.jsonDocument(JSON.stringify(payload ?? {}));
}
