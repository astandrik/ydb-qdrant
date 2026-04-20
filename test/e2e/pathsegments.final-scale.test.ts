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
    searchPointsReq,
} from "./helpers.js";
import {
    buildMixedDepthPathPoints,
    countDistinctPointsForPrefixSubtree,
    deletePointsByPathsInChunks,
    listPrefixesForPoints,
    type E2ePoint,
    upsertPointsInChunks,
} from "./pathsegments.helpers.js";

function buildMustFilter(pathSegments: string[]): { must: JsonObject[] } {
    return {
        must: pathSegments.map((value, index) => ({
            key: `pathSegments.${index}`,
            match: { value },
        })),
    };
}

function buildVariantFamily(prefix: string, lengths: number[]): string[][] {
    return lengths.map((length, variantIndex) =>
        Array.from({ length }, (_, segmentIndex) => {
            const variant = String(variantIndex).padStart(2, "0");
            const segment = String(segmentIndex).padStart(2, "0");
            return `${prefix}-${variant}-${segment}`;
        })
    );
}

function expandExpectedPrefixes(pathSegments: string[]): string[] {
    return pathSegments.map((_, index) =>
        pathSegments.slice(0, index + 1).join("/")
    );
}

function rebasePointToNewRoot(args: {
    point: E2ePoint;
    newIdPrefix: string;
    newBaseSegments: string[];
    oldBaseLength: number;
    labelPrefix: string;
}): E2ePoint {
    const pointSuffix = args.point.id.split("-").slice(-1)[0] ?? "0000";
    const preservedDirectories = args.point.payload.pathSegments.slice(
        args.oldBaseLength,
        -1
    );

    return {
        id: `${args.newIdPrefix}-${args.point.id}`,
        vector: args.point.vector,
        payload: {
            label: `${args.labelPrefix}-${pointSuffix}`,
            pathSegments: [
                ...args.newBaseSegments,
                ...preservedDirectories,
                `${args.labelPrefix}-${pointSuffix}.tsx`,
            ],
        },
    };
}

function pickSampleIds(points: E2ePoint[], positions: number[]): string[] {
    const uniqueIds = new Set<string>();
    for (const position of positions) {
        const point = points[position];
        if (point) {
            uniqueIds.add(point.id);
        }
    }
    return [...uniqueIds];
}

