import type { Value } from "@ydbjs/value";
import { Utf8 } from "@ydbjs/value/primitive";

type QueryParams = Record<string, Value>;

export function buildPathSegmentsWhereClause(paths: Array<Array<string>>): {
  whereSql: string;
  params: QueryParams;
} {
  const params: QueryParams = {};
  const orGroups: string[] = [];

  for (let pIdx = 0; pIdx < paths.length; pIdx += 1) {
    const segs = paths[pIdx];
    if (segs.length === 0) {
      throw new Error("delete-by-filter: empty path segments");
    }
    const andParts: string[] = [];
    for (let sIdx = 0; sIdx < segs.length; sIdx += 1) {
      const paramName = `$p${pIdx}_${sIdx}`;
      // payload is JsonDocument; JSON_VALUE supports JsonPath access.
      // Security: path segment values are always bound as parameters (see `params[paramName]`)
      // and MUST NOT be interpolated into `whereSql`. The only dynamic part in the SQL text
      // below is the numeric segment index (sIdx) and the internal parameter name.
      andParts.push(
        `JSON_VALUE(payload, '$.pathSegments."${sIdx}"') = ${paramName}`
      );
      params[paramName] = new Utf8(segs[sIdx]);
    }
    orGroups.push(`(${andParts.join(" AND ")})`);
  }

  return {
    whereSql:
      orGroups.length === 1 ? orGroups[0] : `(${orGroups.join(" OR ")})`,
    params,
  };
}

export function buildPathSegmentsFilter(
  paths: Array<Array<string>> | undefined
):
  | {
      whereSql: string;
      whereParams: QueryParams;
    }
  | undefined {
  if (!paths || paths.length === 0) return undefined;

  const { whereSql, params: whereParams } = buildPathSegmentsWhereClause(paths);
  return { whereSql, whereParams };
}
