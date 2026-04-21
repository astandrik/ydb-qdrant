import { TypedValues } from "../../ydb/client.js";
import type { Ydb } from "ydb-sdk";
import { pathSegmentsToPrefix } from "../../utils/pathPrefix.js";

type QueryParams = { [key: string]: Ydb.ITypedValue };
type BuiltPathSegmentsFilter = {
    whereSql: string;
    whereParamDeclarations: string;
    whereParams: QueryParams;
};

function buildPrefixPathSegmentsWhereClauseForColumn(
    paths: Array<Array<string>>,
    columnName: string
): {
    whereSql: string;
    params: QueryParams;
} {
    const params: QueryParams = {};
    const orGroups: string[] = [];

    for (let pIdx = 0; pIdx < paths.length; pIdx += 1) {
        const segs = paths[pIdx];
        if (segs.length === 0) {
            throw new Error("pathSegments filter: empty path segments");
        }
        const prefix = pathSegmentsToPrefix(segs);
        const exactParam = `$ppfx${pIdx}`;
        const descendantParam = `$ppfxd${pIdx}`;
        params[exactParam] = TypedValues.utf8(prefix);
        params[descendantParam] = TypedValues.utf8(`${prefix}/`);
        orGroups.push(
            `(${columnName} = ${exactParam} OR StartsWith(${columnName}, ${descendantParam}))`
        );
    }

    return {
        whereSql:
            orGroups.length === 1 ? orGroups[0] : `(${orGroups.join(" OR ")})`,
        params,
    };
}

function buildExactPathSegmentsWhereClauseForColumn(
    paths: Array<Array<string>>,
    columnName: string
): {
    whereSql: string;
    params: QueryParams;
} {
    const params: QueryParams = {};
    const orGroups: string[] = [];

    for (let pIdx = 0; pIdx < paths.length; pIdx += 1) {
        const segs = paths[pIdx];
        if (segs.length === 0) {
            throw new Error("pathSegments filter: empty path segments");
        }
        const prefix = pathSegmentsToPrefix(segs);
        const exactParam = `$ppfx${pIdx}`;
        params[exactParam] = TypedValues.utf8(prefix);
        orGroups.push(`${columnName} = ${exactParam}`);
    }

    return {
        whereSql:
            orGroups.length === 1 ? orGroups[0] : `(${orGroups.join(" OR ")})`,
        params,
    };
}

function buildPathSegmentsFilterFromWhereClause(
    whereSql: string,
    whereParams: QueryParams
): BuiltPathSegmentsFilter {
    const whereParamDeclarations = Object.keys(whereParams)
        .sort()
        .map((key) => `DECLARE ${key} AS Utf8;`)
        .join("\n        ");

    return { whereSql, whereParamDeclarations, whereParams };
}

export function buildPathSegmentsWhereClause(paths: Array<Array<string>>): {
    whereSql: string;
    params: QueryParams;
} {
    return buildPrefixPathSegmentsWhereClauseForColumn(paths, "path_prefix");
}

export function buildPrefixPathSegmentsFilter(
    paths: Array<Array<string>> | undefined,
    columnName = "path_prefix"
): BuiltPathSegmentsFilter | undefined {
    if (!paths || paths.length === 0) {
        return undefined;
    }

    const { whereSql, params: whereParams } =
        buildPrefixPathSegmentsWhereClauseForColumn(paths, columnName);

    return buildPathSegmentsFilterFromWhereClause(whereSql, whereParams);
}

export function buildExactPathSegmentsFilter(
    paths: Array<Array<string>> | undefined,
    columnName = "file_path"
): BuiltPathSegmentsFilter | undefined {
    if (!paths || paths.length === 0) {
        return undefined;
    }

    const { whereSql, params: whereParams } =
        buildExactPathSegmentsWhereClauseForColumn(paths, columnName);

    return buildPathSegmentsFilterFromWhereClause(whereSql, whereParams);
}
