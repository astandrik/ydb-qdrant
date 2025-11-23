import { describe, it, expect } from "vitest";
import { buildVectorParam, buildJsonOrEmpty } from "../../src/ydb/helpers.js";
import { Types, TypedValues } from "../../src/ydb/client.js";

describe("ydb/helpers", () => {
  it("builds float vector param without quantization", () => {
    const vec = [0.1, 0.2, 0.3];
    const param = buildVectorParam(vec, "float");

    const expected = TypedValues.list(Types.FLOAT, vec);
    expect(param).toEqual(expected);
  });

  it("uses uint8 vector as-is when already quantized", () => {
    const vec = [0, 128, 255];
    const param = buildVectorParam(vec, "uint8");

    const expected = TypedValues.list(Types.UINT8, vec);
    expect(param).toEqual(expected);
  });

  it("quantizes [0,1] floats into uint8", () => {
    const vec = [0, 0.5, 1];
    const param = buildVectorParam(vec, "uint8");

    const expected = TypedValues.list(Types.UINT8, [0, 128, 255]);
    expect(param).toEqual(expected);
  });

  it("quantizes [-1,1] floats into uint8", () => {
    const vec = [-1, 0, 1];
    const param = buildVectorParam(vec, "uint8");

    const expected = TypedValues.list(Types.UINT8, [0, 128, 255]);
    expect(param).toEqual(expected);
  });

  it("handles constant vectors when quantizing to uint8", () => {
    const vec = [5, 5, 5];
    const param = buildVectorParam(vec, "uint8");

    // Constant vector is already quantized (integers in [0,255]), so it is used as-is
    const expected = TypedValues.list(Types.UINT8, vec);
    expect(param).toEqual(expected);
  });

  it("builds JSON document from payload or empty object", () => {
    const paramWithPayload = buildJsonOrEmpty({ a: 1 });
    const paramEmpty = buildJsonOrEmpty();

    expect(paramWithPayload).toEqual(
      TypedValues.jsonDocument(JSON.stringify({ a: 1 }))
    );
    expect(paramEmpty).toEqual(TypedValues.jsonDocument(JSON.stringify({})));
  });
});
