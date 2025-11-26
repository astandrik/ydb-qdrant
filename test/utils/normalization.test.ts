import { describe, it, expect } from "vitest";
import { extractVectorLoose } from "../../src/utils/normalization.js";

describe("utils/normalization/extractVectorLoose", () => {
  it("returns undefined for non-object inputs", () => {
    expect(extractVectorLoose(null)).toBeUndefined();
    expect(extractVectorLoose(42)).toBeUndefined();
    expect(extractVectorLoose("str")).toBeUndefined();
    expect(extractVectorLoose(true)).toBeUndefined();
    expect(extractVectorLoose([])).toBeUndefined();
  });

  it("returns undefined when object has no numeric array", () => {
    const body = { a: "foo", b: 1, c: { d: "bar" } };
    expect(extractVectorLoose(body)).toBeUndefined();
  });

  it("prefers top-level vector property", () => {
    const vec = [1, 2, 3];
    const body = { vector: vec, embedding: [9, 9, 9] };
    expect(extractVectorLoose(body)).toBe(vec);
  });

  it("falls back to top-level embedding when vector is missing", () => {
    const vec = [0.1, 0.2];
    const body = { embedding: vec };
    expect(extractVectorLoose(body)).toBe(vec);
  });

  it("reads vector from query.vector", () => {
    const vec = [3, 4, 5];
    const body = { query: { vector: vec } };
    expect(extractVectorLoose(body)).toBe(vec);
  });

  it("reads vector from query.nearest.vector when query.vector is absent", () => {
    const vec = [6, 7, 8];
    const body = { query: { nearest: { vector: vec } } };
    expect(extractVectorLoose(body)).toBe(vec);
  });

  it("reads vector from top-level nearest.vector when query is absent", () => {
    const vec = [9, 10];
    const body = { nearest: { vector: vec } };
    expect(extractVectorLoose(body)).toBe(vec);
  });

  it("finds first top-level numeric array when no special keys are present", () => {
    const expected = [1, 2, 3];
    const body = {
      foo: expected,
      bar: [9, 9, 9],
    };
    expect(extractVectorLoose(body)).toBe(expected);
  });

  it("recurses into nested objects up to depth 3", () => {
    const vec = [1, 2];
    const body = {
      level1: {
        level2: {
          level3: {
            vector: vec,
          },
        },
      },
    };
    expect(extractVectorLoose(body)).toBe(vec);
  });

  it("does not search deeper than depth 3", () => {
    const vec = [1, 2];
    const body = {
      level1: {
        level2: {
          level3: {
            level4: {
              vector: vec,
            },
          },
        },
      },
    };
    expect(extractVectorLoose(body)).toBeUndefined();
  });

  it("ignores arrays that are not numeric arrays", () => {
    const body = {
      bad: [1, "2"],
      good: [3, 4],
    };
    expect(extractVectorLoose(body)).toEqual([3, 4]);
  });

  it("can find numeric arrays nested in arbitrary keys", () => {
    const vec = [0.4, 0.5, 0.6];
    const body = {
      outer: {
        inner: {
          something: vec,
        },
      },
    };
    expect(extractVectorLoose(body)).toBe(vec);
  });
});
