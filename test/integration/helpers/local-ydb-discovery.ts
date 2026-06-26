const LOCAL_YDB_GRPC_ENDPOINT = /^grpc:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|$)/;

export function forceLocalYdbEndpointForSdkDiscovery(): void {
  const endpoint =
    process.env.YDB_QDRANT_ENDPOINT ?? "grpc://127.0.0.1:2136";

  if (!process.env.YDB_ENDPOINT && LOCAL_YDB_GRPC_ENDPOINT.test(endpoint)) {
    // The local-ydb container can advertise its Docker hostname through discovery.
    // Keep app config on YDB_QDRANT_* while overriding the SDK endpoint locally.
    process.env.YDB_ENDPOINT = endpoint;
  }
}
