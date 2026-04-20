import { vectorToFloatBinary } from "../utils/vectorBinary.js";

export function buildVectorBinaryParams(vector: number[]) {
    return {
        float: vectorToFloatBinary(vector),
    };
}
