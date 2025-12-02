/**
 * k6 Soak Test for ydb-qdrant
 *
 * Purpose: Verify the application handles sustained load without degradation.
 *
 * Profile:
 * - Ramp up: 30s (0 → 10 VUs)
 * - Steady state: 2m (10 VUs)
 * - Ramp down: 10s (10 → 0 VUs)
 *
 * Pass/Fail Criteria:
 * - Error rate < 1%
 * - p95 search latency < 500ms
 * - p99 search latency < 1000ms
 *
 * Usage:
 *   k6 run loadtest/soak-test.js
 *   k6 run --env BASE_URL=http://localhost:8080 loadtest/soak-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import {
  BASE_URL,
  VECTOR_DIM,
  TENANT_ID,
  SOAK_THRESHOLDS,
  randomVector,
  generatePoints,
} from "./config.js";
import { setupCollection, teardownCollection } from "./helpers/setup.js";

// Custom metrics
const searchLatency = new Trend("search_latency", true);
const upsertLatency = new Trend("upsert_latency", true);
const searchErrors = new Rate("search_errors");
const upsertErrors = new Rate("upsert_errors");
const totalOperations = new Counter("total_operations");

// Test configuration
export const options = {
  stages: [
    // Ramp up to 10 VUs over 30 seconds
    { duration: "30s", target: 10 },
    // Stay at 10 VUs for 2 minutes (steady state)
    { duration: "2m", target: 10 },
    // Ramp down to 0 VUs over 10 seconds
    { duration: "10s", target: 0 },
  ],
  thresholds: SOAK_THRESHOLDS,
  // Tags for filtering in results
  tags: {
    testType: "soak",
  },
};

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-Id": TENANT_ID,
};

// Setup: create collection and seed with data
export function setup() {
  return setupCollection(1000); // Seed with 1000 points
}

// Teardown: delete test collection
export function teardown(data) {
  teardownCollection(data);
}

// Main test function - executed by each VU
export default function (data) {
  if (!data || !data.collectionName) {
    console.error("Setup failed, skipping iteration");
    return;
  }

  // Mix of operations: 70% search, 30% upsert
  const opRoll = Math.random();

  if (opRoll < 0.7) {
    // Search operation
    performSearch(data);
  } else {
    // Upsert operation
    performUpsert(data);
  }

  // Small delay between operations
  sleep(0.1);
}

function performSearch(data) {
  const queryVector = randomVector(VECTOR_DIM);

  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/collections/${data.collectionName}/points/search`,
    JSON.stringify({
      vector: queryVector,
      top: 10,
      with_payload: true,
    }),
    {
      headers,
      tags: { type: "search" },
    }
  );
  const duration = Date.now() - startTime;

  const success = check(res, {
    "search status 200": (r) => r.status === 200,
    "search has results": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.points && body.points.length > 0;
      } catch {
        return false;
      }
    },
  });

  searchLatency.add(duration);
  searchErrors.add(!success);
  totalOperations.add(1);
}

function performUpsert(data) {
  // Generate a small batch of points
  const pointId = Math.floor(Math.random() * 1000000);
  const points = generatePoints(4, VECTOR_DIM, pointId);

  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/collections/${data.collectionName}/points/upsert`,
    JSON.stringify({ points }),
    {
      headers,
      tags: { type: "upsert" },
    }
  );
  const duration = Date.now() - startTime;

  const success = check(res, {
    "upsert status 200": (r) => r.status === 200,
  });

  upsertLatency.add(duration);
  upsertErrors.add(!success);
  totalOperations.add(1);
}

// Handle summary output
export function handleSummary(data) {
  const searchP95 = data.metrics.search_latency?.values?.["p(95)"] || 0;
  const searchP99 = data.metrics.search_latency?.values?.["p(99)"] || 0;
  const upsertP95 = data.metrics.upsert_latency?.values?.["p(95)"] || 0;
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  const totalOps = data.metrics.total_operations?.values?.count || 0;
  const duration = data.state.testRunDurationMs / 1000;
  const opsPerSec = totalOps / duration;

  console.log("\n========== SOAK TEST SUMMARY ==========");
  console.log(`Total operations: ${totalOps}`);
  console.log(`Test duration: ${duration.toFixed(1)}s`);
  console.log(`Throughput: ${opsPerSec.toFixed(2)} ops/s`);
  console.log(`Search p95: ${searchP95}ms`);
  console.log(`Search p99: ${searchP99}ms`);
  console.log(`Upsert p95: ${upsertP95}ms`);
  console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log("========================================\n");

  // Output for CI parsing
  console.log(`SOAK_OPS_PER_SEC ${opsPerSec.toFixed(2)}`);
  console.log(`SOAK_SEARCH_P95 ${searchP95}`);
  console.log(`SOAK_SEARCH_P99 ${searchP99}`);
  console.log(`SOAK_ERROR_RATE ${(errorRate * 100).toFixed(4)}`);

  // Benchmark-compatible JSON output for github-action-benchmark
  // Format: array of { name, unit, value } objects
  // Using "customSmallerIsBetter" for latency/errors, throughput tracked separately
  const benchmarkResults = [
    {
      name: "Soak: Search Latency p95",
      unit: "ms",
      value: parseFloat(searchP95) || 0,
    },
    {
      name: "Soak: Search Latency p99",
      unit: "ms",
      value: parseFloat(searchP99) || 0,
    },
    {
      name: "Soak: Upsert Latency p95",
      unit: "ms",
      value: parseFloat(upsertP95) || 0,
    },
    {
      name: "Soak: Error Rate",
      unit: "%",
      value: parseFloat((errorRate * 100).toFixed(4)),
    },
    {
      name: "Soak: Throughput",
      unit: "ops/s",
      value: parseFloat(opsPerSec.toFixed(2)),
      biggerIsBetter: true,
    },
  ];

  return {
    stdout: JSON.stringify(data, null, 2),
    "./soak-benchmark.json": JSON.stringify(benchmarkResults, null, 2),
  };
}