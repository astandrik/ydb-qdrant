/**
 * k6 Stress Test for ydb-qdrant
 *
 * Purpose: Find the load level where the application starts failing.
 *
 * Profile:
 * - Warm up: 30s (0 → 5 VUs)
 * - Ramp to 20: 1m (5 → 20 VUs)
 * - Ramp to 50: 1m (20 → 50 VUs)
 * - Ramp to 100: 1m (50 → 100 VUs)
 * - Max load: 30s (100 VUs)
 * - Recovery: 30s (100 → 0 VUs)
 *
 * Metrics captured:
 * - Breaking point VUs (when error rate exceeds 5%)
 * - Max RPS before errors
 * - p99 latency at breaking point
 *
 * Usage:
 *   k6 run loadtest/stress-test.js
 *   k6 run --env BASE_URL=http://localhost:8080 loadtest/stress-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import {
  BASE_URL,
  VECTOR_DIM,
  TENANT_ID,
  STRESS_THRESHOLDS,
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
// Note: Using k6's built-in 'vus' metric instead of custom Gauge for VU tracking

// Error threshold for breaking point detection (calculated post-test in handleSummary)
const DEFAULT_ERROR_THRESHOLD = 0.05; // 5% error rate = breaking point
const ERROR_THRESHOLD_ENV = __ENV.ERROR_THRESHOLD;
const ERROR_THRESHOLD =
  ERROR_THRESHOLD_ENV !== undefined &&
  !Number.isNaN(Number(ERROR_THRESHOLD_ENV))
    ? Number(ERROR_THRESHOLD_ENV)
    : DEFAULT_ERROR_THRESHOLD;

// Maximum VUs target for the stress profile (can be overridden via MAX_VUS)
const DEFAULT_MAX_VUS = 100;
const MAX_VUS_ENV = __ENV.MAX_VUS;
const MAX_VUS =
  MAX_VUS_ENV !== undefined && !Number.isNaN(Number(MAX_VUS_ENV))
    ? Number(MAX_VUS_ENV)
    : DEFAULT_MAX_VUS;

// Optional latency threshold (ms) for breaking point detection (e.g. from BREAK_P95_MS)
const DEFAULT_P95_BREAK_MS = 0;
const P95_BREAK_MS_ENV = __ENV.BREAK_P95_MS;
const P95_BREAK_MS =
  P95_BREAK_MS_ENV !== undefined && !Number.isNaN(Number(P95_BREAK_MS_ENV))
    ? Number(P95_BREAK_MS_ENV)
    : DEFAULT_P95_BREAK_MS;

// Mode for stress test: "ramp" (default) or "fixed" (constant VUs for capacity search)
const STRESS_MODE = __ENV.STRESS_MODE || "ramp";

// Shared stage profiles
const RAMP_STAGES = [
  // Warm up: ramp to 5 VUs over 30 seconds
  { duration: "30s", target: 5 },
  // Ramp to 20 VUs over 1 minute
  { duration: "1m", target: 20 },
  // Ramp to 50 VUs over 1 minute
  { duration: "1m", target: 50 },
  // Ramp to MAX_VUS over 1 minute
  { duration: "1m", target: MAX_VUS },
  // Stay at max load for 30 seconds
  { duration: "30s", target: MAX_VUS },
  // Recovery: ramp down over 30 seconds
  { duration: "30s", target: 0 },
];

const FIXED_DURATION = __ENV.FIXED_DURATION || "2m";

// Test configuration
export const options =
  STRESS_MODE === "fixed"
    ? {
        stages: [
          // Quick ramp to target VUs, then hold
          { duration: "15s", target: MAX_VUS },
          { duration: FIXED_DURATION, target: MAX_VUS },
        ],
        thresholds: STRESS_THRESHOLDS,
        tags: {
          testType: "stress",
        },
      }
    : {
        stages: RAMP_STAGES,
        thresholds: STRESS_THRESHOLDS,
        // Tags for filtering in results
        tags: {
          testType: "stress",
        },
      };

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-Id": TENANT_ID,
};

// Setup: create collection and seed with data
export function setup() {
  return setupCollection(2000); // Seed with 2000 points for stress test
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

  // Mix of operations: 80% search, 20% upsert (search-heavy for stress)
  const opRoll = Math.random();

  if (opRoll < 0.8) {
    performSearch(data);
  } else {
    performUpsert(data);
  }

  // Minimal delay to maximize load
  sleep(0.05);
}

function performSearch(data) {
  const queryVector = randomVector(VECTOR_DIM);

  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/collections/${data.collectionName}/points/search`,
    JSON.stringify({
      vector: queryVector,
      top: 10,
      with_payload: false, // Faster without payload
    }),
    {
      headers,
      tags: { type: "search" },
      timeout: "10s",
    }
  );
  const duration = Date.now() - startTime;

  const success = check(res, {
    "search status 200": (r) => r.status === 200,
  });

  searchLatency.add(duration);
  searchErrors.add(!success);
  totalOperations.add(1);

  return success;
}

function performUpsert(data) {
  const pointId = Math.floor(Math.random() * 1000000);
  const points = generatePoints(2, VECTOR_DIM, pointId);

  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/collections/${data.collectionName}/points/upsert`,
    JSON.stringify({ points }),
    {
      headers,
      tags: { type: "upsert" },
      timeout: "10s",
    }
  );
  const duration = Date.now() - startTime;

  const success = check(res, {
    "upsert status 200": (r) => r.status === 200,
  });

  upsertLatency.add(duration);
  upsertErrors.add(!success);
  totalOperations.add(1);

  return success;
}

// Handle summary output
// Note: Breaking point detection is done here post-test using aggregated metrics
// to avoid race conditions from shared mutable state across VUs
export function handleSummary(data) {
  const searchP50 = data.metrics.search_latency?.values?.["p(50)"] || 0;
  const searchP95 = data.metrics.search_latency?.values?.["p(95)"] || 0;
  const searchP99 = data.metrics.search_latency?.values?.["p(99)"] || 0;
  const searchMax = data.metrics.search_latency?.values?.max || 0;
  const upsertP95 = data.metrics.upsert_latency?.values?.["p(95)"] || 0;
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  const totalOps = data.metrics.total_operations?.values?.count || 0;
  const duration = (data.state.testRunDurationMs || 0) / 1000;
  const avgRPS = duration > 0 ? totalOps / duration : 0;

  // Calculate max VUs reached (using k6's built-in vus metric)
  const maxVUs = data.metrics.vus?.values?.max || 0;

  console.log("\n========== STRESS TEST SUMMARY ==========");
  console.log(`Total operations: ${totalOps}`);
  console.log(`Test duration: ${duration.toFixed(1)}s`);
  console.log(`Average throughput: ${avgRPS.toFixed(2)} ops/s`);
  console.log(`Max VUs reached: ${maxVUs}`);
  console.log(`\nLatencies:`);
  console.log(`  Search p50: ${searchP50}ms`);
  console.log(`  Search p95: ${searchP95}ms`);
  console.log(`  Search p99: ${searchP99}ms`);
  console.log(`  Search max: ${searchMax}ms`);
  console.log(`  Upsert p95: ${upsertP95}ms`);
  console.log(`\nError rate: ${(errorRate * 100).toFixed(2)}%`);

  // Determine breaking point post-test based on overall error rate and latency
  // If error rate >= threshold or search p95 exceeds P95_BREAK_MS (when set),
  // the system was stressed beyond capacity.
  const errorExceeded = errorRate >= ERROR_THRESHOLD;
  const latencyExceeded =
    P95_BREAK_MS > 0 ? searchP95 >= P95_BREAK_MS : false;
  const breakingPointDetected = errorExceeded || latencyExceeded;
  // Breaking point VUs: maxVUs when detected, -1 when no breaking point found
  // This makes the metric distinct from "Max VUs" for benchmark tracking
  const breakingPointVUs = breakingPointDetected ? maxVUs : -1;

  if (breakingPointDetected) {
    console.log(`\n!!! BREAKING POINT DETECTED !!!`);
    if (errorExceeded) {
      console.log(
        `  Error rate exceeded ${(ERROR_THRESHOLD * 100).toFixed(
          0
        )}% threshold`
      );
    }
    if (latencyExceeded) {
      console.log(
        `  Search p95 exceeded ${P95_BREAK_MS}ms threshold (p95=${searchP95}ms)`
      );
    }
    console.log(`  Max VUs reached: ${maxVUs}`);
  } else {
    console.log(
      `\nNo breaking point detected (error rate < ${
        ERROR_THRESHOLD * 100
      }% and p95 <= ${
        P95_BREAK_MS > 0 ? P95_BREAK_MS : "∞"
      }ms over the full run)`
    );
  }
  console.log("==========================================\n");

  // Output for CI parsing
  console.log(`STRESS_MAX_VUS ${maxVUs}`);
  console.log(`STRESS_AVG_RPS ${avgRPS.toFixed(2)}`);
  console.log(`STRESS_SEARCH_P95 ${searchP95}`);
  console.log(`STRESS_SEARCH_P99 ${searchP99}`);
  console.log(`STRESS_ERROR_RATE ${(errorRate * 100).toFixed(4)}`);

  if (breakingPointDetected) {
    console.log(`STRESS_BREAKING_POINT_VUS ${breakingPointVUs}`);
    console.log(`STRESS_BREAKING_POINT_RPS ${avgRPS.toFixed(2)}`);
  } else {
    console.log(`STRESS_BREAKING_POINT_VUS -1`);
    console.log(`STRESS_BREAKING_POINT_RPS ${avgRPS.toFixed(2)}`);
  }

  // Benchmark-compatible JSON output for github-action-benchmark
  // Format: array of { name, unit, value } objects
  // Split into:
  // - smaller-is-better metrics (latency, error rate)
  // - bigger-is-better metrics (throughput, VUs)
  const smallerIsBetterResults = [
    {
      name: "Stress: Search Latency p95",
      unit: "ms",
      value: searchP95 || 0,
    },
    {
      name: "Stress: Search Latency p99",
      unit: "ms",
      value: searchP99 || 0,
    },
    {
      name: "Stress: Search Latency max",
      unit: "ms",
      value: searchMax || 0,
    },
    {
      name: "Stress: Upsert Latency p95",
      unit: "ms",
      value: upsertP95 || 0,
    },
    {
      name: "Stress: Error Rate",
      unit: "%",
      value: parseFloat((errorRate * 100).toFixed(4)),
    },
  ];

  const biggerIsBetterResults = [
    {
      name: "Stress: Throughput",
      unit: "ops/s",
      value: avgRPS,
    },
    {
      name: "Stress: Max VUs",
      unit: "VUs",
      value: maxVUs,
    },
    {
      name: "Stress: Breaking Point VUs",
      unit: "VUs",
      value: breakingPointVUs,
    },
  ];

  return {
    stdout: JSON.stringify(data, null, 2),
    // Keep existing path for smaller-is-better metrics (latency, error rate)
    "./stress-benchmark.json": JSON.stringify(smallerIsBetterResults, null, 2),
    // New path for bigger-is-better metrics (throughput, capacity)
    "./stress-benchmark-capacity.json": JSON.stringify(
      biggerIsBetterResults,
      null,
      2
    ),
  };
}