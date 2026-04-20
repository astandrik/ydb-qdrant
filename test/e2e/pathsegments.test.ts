import { beforeAll, describe, expect, it } from "vitest";
import {
    DEFAULT_API_KEY,
    type JsonObject,
    resolveBaseUrl,
    assertOkResponse,
    createCollectionName,
    deleteCollectionReq,
    headersWithApiKey,
    putCollection,
    getCollection,
    upsertPointsReq,
    searchPointsReq,
    queryPointsReq,
    deletePointsReq,
    cleanupCollection,
} from "./helpers.js";
import {
    deletePointsByPathsInChunks,
    deleteLookupRowsForPoint,
    listLookupRowsForPoint,
    listPrefixesForPoint,
} from "./pathsegments.helpers.js";

describe("e2e: pathSegments flow", () => {
    let baseUrl = "";
    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("searches with path filter and deletes by path filter", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                {
                    id: "p1",
                    vector: [1, 0, 0, 0],
                    payload: {
                        label: "Button",
                        pathSegments: ["src", "components", "Button.tsx"],
                    },
                },
                {
                    id: "p2",
                    vector: [0, 1, 0, 0],
                    payload: {
                        label: "Input",
                        pathSegments: ["src", "components", "Input.tsx"],
                    },
                },
                {
                    id: "p3",
                    vector: [0, 0, 1, 0],
                    payload: {
                        label: "helpers",
                        pathSegments: ["src", "utils", "helpers.ts"],
                    },
                },
                {
                    id: "p4",
                    vector: [0, 0, 0, 1],
                    payload: {
                        label: "README",
                        pathSegments: ["docs", "README.md"],
                    },
                },
            ]);

            const componentsFilter = {
                must: [
                    { key: "pathSegments.0", match: { value: "src" } },
                    { key: "pathSegments.1", match: { value: "components" } },
                ],
            };

            const s1 = await searchPointsReq(baseUrl, collection, {
                vector: [0.25, 0.25, 0.25, 0.25],
                top: 10,
                with_payload: true,
                filter: componentsFilter,
            });
            assertOkResponse(s1.response, s1.body, "search with path filter");
            const filtered = s1.body.result as JsonObject[];
            expect(filtered).toHaveLength(2);
            const filteredIds = filtered.map((p) => p.id).sort();
            expect(filteredIds).toEqual(["p1", "p2"]);

            const del = await deletePointsReq(baseUrl, collection, {
                filter: {
                    should: [
                        {
                            must: [
                                {
                                    key: "pathSegments.0",
                                    match: { value: "src" },
                                },
                                {
                                    key: "pathSegments.1",
                                    match: { value: "components" },
                                },
                                {
                                    key: "pathSegments.2",
                                    match: { value: "Button.tsx" },
                                },
                            ],
                        },
                        {
                            must: [
                                {
                                    key: "pathSegments.0",
                                    match: { value: "src" },
                                },
                                {
                                    key: "pathSegments.1",
                                    match: { value: "components" },
                                },
                                {
                                    key: "pathSegments.2",
                                    match: { value: "Input.tsx" },
                                },
                            ],
                        },
                    ],
                },
            });
            assertOkResponse(del.response, del.body, "delete by exact path filter");

            const s2 = await searchPointsReq(baseUrl, collection, {
                vector: [0.25, 0.25, 0.25, 0.25],
                top: 10,
                with_payload: true,
            });
            assertOkResponse(s2.response, s2.body, "search after path delete");
            const remaining = s2.body.result as JsonObject[];
            expect(remaining).toHaveLength(2);
            const remainingIds = remaining.map((p) => p.id).sort();
            expect(remainingIds).toEqual(["p3", "p4"]);

            const g = await getCollection(baseUrl, collection);
            assertOkResponse(g.response, g.body, "get after path delete");
            const info = g.body.result as JsonObject;
            expect(info.points_count).toBe(1);
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("applies path filter on query endpoint", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                {
                    id: "button",
                    vector: [1, 0, 0, 0],
                    payload: {
                        label: "Button",
                        pathSegments: ["src", "components", "Button.tsx"],
                    },
                },
                {
                    id: "helpers",
                    vector: [0, 1, 0, 0],
                    payload: {
                        label: "helpers",
                        pathSegments: ["src", "utils", "helpers.ts"],
                    },
                },
                {
                    id: "readme",
                    vector: [0, 0, 1, 0],
                    payload: {
                        label: "README",
                        pathSegments: ["docs", "README.md"],
                    },
                },
            ]);

            const componentsFilter = {
                must: [
                    { key: "pathSegments.0", match: { value: "src" } },
                    { key: "pathSegments.1", match: { value: "components" } },
                ],
            };

            const q = await queryPointsReq(baseUrl, collection, {
                query: {
                    nearest: {
                        vector: [0.25, 0.25, 0.25, 0.25],
                    },
                },
                limit: 10,
                with_payload: true,
                filter: componentsFilter,
            });
            assertOkResponse(q.response, q.body, "query with path filter");

            const result = q.body.result as JsonObject;
            const points = result.points as JsonObject[];
            expect(points).toHaveLength(1);
            expect(points[0]?.id).toBe("button");
            expect(points[0]?.payload).toEqual({
                label: "Button",
                pathSegments: ["src", "components", "Button.tsx"],
            });
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("keeps boundary-safe search matching and deletes directory prefixes", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                {
                    id: "hooks-file",
                    vector: [1, 0, 0, 0],
                    payload: {
                        label: "hooks-file",
                        pathSegments: ["src", "hooks", "useThing.ts"],
                    },
                },
                {
                    id: "hooks-nested",
                    vector: [0, 1, 0, 0],
                    payload: {
                        label: "hooks-nested",
                        pathSegments: ["src", "hooks", "nested", "useDeep.ts"],
                    },
                },
                {
                    id: "hooks2-file",
                    vector: [0, 0, 1, 0],
                    payload: {
                        label: "hooks2-file",
                        pathSegments: ["src", "hooks2", "useOther.ts"],
                    },
                },
            ]);

            const hooksFilter = {
                must: [
                    { key: "pathSegments.0", match: { value: "src" } },
                    { key: "pathSegments.1", match: { value: "hooks" } },
                ],
            };

            const searchBeforeDelete = await searchPointsReq(baseUrl, collection, {
                vector: [0.25, 0.25, 0.25, 0.25],
                top: 10,
                with_payload: true,
                filter: hooksFilter,
            });
            assertOkResponse(
                searchBeforeDelete.response,
                searchBeforeDelete.body,
                "boundary-safe search with path filter"
            );
            const matched = searchBeforeDelete.body.result as JsonObject[];
            const matchedIds = matched.map((point) => point.id).sort();
            expect(matchedIds).toEqual(["hooks-file", "hooks-nested"]);

            const del = await deletePointsReq(baseUrl, collection, {
                filter: {
                    must: [
                        { key: "pathSegments.0", match: { value: "src" } },
                        { key: "pathSegments.1", match: { value: "hooks" } },
                    ],
                },
            });
            assertOkResponse(del.response, del.body, "directory prefix delete");

            const searchAfterDelete = await searchPointsReq(baseUrl, collection, {
                vector: [0.25, 0.25, 0.25, 0.25],
                top: 10,
                with_payload: true,
            });
            assertOkResponse(
                searchAfterDelete.response,
                searchAfterDelete.body,
                "search after boundary-safe delete"
            );
            const remaining = searchAfterDelete.body.result as JsonObject[];
            expect(remaining).toHaveLength(1);
            expect(remaining[0]?.id).toBe("hooks2-file");
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("supports should filters for multiple path prefixes", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                {
                    id: "button",
                    vector: [1, 0, 0, 0],
                    payload: {
                        label: "Button",
                        pathSegments: ["src", "components", "Button.tsx"],
                    },
                },
                {
                    id: "readme",
                    vector: [0, 1, 0, 0],
                    payload: {
                        label: "README",
                        pathSegments: ["docs", "README.md"],
                    },
                },
                {
                    id: "helpers",
                    vector: [0, 0, 1, 0],
                    payload: {
                        label: "helpers",
                        pathSegments: ["src", "utils", "helpers.ts"],
                    },
                },
            ]);

            const shouldFilter = {
                should: [
                    {
                        must: [
                            { key: "pathSegments.0", match: { value: "src" } },
                            {
                                key: "pathSegments.1",
                                match: { value: "components" },
                            },
                        ],
                    },
                    {
                        must: [{ key: "pathSegments.0", match: { value: "docs" } }],
                    },
                ],
            };

            const searchBeforeDelete = await searchPointsReq(baseUrl, collection, {
                vector: [0.25, 0.25, 0.25, 0.25],
                top: 10,
                with_payload: true,
                filter: shouldFilter,
            });
            assertOkResponse(
                searchBeforeDelete.response,
                searchBeforeDelete.body,
                "search with should path filter"
            );
            const matched = searchBeforeDelete.body.result as JsonObject[];
            const matchedIds = matched.map((point) => point.id).sort();
            expect(matchedIds).toEqual(["button", "readme"]);

            const del = await deletePointsReq(baseUrl, collection, {
                filter: {
                    should: [
                        {
                            must: [
                                {
                                    key: "pathSegments.0",
                                    match: { value: "src" },
                                },
                                {
                                    key: "pathSegments.1",
                                    match: { value: "components" },
                                },
                            ],
                        },
                        {
                            must: [
                                {
                                    key: "pathSegments.0",
                                    match: { value: "docs" },
                                },
                            ],
                        },
                    ],
                },
            });
            assertOkResponse(del.response, del.body, "delete with prefix should filter");

            const searchAfterDelete = await searchPointsReq(baseUrl, collection, {
                vector: [0.25, 0.25, 0.25, 0.25],
                top: 10,
                with_payload: true,
            });
            assertOkResponse(
                searchAfterDelete.response,
                searchAfterDelete.body,
                "search after should delete"
            );
            const remaining = searchAfterDelete.body.result as JsonObject[];
            expect(remaining).toHaveLength(1);
            expect(remaining[0]?.id).toBe("helpers");
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("keeps moved point after delete-old-path then upsert-new-id", async () => {
        const collection = createCollectionName();
        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsReq(baseUrl, collection, [
                {
                    id: "button-old",
                    vector: [1, 0, 0, 0],
                    payload: {
                        label: "Button",
                        pathSegments: ["src", "components", "Button.tsx"],
                    },
                },
            ]);

            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: [["src", "components", "Button.tsx"]],
                context: "delete old path before moved upsert",
            });

            await upsertPointsReq(baseUrl, collection, [
                {
                    id: "button-new",
                    vector: [1, 0, 0, 0],
                    payload: {
                        label: "Button moved",
                        pathSegments: ["src", "widgets", "Button.tsx"],
                    },
                },
            ]);

            const oldPathFilter = {
                must: [
                    { key: "pathSegments.0", match: { value: "src" } },
                    { key: "pathSegments.1", match: { value: "components" } },
                ],
            };

            const del = await deletePointsReq(baseUrl, collection, {
                filter: {
                    must: [
                        { key: "pathSegments.0", match: { value: "src" } },
                        { key: "pathSegments.1", match: { value: "components" } },
                        {
                            key: "pathSegments.2",
                            match: { value: "Button.tsx" },
                        },
                    ],
                },
            });
            assertOkResponse(del.response, del.body, "delete old exact path after move");

            const searchAll = await searchPointsReq(baseUrl, collection, {
                vector: [1, 0, 0, 0],
                top: 10,
                with_payload: true,
            });
            assertOkResponse(searchAll.response, searchAll.body, "search after move");
            const allPoints = searchAll.body.result as JsonObject[];
            expect(allPoints).toHaveLength(1);
            expect(allPoints[0]?.id).toBe("button-new");
            expect(allPoints[0]?.payload).toEqual({
                label: "Button moved",
                pathSegments: ["src", "widgets", "Button.tsx"],
            });

            const searchOldPath = await searchPointsReq(baseUrl, collection, {
                vector: [1, 0, 0, 0],
                top: 10,
                with_payload: true,
                filter: oldPathFilter,
            });
            assertOkResponse(
                searchOldPath.response,
                searchOldPath.body,
                "search old path after move"
            );
            const oldPathPoints = searchOldPath.body.result as JsonObject[];
            expect(oldPathPoints).toHaveLength(0);
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("materializes ancestor lookup rows in qdrant_points_by_file", async () => {
        const collection = createCollectionName();
        const userAgent = "lookup-table-delete-e2e";
        const headers = {
            ...headersWithApiKey(DEFAULT_API_KEY),
            "user-agent": userAgent,
        };

        try {
            await putCollection(
                baseUrl,
                collection,
                {
                    size: 4,
                    distance: "Cosine",
                },
                headers
            );
            await upsertPointsReq(
                baseUrl,
                collection,
                [
                    {
                        id: "button",
                        vector: [1, 0, 0, 0],
                        payload: {
                            label: "Button",
                            pathSegments: ["src", "components", "Button.tsx"],
                        },
                    },
                    {
                        id: "helpers",
                        vector: [0, 1, 0, 0],
                        payload: {
                            label: "helpers",
                            pathSegments: ["src", "utils", "helpers.ts"],
                        },
                    },
                ],
                headers
            );

            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "button",
                    userAgent,
                })
            ).toEqual(["src", "src/components", "src/components/Button.tsx"]);
            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "helpers",
                    userAgent,
                })
            ).toEqual(["src", "src/utils", "src/utils/helpers.ts"]);

        } finally {
            await deleteCollectionReq(baseUrl, collection, headers);
        }
    });

    it("removes main-table prefixes for deleted points", async () => {
        const collection = createCollectionName();
        const userAgent = "prefix-table-e2e";
        const headers = {
            ...headersWithApiKey(DEFAULT_API_KEY),
            "user-agent": userAgent,
        };

        try {
            await putCollection(
                baseUrl,
                collection,
                {
                    size: 4,
                    distance: "Cosine",
                },
                headers
            );
            await upsertPointsReq(
                baseUrl,
                collection,
                [
                    {
                        id: "button",
                        vector: [1, 0, 0, 0],
                        payload: {
                            label: "Button",
                            pathSegments: ["src", "components", "Button.tsx"],
                        },
                    },
                    {
                        id: "helpers",
                        vector: [0, 1, 0, 0],
                        payload: {
                            label: "helpers",
                            pathSegments: ["src", "utils", "helpers.ts"],
                        },
                    },
                ],
                headers
            );

            expect(
                await listPrefixesForPoint({
                    collection,
                    pointId: "button",
                    userAgent,
                })
            ).toEqual([
                "src",
                "src/components",
                "src/components/Button.tsx",
            ]);

            const del = await deletePointsReq(
                baseUrl,
                collection,
                {
                    filter: {
                        must: [
                            { key: "pathSegments.0", match: { value: "src" } },
                            {
                                key: "pathSegments.1",
                                match: { value: "components" },
                            },
                        ],
                    },
                },
                headers
            );
            assertOkResponse(
                del.response,
                del.body,
                "delete path and remove main-table prefixes"
            );

            expect(
                await listPrefixesForPoint({
                    collection,
                    pointId: "button",
                    userAgent,
                })
            ).toEqual([]);
            expect(
                await listPrefixesForPoint({
                    collection,
                    pointId: "helpers",
                    userAgent,
                })
            ).toEqual(["src", "src/utils", "src/utils/helpers.ts"]);
        } finally {
            await deleteCollectionReq(baseUrl, collection, headers);
        }
    });

    it("keeps search working but path-filter delete misses points after lookup-table desync", async () => {
        const collection = createCollectionName();
        const userAgent = "lookup-desync-e2e";
        const headers = {
            ...headersWithApiKey(DEFAULT_API_KEY),
            "user-agent": userAgent,
        };

        try {
            await putCollection(
                baseUrl,
                collection,
                {
                    size: 4,
                    distance: "Cosine",
                },
                headers
            );
            await upsertPointsReq(
                baseUrl,
                collection,
                [
                    {
                        id: "button",
                        vector: [1, 0, 0, 0],
                        payload: {
                            label: "Button",
                            pathSegments: ["src", "components", "Button.tsx"],
                        },
                    },
                ],
                headers
            );

            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "button",
                    userAgent,
                })
            ).toEqual(["src", "src/components", "src/components/Button.tsx"]);

            await deleteLookupRowsForPoint({
                collection,
                pointId: "button",
                userAgent,
            });

            expect(
                await listLookupRowsForPoint({
                    collection,
                    pointId: "button",
                    userAgent,
                })
            ).toEqual([]);

            const searchPathFilter = {
                must: [
                    { key: "pathSegments.0", match: { value: "src" } },
                    { key: "pathSegments.1", match: { value: "components" } },
                ],
            };

            const searchWithFilter = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 0, 0, 0],
                    top: 10,
                    with_payload: true,
                    filter: searchPathFilter,
                },
                headers
            );
            assertOkResponse(
                searchWithFilter.response,
                searchWithFilter.body,
                "search still uses main table after lookup desync"
            );
            const matchedBeforeDelete = searchWithFilter.body.result as JsonObject[];
            expect(matchedBeforeDelete).toHaveLength(1);
            expect(matchedBeforeDelete[0]?.id).toBe("button");

            const del = await deletePointsReq(
                baseUrl,
                collection,
                {
                    filter: {
                        must: [
                            { key: "pathSegments.0", match: { value: "src" } },
                            {
                                key: "pathSegments.1",
                                match: { value: "components" },
                            },
                        ],
                    },
                },
                headers
            );
            assertOkResponse(
                del.response,
                del.body,
                "path delete after lookup desync"
            );

            const searchAll = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 0, 0, 0],
                    top: 10,
                    with_payload: true,
                },
                headers
            );
            assertOkResponse(
                searchAll.response,
                searchAll.body,
                "search after path delete with lookup desync"
            );
            const remaining = searchAll.body.result as JsonObject[];
            expect(remaining).toHaveLength(1);
            expect(remaining[0]?.id).toBe("button");
        } finally {
            await deleteCollectionReq(baseUrl, collection, headers);
        }
    });
});