describe("e2e: final large pathSegments flow", () => {
    let baseUrl = "";

    beforeAll(() => {
        baseUrl = resolveBaseUrl();
    });

    it("handles mixed-depth overlap deletes, plugin-style moved paths, idempotency and boundary-safe deletes on large data", async () => {
        const collection = createCollectionName();
        const userAgent = "prefix-table-final-scale-e2e";
        const headers = {
            ...headersWithApiKey(DEFAULT_API_KEY),
            "user-agent": userAgent,
        };

        const componentsDepths = [0, 1, 3, 5, 7, 10, 13, 15];
        const hooksDepths = [0, 2, 4, 7, 10, 13, 15, 16];
        const docsDepths = [1, 3, 6, 9, 12, 14, 16, 17];

        const formsPoints = buildMixedDepthPathPoints({
            idPrefix: "forms",
            count: 1400,
            vector: [1, 0, 0, 0],
            baseSegments: ["src", "components", "forms"],
            labelPrefix: "FormComponent",
            variants: buildVariantFamily("forms", componentsDepths),
            groupSize: 20,
        });
        const layoutPoints = buildMixedDepthPathPoints({
            idPrefix: "layout",
            count: 900,
            vector: [0, 1, 0, 0],
            baseSegments: ["src", "components", "layout"],
            labelPrefix: "LayoutComponent",
            variants: buildVariantFamily("layout", componentsDepths),
            groupSize: 20,
        });
        const hooksPoints = buildMixedDepthPathPoints({
            idPrefix: "hooks",
            count: 700,
            vector: [0, 0, 1, 0],
            baseSegments: ["src", "hooks"],
            labelPrefix: "HookModule",
            variants: buildVariantFamily("hooks", hooksDepths),
            groupSize: 20,
        });
        const hooks2Points = buildMixedDepthPathPoints({
            idPrefix: "hooks2",
            count: 700,
            vector: [0, 0, 0, 1],
            baseSegments: ["src", "hooks2"],
            labelPrefix: "HookSibling",
            variants: buildVariantFamily("hooks", hooksDepths),
            groupSize: 20,
        });
        const docsPoints = buildMixedDepthPathPoints({
            idPrefix: "docs",
            count: 300,
            vector: [1, 1, 0, 0],
            baseSegments: ["docs"],
            labelPrefix: "DocPage",
            variants: buildVariantFamily("docs", docsDepths),
            extension: ".md",
            groupSize: 20,
        });

        const movedSourcePoints = formsPoints.slice(0, 1100);
        const movedPoints = movedSourcePoints.map((point) =>
            rebasePointToNewRoot({
                point,
                newIdPrefix: "widgets",
                newBaseSegments: ["src", "widgets"],
                oldBaseLength: 3,
                labelPrefix: "WidgetModule",
            })
        );
        const movedPointById = new Map(movedPoints.map((point) => [point.id, point]));

        const componentsFilter = buildMustFilter(["src", "components"]);
        const formsFilter = buildMustFilter(["src", "components", "forms"]);
        const widgetsFilter = buildMustFilter(["src", "widgets"]);
        const hooksFilter = buildMustFilter(["src", "hooks"]);
        const hooks2Filter = buildMustFilter(["src", "hooks2"]);
        const docsFilter = buildMustFilter(["docs"]);

        const movedSampleIds = pickSampleIds(movedPoints, [0, 537, 1099]);
        const deletedSampleIds = [
            ...pickSampleIds(formsPoints.slice(1100), [0, 111, 299]),
            ...pickSampleIds(layoutPoints, [0, 450, 899]),
        ];

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
                points: [
                    ...formsPoints,
                    ...layoutPoints,
                    ...hooksPoints,
                    ...hooks2Points,
                    ...docsPoints,
                ],
                headers,
                context: "final-scale initial setup",
            });
            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: movedSourcePoints.map((point) => point.payload.pathSegments),
                headers,
                chunkSize: 100,
                context: "final-scale delete old file paths before moved upsert",
            });
            await upsertPointsInChunks({
                baseUrl,
                collection,
                points: movedPoints,
                headers,
                context: "final-scale moved new-id upsert",
            });

            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: [...formsPoints, ...layoutPoints].map(
                    (point) => point.payload.pathSegments
                ),
                headers,
                chunkSize: 100,
                context: "final-scale overlap exact delete",
            });

            const collectionAfterComponentsDelete = await getCollection(
                baseUrl,
                collection,
                headers
            );
            assertOkResponse(
                collectionAfterComponentsDelete.response,
                collectionAfterComponentsDelete.body,
                "final-scale getCollection after overlap delete"
            );
            expect(
                (collectionAfterComponentsDelete.body.result as JsonObject)
                    .points_count
            ).toBe(1);

            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "components"],
                    userAgent,
                })
            ).toBe(0);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "components", "forms"],
                    userAgent,
                })
            ).toBe(0);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "widgets"],
                    userAgent,
                })
            ).toBe(movedPoints.length);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "hooks"],
                    userAgent,
                })
            ).toBe(hooksPoints.length);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "hooks2"],
                    userAgent,
                })
            ).toBe(hooks2Points.length);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["docs"],
                    userAgent,
                })
            ).toBe(docsPoints.length);

            const componentsSearch = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 0, 0, 0],
                    top: 20,
                    with_payload: true,
                    filter: componentsFilter,
                },
                headers
            );
            assertOkResponse(
                componentsSearch.response,
                componentsSearch.body,
                "final-scale search components after delete"
            );
            expect(componentsSearch.body.result as JsonObject[]).toHaveLength(0);

            const formsSearch = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 0, 0, 0],
                    top: 20,
                    with_payload: true,
                    filter: formsFilter,
                },
                headers
            );
            assertOkResponse(
                formsSearch.response,
                formsSearch.body,
                "final-scale search forms after delete"
            );
            expect(formsSearch.body.result as JsonObject[]).toHaveLength(0);

            const widgetsSearch = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 0, 0, 0],
                    top: 20,
                    with_payload: true,
                    filter: widgetsFilter,
                },
                headers
            );
            assertOkResponse(
                widgetsSearch.response,
                widgetsSearch.body,
                "final-scale search widgets after delete"
            );
            const widgetsResults = widgetsSearch.body.result as JsonObject[];
            expect(widgetsResults.length).toBeGreaterThan(0);
            for (const point of widgetsResults) {
                const payload = point.payload as JsonObject;
                expect(payload.pathSegments).toBeDefined();
            }

            const movedPrefixes = await listPrefixesForPoints({
                collection,
                pointIds: movedSampleIds,
                userAgent,
            });
            for (const pointId of movedSampleIds) {
                const movedPoint = movedPointById.get(pointId);
                expect(movedPoint).toBeDefined();
                expect(movedPrefixes[pointId]).toEqual(
                    expandExpectedPrefixes(movedPoint?.payload.pathSegments ?? [])
                );
            }

            const deletedPrefixes = await listPrefixesForPoints({
                collection,
                pointIds: deletedSampleIds,
                userAgent,
            });
            for (const pointId of deletedSampleIds) {
                expect(deletedPrefixes[pointId]).toEqual([]);
            }

            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: [...formsPoints, ...layoutPoints].map(
                    (point) => point.payload.pathSegments
                ),
                headers,
                chunkSize: 100,
                context: "final-scale repeat overlap exact delete",
            });

            const collectionAfterRepeatDelete = await getCollection(
                baseUrl,
                collection,
                headers
            );
            assertOkResponse(
                collectionAfterRepeatDelete.response,
                collectionAfterRepeatDelete.body,
                "final-scale getCollection after repeat delete"
            );
            expect(
                (collectionAfterRepeatDelete.body.result as JsonObject).points_count
            ).toBe(1);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "components"],
                    userAgent,
                })
            ).toBe(0);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "widgets"],
                    userAgent,
                })
            ).toBe(movedPoints.length);

            await deletePointsByPathsInChunks({
                baseUrl,
                collection,
                paths: hooksPoints.map((point) => point.payload.pathSegments),
                headers,
                chunkSize: 100,
                context: "final-scale hooks exact delete",
            });

            const collectionAfterHooksDelete = await getCollection(
                baseUrl,
                collection,
                headers
            );
            assertOkResponse(
                collectionAfterHooksDelete.response,
                collectionAfterHooksDelete.body,
                "final-scale getCollection after hooks delete"
            );
            expect(
                (collectionAfterHooksDelete.body.result as JsonObject).points_count
            ).toBe(1);

            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "hooks"],
                    userAgent,
                })
            ).toBe(0);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "hooks2"],
                    userAgent,
                })
            ).toBe(hooks2Points.length);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["src", "widgets"],
                    userAgent,
                })
            ).toBe(movedPoints.length);
            expect(
                await countDistinctPointsForPrefixSubtree({
                    collection,
                    pathSegments: ["docs"],
                    userAgent,
                })
            ).toBe(docsPoints.length);

            const hooksSearch = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [0, 0, 1, 0],
                    top: 20,
                    with_payload: true,
                    filter: hooksFilter,
                },
                headers
            );
            assertOkResponse(
                hooksSearch.response,
                hooksSearch.body,
                "final-scale search hooks after delete"
            );
            expect(hooksSearch.body.result as JsonObject[]).toHaveLength(0);

            const hooks2Search = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [0, 0, 0, 1],
                    top: 20,
                    with_payload: true,
                    filter: hooks2Filter,
                },
                headers
            );
            assertOkResponse(
                hooks2Search.response,
                hooks2Search.body,
                "final-scale search hooks2 survivor"
            );
            expect((hooks2Search.body.result as JsonObject[]).length).toBeGreaterThan(
                0
            );

            const docsSearch = await searchPointsReq(
                baseUrl,
                collection,
                {
                    vector: [1, 1, 0, 0],
                    top: 20,
                    with_payload: true,
                    filter: docsFilter,
                },
                headers
            );
            assertOkResponse(
                docsSearch.response,
                docsSearch.body,
                "final-scale search docs survivor"
            );
            expect((docsSearch.body.result as JsonObject[]).length).toBeGreaterThan(
                0
            );
        } finally {
            await deleteCollectionReq(baseUrl, collection, headers);
        }
    });
});
