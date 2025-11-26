export interface QdrantServiceErrorPayload {
  status: "error";
  error: unknown;
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
