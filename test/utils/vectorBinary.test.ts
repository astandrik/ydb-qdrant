import { describe, it, expect } from "vitest";
import {
  vectorToFloatBinary,
  vectorToBitBinary,
} from "../../src/utils/vectorBinary.js";

describe("vectorBinary utilities", () => {
  it("encodes float vectors with correct length and marker", () => {
    const vec = [1, -2, 3.5];
    const buf = vectorToFloatBinary(vec);

    // 3 floats * 4 bytes + 1 marker byte
    expect(buf.length).toBe(3 * 4 + 1);
    expect(buf[buf.length - 1]).toBe(1);
  });

  it("encodes bit vectors with correct length and marker", () => {
    const vec = [1, 0, -1, 2, 0.1];
    const buf = vectorToBitBinary(vec);

    const expectedBytes = Math.ceil(vec.length / 8) + 2;
    expect(buf.length).toBe(expectedBytes);
    expect(buf[buf.length - 1]).toBe(10);
    // Number of unused bits in the last data byte.
    const expectedUnusedBits =
      vec.length === 0 ? 0 : (8 - (vec.length % 8)) % 8;
    expect(buf[buf.length - 2]).toBe(expectedUnusedBits);
  });

  it("throws on non-finite values", () => {
    const vec = [0, Number.NaN, 1];
    expect(() => vectorToFloatBinary(vec)).toThrow(/Non-finite value/);
    expect(() => vectorToBitBinary(vec)).toThrow(/Non-finite value/);
  });
});
