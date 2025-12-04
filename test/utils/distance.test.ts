import { describe, it, expect } from "vitest";
import {
  mapDistanceToKnnFn,
  mapDistanceToIndexParam,
} from "../../src/utils/distance.js";
import type { DistanceKind } from "../../src/types.js";

describe("utils/distance", () => {
  it("maps Cosine distance to correct KNN function and order", () => {
    expect(mapDistanceToKnnFn("Cosine")).toEqual({
      fn: "Knn::CosineDistance",
      order: "ASC",
    });
  });

  it("maps Dot distance to correct KNN function and order", () => {
    expect(mapDistanceToKnnFn("Dot")).toEqual({
      fn: "Knn::InnerProductSimilarity",
      order: "DESC",
    });
  });

  it("maps Euclid distance to correct KNN function and order", () => {
    expect(mapDistanceToKnnFn("Euclid")).toEqual({
      fn: "Knn::EuclideanDistance",
      order: "ASC",
    });
  });

  it("maps Manhattan distance to correct KNN function and order", () => {
    expect(mapDistanceToKnnFn("Manhattan")).toEqual({
      fn: "Knn::ManhattanDistance",
      order: "ASC",
    });
  });

  it("falls back to Cosine mapping for unexpected distance in KNN function", () => {
    const distance = "Unexpected" as DistanceKind;
    expect(mapDistanceToKnnFn(distance)).toEqual({
      fn: "Knn::CosineDistance",
      order: "ASC",
    });
  });

  it("maps Cosine distance to correct index param", () => {
    expect(mapDistanceToIndexParam("Cosine")).toBe("cosine");
  });

  it("maps Dot distance to correct index param", () => {
    expect(mapDistanceToIndexParam("Dot")).toBe("inner_product");
  });

  it("maps Euclid distance to correct index param", () => {
    expect(mapDistanceToIndexParam("Euclid")).toBe("euclidean");
  });

  it("maps Manhattan distance to correct index param", () => {
    expect(mapDistanceToIndexParam("Manhattan")).toBe("manhattan");
  });

  it("falls back to cosine index param for unexpected distance", () => {
    const distance = "Unexpected" as DistanceKind;
    expect(mapDistanceToIndexParam(distance)).toBe("cosine");
  });
});
