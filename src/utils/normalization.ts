import { isRecord } from "./typeGuards.js";

export interface SearchNormalizationResult {
  vector: number[] | undefined;
  top: number | undefined;
  withPayload: boolean | undefined;
  scoreThreshold: number | undefined;
  filter?: unknown;
}

export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((x) => typeof x === "number");
}

export function extractVectorLoose(
  body: unknown,
  depth = 0
): number[] | undefined {
  if (!isRecord(body) || depth > 3) {
    return undefined;
  }
  const obj = body;

  if (isNumberArray(obj.vector)) return obj.vector;
  if (isNumberArray(obj.embedding)) return obj.embedding;

  const query = isRecord(obj.query) ? obj.query : undefined;
  if (query) {
    const queryVector = query.vector;
    if (isNumberArray(queryVector)) return queryVector;
    const nearest = isRecord(query.nearest) ? query.nearest : undefined;
    if (nearest && isNumberArray(nearest.vector)) {
      return nearest.vector;
    }
  }

  const nearest = isRecord(obj.nearest) ? obj.nearest : undefined;
  if (nearest && isNumberArray(nearest.vector)) {
    return nearest.vector;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (isNumberArray(value)) {
      return value;
    }
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === "object") {
      const found = extractVectorLoose(value, depth + 1);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

export function normalizeSearchBodyForSearch(
  body: unknown
): SearchNormalizationResult {
  if (!isRecord(body)) {
    return {
      vector: undefined,
      top: undefined,
      withPayload: undefined,
      scoreThreshold: undefined,
    };
  }
  const b = body;
  const rawVector = b.vector;
  const vector = isNumberArray(rawVector) ? rawVector : undefined;

  return normalizeSearchCommon(b, vector);
}

export function normalizeSearchBodyForQuery(
  body: unknown
): SearchNormalizationResult {
  if (!isRecord(body)) {
    return {
      vector: undefined,
      top: undefined,
      withPayload: undefined,
      scoreThreshold: undefined,
    };
  }
  const b = body;
  const vector = extractVectorLoose(b);

  return normalizeSearchCommon(b, vector);
}

function normalizeSearchCommon(
  b: Record<string, unknown>,
  vector: number[] | undefined
): SearchNormalizationResult {
  const rawTop = b.top;
  const rawLimit = b.limit;
  const topFromTop = typeof rawTop === "number" ? rawTop : undefined;
  const topFromLimit = typeof rawLimit === "number" ? rawLimit : undefined;
  const top = topFromTop ?? topFromLimit;

  const filter = b.filter;

  let withPayload: boolean | undefined;
  const rawWithPayload = b.with_payload;
  if (typeof rawWithPayload === "boolean") {
    withPayload = rawWithPayload;
  } else if (
    Array.isArray(rawWithPayload) ||
    typeof rawWithPayload === "object"
  ) {
    withPayload = true;
  }

  const thresholdRaw = b.score_threshold;
  const thresholdValue =
    typeof thresholdRaw === "number" ? thresholdRaw : Number(thresholdRaw);
  const scoreThreshold = Number.isFinite(thresholdValue)
    ? thresholdValue
    : undefined;

  return { vector, top, withPayload, scoreThreshold, filter };
}
