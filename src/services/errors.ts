export interface QdrantServiceErrorPayload {
  status: "error";
  error: unknown;
}

export function isVectorDimensionMismatchError(err: unknown): err is Error {
  return (
    err instanceof Error && err.message.startsWith("Vector dimension mismatch")
  );
}

export class QdrantServiceError extends Error {
  readonly statusCode: number;
  readonly payload: QdrantServiceErrorPayload;

  constructor(
    statusCode: number,
    payload: QdrantServiceErrorPayload,
    message?: string
  ) {
    super(message ?? String(payload.error));
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
