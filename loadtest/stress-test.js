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
import { Counter, Rate, Trend, Gauge } from "k6/metrics";
import {
  BASE_URL,
  COLLECTION_NAME,
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
const currentVUs = new Gauge("current_vus");

// Breaking point tracking (in-memory, updated during test)
let breakingPointDetected = false;
let breakingPointVUs = 0;
let breakingPointRPS = 0;
let breakingPointP99 = 0;
let recentErrors = [];
let recentOps = [];
const ERROR_THRESHOLD = 0.05; // 5% error rate = breaking point
const WINDOW_SIZE = 100; // Rolling window for error rate calculation

// Test configuration
export const options = {
  stages: [
    // Warm up: ramp to 5 VUs over 30 seconds
    { duration: "30s", target: 5 },
    // Ramp to 20 VUs over 1 minute
    { duration: "1m", target: 20 },
    // Ramp to 50 VUs over 1 minute
    { duration: "1m", target: 50 },
    // Ramp to 100 VUs over 1 minute
    { duration: "1m", target: 100 },
    // Stay at max load for 30 seconds
    { duration: "30s", target: 100 },
    // Recovery: ramp down over 30 seconds
    { duration: "30s", target: 0 },
  ],
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

  // Track current VUs
  currentVUs.add(__VU);

  // Mix of operations: 80% search, 20% upsert (search-heavy for stress)
  const opRoll = Math.random();

  let success;
  if (opRoll < 0.8) {
    success = performSearch(data);
  } else {
    success = performUpsert(data);
  }

  // Track error rate in rolling window
  trackErrorRate(success);

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

function trackErrorRate(success) {
  const now = Date.now();
  recentErrors.push({ time: now, error: !success });
  recentOps.push({ time: now });

  // Keep only recent window
  const cutoff = now - 5000; // 5 second window
  recentErrors = recentErrors.filter((e) => e.time > cutoff);
  recentOps = recentOps.filter((o) => o.time > cutoff);

  if (recentOps.length >= WINDOW_SIZE && !breakingPointDetected) {
    const errorCount = recentErrors.filter((e) => e.error).length;
    const errorRate = errorCount / recentOps.length;

    if (errorRate >= ERROR_THRESHOLD) {
      breakingPointDetected = true;
      breakingPointVUs = __VU;
      breakingPointRPS = recentOps.length / 5; // ops per second
      console.log(`\n!!! BREAKING POINT DETECTED !!!`);
      console.log(`VUs: ${breakingPointVUs}`);
      console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
      console.log(`RPS: ${breakingPointRPS.toFixed(2)}`);
    }
  }
}

// Handle summary output
export function handleSummary(data) {
  const searchP50 = data.metrics.search_latency?.values?.["p(50)"] || 0;
  const searchP95 = data.metrics.search_latency?.values?.["p(95)"] || 0;
  const searchP99 = data.metrics.search_latency?.values?.["p(99)"] || 0;
  const searchMax = data.metrics.search_latency?.values?.max || 0;
  const upsertP95 = data.metrics.upsert_latency?.values?.["p(95)"] || 0;
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  const totalOps = data.metrics.total_operations?.values?.count || 0;
  const duration = data.state.testRunDurationMs / 1000;
  const avgRPS = totalOps / duration;

  // Calculate max VUs reached
  const maxVUs = data.metrics.current_vus?.values?.max || 0;

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

  if (breakingPointDetected) {
    console.log(`\n!!! BREAKING POINT !!!`);
    console.log(`  VUs at break: ${breakingPointVUs}`);
    console.log(`  RPS at break: ${breakingPointRPS.toFixed(2)}`);
  } else {
    console.log(`\nNo breaking point detected (error rate stayed below ${ERROR_THRESHOLD * 100}%)`);
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
    console.log(`STRESS_BREAKING_POINT_RPS ${breakingPointRPS.toFixed(2)}`);
  } else {
    console.log(`STRESS_BREAKING_POINT_VUS -1`);
    console.log(`STRESS_BREAKING_POINT_RPS ${avgRPS.toFixed(2)}`);
  }

  // Benchmark-compatible JSON output for github-action-benchmark
  // Format: array of { name, unit, value } objects
  const benchmarkResults = [
    {
      name: "Stress: Search Latency p95",
      unit: "ms",
      value: parseFloat(searchP95) || 0,
    },
    {
      name: "Stress: Search Latency p99",
      unit: "ms",
      value: parseFloat(searchP99) || 0,
    },
    {
      name: "Stress: Search Latency max",
      unit: "ms",
      value: parseFloat(searchMax) || 0,
    },
    {
      name: "Stress: Upsert Latency p95",
      unit: "ms",
      value: parseFloat(upsertP95) || 0,
    },
    {
      name: "Stress: Error Rate",
      unit: "%",
      value: parseFloat((errorRate * 100).toFixed(4)),
    },
    {
      name: "Stress: Throughput",
      unit: "ops/s",
      value: parseFloat(avgRPS.toFixed(2)),
      biggerIsBetter: true,
    },
    {
      name: "Stress: Max VUs",
      unit: "VUs",
      value: maxVUs,
      biggerIsBetter: true,
    },
    {
      name: "Stress: Breaking Point VUs",
      unit: "VUs",
      value: breakingPointDetected ? breakingPointVUs : maxVUs,
      biggerIsBetter: true,
    },
  ];

  return {
    stdout: JSON.stringify(data, null, 2),
    "./stress-benchmark.json": JSON.stringify(benchmarkResults, null, 2),
  };
}