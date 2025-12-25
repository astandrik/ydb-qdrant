import { describe, it, expect } from "vitest";
import { buildVectorBinaryParams } from "../../src/ydb/helpers.js";

describe("ydb/helpers", () => {
  it("builds binary params for float and bit vectors", () => {
    const vec = [1, 0, -1];
    const params = buildVectorBinaryParams(vec);

    expect(Buffer.isBuffer(params.float)).toBe(true);
    expect(Buffer.isBuffer(params.bit)).toBe(true);
    expect(params.float[params.float.length - 1]).toBe(1);
    expect(params.bit[params.bit.length - 1]).toBe(10);
  });
});
