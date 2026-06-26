export function noArgsSchema() {
    return {
        additionalProperties: false,
        properties: {},
        type: "object",
    };
}

export function collectionSchema() {
    return {
        additionalProperties: false,
        properties: {
            collection: {
                description: "Collection name in the configured MCP namespace.",
                type: "string",
            },
        },
        required: ["collection"],
        type: "object",
    };
}

export function searchPointsSchema() {
    return {
        additionalProperties: false,
        properties: {
            collection: { type: "string" },
            top: {
                default: 10,
                maximum: 1000,
                minimum: 1,
                type: "integer",
            },
            vector: {
                items: { type: "number" },
                minItems: 1,
                type: "array",
            },
            with_payload: { type: "boolean" },
        },
        required: ["collection", "vector"],
        type: "object",
    };
}

export function searchTextSchema() {
    return {
        additionalProperties: false,
        properties: {
            collection: { type: "string" },
            query: {
                description: "Text query embedded by the configured MCP embedding provider.",
                type: "string",
            },
            top: {
                default: 10,
                maximum: 1000,
                minimum: 1,
                type: "integer",
            },
            with_payload: { type: "boolean" },
        },
        required: ["collection", "query"],
        type: "object",
    };
}

export function retrievePointsSchema() {
    return {
        additionalProperties: false,
        properties: {
            collection: { type: "string" },
            ids: {
                items: {
                    oneOf: [{ type: "string" }, { type: "number" }],
                },
                minItems: 1,
                type: "array",
            },
            with_payload: { type: "boolean" },
            with_vector: { type: "boolean" },
        },
        required: ["collection", "ids"],
        type: "object",
    };
}

export function createCollectionSchema() {
    return {
        additionalProperties: false,
        properties: {
            collection: { type: "string" },
            vectors: {
                additionalProperties: false,
                properties: {
                    data_type: {
                        enum: ["float"],
                        type: "string",
                    },
                    distance: {
                        enum: ["Cosine", "Euclid", "Dot", "Manhattan"],
                        type: "string",
                    },
                    size: {
                        minimum: 1,
                        type: "integer",
                    },
                },
                required: ["size", "distance"],
                type: "object",
            },
        },
        required: ["collection", "vectors"],
        type: "object",
    };
}

export function upsertPointsSchema() {
    return {
        additionalProperties: false,
        properties: {
            collection: { type: "string" },
            points: {
                items: {
                    additionalProperties: true,
                    properties: {
                        id: {
                            oneOf: [{ type: "string" }, { type: "number" }],
                        },
                        payload: {
                            type: "object",
                        },
                        vector: {
                            items: { type: "number" },
                            type: "array",
                        },
                    },
                    required: ["id", "vector"],
                    type: "object",
                },
                minItems: 1,
                type: "array",
            },
        },
        required: ["collection", "points"],
        type: "object",
    };
}

export function deletePointsSchema() {
    return {
        additionalProperties: true,
        properties: {
            collection: { type: "string" },
            filter: { type: "object" },
            points: {
                items: {
                    oneOf: [{ type: "string" }, { type: "number" }],
                },
                minItems: 1,
                type: "array",
            },
        },
        required: ["collection"],
        type: "object",
    };
}
