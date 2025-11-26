import { describe, it, expect } from "vitest";
import { buildVectorParam, buildJsonOrEmpty } from "../../src/ydb/helpers.js";
import { Types, TypedValues } from "../../src/ydb/client.js";

describe("ydb/helpers", () => {
  it("builds float vector param", () => {
    const vec = [0.1, 0.2, 0.3];
    const param = buildVectorParam(vec);

    const expected = TypedValues.list(Types.FLOAT, vec);
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
