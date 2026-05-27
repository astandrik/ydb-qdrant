import type { Response } from "express";
import { getRequestContext } from "../logging/requestContext.js";

export type JsonErrorCode =
    | "AUTHENTICATION_REQUIRED"
    | "BAD_REQUEST"
    | "COLLECTION_NOT_FOUND"
    | "HEALTH_CHECK_FAILED"
    | "INTERNAL_ERROR"
    | "NOT_FOUND"
    | "PAYLOAD_TOO_LARGE"
    | "REQUEST_ABORTED"
    | "REQUEST_TIMEOUT"
    | "VALIDATION_ERROR"
    | "VECTOR_DIMENSION_MISMATCH";

export type JsonErrorResponse = {
    status: "error";
    error: string;
    code: JsonErrorCode;
    message: string;
    resolution: string;
    request_id: string;
};

type JsonErrorInput = {
    code?: JsonErrorCode;
    error: unknown;
    message?: string;
    requestId?: string;
    resolution?: string;
    statusCode: number;
};

function stringifyError(error: unknown): string {
    if (typeof error === "string") {
        return error;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (error && typeof error === "object") {
        if (
            ("fieldErrors" in error || "formErrors" in error) &&
            Object.keys(error).length <= 2
        ) {
            return "validation failed";
        }
        try {
            return JSON.stringify(error);
        } catch {
            return "unserializable error";
        }
    }
    return String(error);
}

function inferErrorCode(args: {
    error: unknown;
    message: string;
    statusCode: number;
}): JsonErrorCode {
    const message = args.message.toLowerCase();

    if (message.includes("collection not found")) {
        return "COLLECTION_NOT_FOUND";
    }
    if (message.startsWith("vector dimension mismatch")) {
        return "VECTOR_DIMENSION_MISMATCH";
    }
    if (message.includes("upsert request timed out")) {
        return "REQUEST_TIMEOUT";
    }
    if (message.includes("request aborted")) {
        return "REQUEST_ABORTED";
    }
    if (message.includes("ydb unavailable") || message.includes("health probe")) {
        return "HEALTH_CHECK_FAILED";
    }
    if (
        message.includes("unauthorized") ||
        message.includes("anonymous requests require")
    ) {
        return "AUTHENTICATION_REQUIRED";
    }
    if (args.statusCode === 404) {
        return "NOT_FOUND";
    }
    if (args.statusCode === 413) {
        return "PAYLOAD_TOO_LARGE";
    }
    if (
        args.statusCode === 422 ||
        (args.statusCode === 400 && typeof args.error !== "string")
    ) {
        return "VALIDATION_ERROR";
    }
    if (args.statusCode === 400) {
        return "BAD_REQUEST";
    }
    return "INTERNAL_ERROR";
}

function defaultResolution(code: JsonErrorCode): string {
    switch (code) {
        case "AUTHENTICATION_REQUIRED":
            return "Send an api-key header, or provide identifiable client metadata for anonymous demo flows.";
        case "BAD_REQUEST":
            return "Check the request parameters and body, then retry with valid values.";
        case "COLLECTION_NOT_FOUND":
            return "Create the collection first, or check the collection name, api-key, and X-Tenant-Id namespace.";
        case "HEALTH_CHECK_FAILED":
            return "Retry after the service restarts, or verify YDB connectivity for the deployment.";
        case "NOT_FOUND":
            return "Check the URL path and HTTP method against the OpenAPI specification.";
        case "PAYLOAD_TOO_LARGE":
            return "Reduce the request body size or split the payload into smaller batches.";
        case "REQUEST_ABORTED":
            return "Retry the request with a complete body and keep the connection open until the response arrives.";
        case "REQUEST_TIMEOUT":
            return "Retry with a smaller batch, increase the client timeout, or split the upsert request.";
        case "VALIDATION_ERROR":
            return "Check the request JSON against the OpenAPI schema and required fields.";
        case "VECTOR_DIMENSION_MISMATCH":
            return "Use vectors with the same dimension as the collection vectors.size.";
        case "INTERNAL_ERROR":
            return "Retry later; if the error repeats, report the request_id to support.";
    }
}

function getRequestId(res?: Response): string {
    const contextRequestId = getRequestContext()?.requestId;
    if (contextRequestId) {
        return contextRequestId;
    }

    const headerValue = res?.getHeader?.("X-Request-Id");
    if (typeof headerValue === "string" && headerValue.length > 0) {
        return headerValue;
    }
    if (Array.isArray(headerValue) && typeof headerValue[0] === "string") {
        return headerValue[0];
    }
    return "unknown";
}

export function createJsonErrorResponse(
    args: JsonErrorInput,
    res?: Response
): JsonErrorResponse {
    const message = args.message ?? stringifyError(args.error);
    const code =
        args.code ??
        inferErrorCode({
            error: args.error,
            message,
            statusCode: args.statusCode,
        });

    return {
        status: "error",
        error: message,
        code,
        message,
        resolution: args.resolution ?? defaultResolution(code),
        request_id: args.requestId ?? getRequestId(res),
    };
}

export function sendJsonError(res: Response, args: JsonErrorInput): void {
    res.status(args.statusCode).json(createJsonErrorResponse(args, res));
}
