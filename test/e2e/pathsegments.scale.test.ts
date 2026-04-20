import { beforeAll, describe, expect, it } from "vitest";
import {
    DEFAULT_API_KEY,
    type JsonObject,
    resolveBaseUrl,
    assertOkResponse,
    createCollectionName,
    deleteCollectionReq,
    deletePointsReq,
    headersWithApiKey,
    putCollection,
    getCollection,
    searchPointsReq,
    cleanupCollection,
} from "./helpers.js";
import {
    buildPathPoints,
    deletePointsByPathsInChunks,
    listPrefixesForPoint,
    type E2ePoint,
    upsertPointsInChunks,
} from "./pathsegments.helpers.js";

function buildPathDeleteFilter(paths: string[][]): Record<string, unknown> {
    if (paths.length === 1) {
        return {
            must:
                paths[0]?.map((value, index) => ({
                    key: `pathSegments.${index}`,
                    match: { value },
                })) ?? [],
        };
    }

    return {
        should: paths.map((pathSegments) => ({
            must: pathSegments.map((value, index) => ({
                key: `pathSegments.${index}`,
                match: { value },
            })),
        })),
    };
}

describe("e2e: pathSegments scale flow", () => {
    let baseUrl = "";

    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("deletes many exact file paths from a single large request that server chunks internally", async () => {
        const collection = createCollectionName();
        const componentsPoints = buildPathPoints({
            idPrefix: "single-request-components",
            count: 751,
            vector: [1, 0, 0, 0],
            baseSegments: ["src", "components"],
            labelPrefix: "SingleRequestComponent",
        });
        const utilsPoints = buildPathPoints({
            idPrefix: "single-request-utils",
            count: 120,
            vector: [0, 1, 0, 0],
            baseSegments: ["src", "utils"],
            labelPrefix: "SingleRequestHelper",
        });
        const componentsFilter = {
            must: [
                { key: "pathSegments.0", match: { value: "src" } },
                { key: "pathSegments.1", match: { value: "components" } },
            ],
        };
        const utilsFilter = {
            must: [
                { key: "pathSegments.0", match: { value: "src" } },
                { key: "pathSegments.1", match: { value: "utils" } },
            ],
        };

        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsInChunks({
                baseUrl,
                collection,
                points: [...componentsPoints, ...utilsPoints],
                context: "single large delete setup",
            });

            const del = await deletePointsReq(baseUrl, collection, {
                filter: buildPathDeleteFilter(
                    componentsPoints.map((point) => point.payload.pathSegments)
                ),
            });
            assertOkResponse(
                del.response,
                del.body,
                "single large exact path delete"
            );

            const collectionInfo = await getCollection(baseUrl, collection);
            assertOkResponse(
                collectionInfo.response,
                collectionInfo.body,
                "single large delete getCollection"
            );
            expect((collectionInfo.body.result as JsonObject).points_count).toBe(1);

            const deletedSearch = await searchPointsReq(baseUrl, collection, {
                vector: [1, 0, 0, 0],
                top: 20,
                with_payload: true,
                filter: componentsFilter,
            });
            assertOkResponse(
                deletedSearch.response,
                deletedSearch.body,
                "single large delete search deleted path"
            );
            expect(deletedSearch.body.result as JsonObject[]).toHaveLength(0);

            const utilsSearch = await searchPointsReq(baseUrl, collection, {
                vector: [0, 1, 0, 0],
                top: 200,
                with_payload: true,
                filter: utilsFilter,
            });
            assertOkResponse(
                utilsSearch.response,
                utilsSearch.body,
                "single large delete search surviving utils"
            );
            expect(utilsSearch.body.result as JsonObject[]).toHaveLength(
                utilsPoints.length
            );
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("deletes many exact file paths across multiple lookup-table batches", async () => {
        const collection = createCollectionName();
        const componentsPoints = buildPathPoints({
            idPrefix: "components",
            count: 1800,
            vector: [1, 0, 0, 0],
            baseSegments: ["src", "components"],
            labelPrefix: "Component",
        });
        const utilsPoints = buildPathPoints({
            idPrefix: "utils",
            count: 250,
            vector: [0, 1, 0, 0],
            baseSegments: ["src", "utils"],
            labelPrefix: "Helper",
        });
        const docsPoints = buildPathPoints({
            idPrefix: "docs",
            count: 150,
            vector: [0, 0, 1, 0],
            baseSegments: ["docs"],
            labelPrefix: "Doc",
            extension: ".md",
        });
        const componentsFilter = {
            must: [
                { key: "pathSegments.0", match: { value: "src" } },
                { key: "pathSegments.1", match: { value: "components" } },
            ],
        };
        const utilsFilter = {
            must: [
                { key: "pathSegments.0", match: { value: "src" } },
                { key: "pathSegments.1", match: { value: "utils" } },
            ],
        };

        try {
            await putCollection(baseUrl, collection, {
                size: 4,
                distance: "Cosine",
            });
            await upsertPointsInChunks({
                baseUrl,
                collection,
                points: [...componentsPoints, ...utilsPoints, ...docsPoints],
                context: "large subtree setup",
            });

            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: componentsPoints.map((point) => point.payload.pathSegments),
                chunkSize: 100,
                context: "large exact path delete",
            });

            const collectionInfo = await getCollection(baseUrl, collection);
            assertOkResponse(
                collectionInfo.response,
                collectionInfo.body,
                "large exact delete getCollection"
            );
            expect((collectionInfo.body.result as JsonObject).points_count).toBe(1);

            const deletedSearch = await searchPointsReq(baseUrl, collection, {
                vector: [1, 0, 0, 0],
                top: 20,
                with_payload: true,
                filter: componentsFilter,
            });
            assertOkResponse(
                deletedSearch.response,
                deletedSearch.body,
                "large exact delete search deleted path"
            );
            expect(deletedSearch.body.result as JsonObject[]).toHaveLength(0);

            const utilsSearch = await searchPointsReq(baseUrl, collection, {
                vector: [0, 1, 0, 0],
                top: 300,
                with_payload: true,
                filter: utilsFilter,
            });
            assertOkResponse(
                utilsSearch.response,
                utilsSearch.body,
                "large exact delete search surviving utils"
            );
            expect(utilsSearch.body.result as JsonObject[]).toHaveLength(
                utilsPoints.length
            );
        } finally {
            await cleanupCollection(baseUrl, collection);
        }
    });

    it("keeps moved points with new ids across multiple batches", async () => {
        const collection = createCollectionName();
        const userAgent = "prefix-table-scale-e2e";
        const headers = {
            ...headersWithApiKey(DEFAULT_API_KEY),
            "user-agent": userAgent,
        };
        const initialComponents = buildPathPoints({
            idPrefix: "moved-components",
            count: 1400,
            vector: [1, 0, 0, 0],
            baseSegments: ["src", "components"],
            labelPrefix: "MovedComponent",
        });
        const movedSourcePoints = initialComponents.slice(0, 250);
        const movedPoints: E2ePoint[] = movedSourcePoints.map((point, index) => ({
            id: `moved-widget-${point.id}`,
            vector: [1, 0, 0, 0],
            payload: {
                label: `Widget-${String(index).padStart(4, "0")}`,
                pathSegments: [
                    "src",
                    "widgets",
                    `Widget-${String(index).padStart(4, "0")}.ts`,
                ],
            },
        }));
        const utilsPoints = buildPathPoints({
            idPrefix: "stable-utils",
            count: 120,
            vector: [0, 1, 0, 0],
            baseSegments: ["src", "utils"],
            labelPrefix: "StableHelper",
        });
        const oldPathFilter = {
            must: [
                { key: "pathSegments.0", match: { value: "src" } },
                { key: "pathSegments.1", match: { value: "components" } },
            ],
        };
        const widgetsFilter = {
            must: [
                { key: "pathSegments.0", match: { value: "src" } },
                { key: "pathSegments.1", match: { value: "widgets" } },
            ],
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
            await upsertPointsInChunks({
                baseUrl,
                collection,
                points: [...initialComponents, ...utilsPoints],
                headers,
                context: "moved points initial setup",
            });
            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: movedSourcePoints.map((point) => point.payload.pathSegments),
                headers,
                chunkSize: 100,
                context: "moved points delete old file paths",
            });
            await upsertPointsInChunks({
                baseUrl,
                collection,
                points: movedPoints,
                headers,
                context: "moved points new-id upsert",
            });

            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: initialComponents
                    .slice(movedSourcePoints.length)
                    .map((point) => point.payload.pathSegments),
                headers,
                chunkSize: 100,
                context: "multi-batch moved delete remaining old file paths",
            });

            const collectionInfo = await getCollection(baseUrl, collection, headers);
            assertOkResponse(
                collectionInfo.response,
                collectionInfo.body,
                "multi-batch moved getCollection"
            );
            expect((collectionInfo.body.result as JsonObject).points_count).toBe(1);

            const oldPathSearch = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 0, 0, 0],
                    top: 20,
                    with_payload: true,
                    filter: oldPathFilter,
                },
                headers
            );
            assertOkResponse(
                oldPathSearch.response,
                oldPathSearch.body,
                "multi-batch moved search old path"
            );
            expect(oldPathSearch.body.result as JsonObject[]).toHaveLength(0);

            const widgetsSearch = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 0, 0, 0],
                    top: 300,
                    with_payload: true,
                    filter: widgetsFilter,
                },
                headers
            );
            assertOkResponse(
                widgetsSearch.response,
                widgetsSearch.body,
                "multi-batch moved search widgets path"
            );
            expect(widgetsSearch.body.result as JsonObject[]).toHaveLength(
                movedPoints.length
            );

            expect(
                await listPrefixesForPoint({
                    collection,
                    pointId: movedPoints[0]?.id ?? "",
                    userAgent,
                })
            ).toEqual([
                "src",
                "src/widgets",
                movedPoints[0]?.payload.pathSegments.join("/") ?? "",
            ]);
            expect(
                await listPrefixesForPoint({
                    collection,
                    pointId: initialComponents[300]?.id ?? "",
                    userAgent,
                })
            ).toEqual([]);
        } finally {
            await deleteCollectionReq(baseUrl, collection, headers);
        }
    });
});
