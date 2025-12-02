/**
 * Shared configuration for k6 load tests.
 */

// Base URL for the ydb-qdrant HTTP API
export const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Test collection configuration
export const COLLECTION_NAME = __ENV.COLLECTION_NAME || `loadtest_${Date.now()}`;
export const VECTOR_DIM = 128;
export const TENANT_ID = __ENV.TENANT_ID || "loadtest_tenant";

// Thresholds for soak test (pass/fail criteria)
export const SOAK_THRESHOLDS = {
  // Error rate must be below 1%
  http_req_failed: ["rate<0.01"],
  // 95th percentile latency must be under 500ms
  "http_req_duration{type:search}": ["p(95)<500", "p(99)<1000"],
  // Upsert can be slightly slower
  "http_req_duration{type:upsert}": ["p(95)<800", "p(99)<1500"],
};

// Thresholds for stress test (more lenient, we're looking for breaking point)
export const STRESS_THRESHOLDS = {
  // We allow higher error rate in stress test - we're finding the limit
  http_req_failed: ["rate<0.20"],
};

// Generate a random normalized vector of given dimension
export function randomVector(dim) {
  const raw = [];
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    const v = Math.random() - 0.5;
    raw.push(v);
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return raw.map((x) => x / norm);
}

// Generate a batch of random points for upsert
export function generatePoints(count, dim, startId = 0) {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push({
      id: `pt_${startId + i}`,
      vector: randomVector(dim),
      payload: { index: startId + i, timestamp: Date.now() },
    });
  }
  return points;
}