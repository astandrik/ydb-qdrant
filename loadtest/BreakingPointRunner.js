#!/usr/bin/env node

/**
 * BreakingPointRunner (ESM)
 *
 * Helper script to approximate the breaking-point VUs by running
 * multiple k6 stress tests in "fixed" mode at different MAX_VUS values.
 *
 * Intended for CI usage via `.github/workflows/ci-load-stress.yml`.
 */

import { spawnSync } from "node:child_process";

function parseNumberEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  const n = Number(raw);
  return Number.isNaN(n) ? defaultValue : n;
}

const MIN_VUS = parseNumberEnv("BREAK_MIN_VUS", 100);
const MAX_VUS_BOUND = parseNumberEnv("BREAK_MAX_VUS", 2000);
const ERROR_THRESHOLD_PERCENT = parseNumberEnv("BREAK_ERROR_THRESHOLD", 5);
// Latency threshold for p95 search requests (milliseconds)
const P95_THRESHOLD_MS = parseNumberEnv("BREAK_P95_MS", 5000);
const MAX_RUNS = parseNumberEnv("BREAK_MAX_RUNS", 8);

if (MIN_VUS <= 0 || MAX_VUS_BOUND <= 0 || MIN_VUS > MAX_VUS_BOUND) {
  console.error(
    `Invalid bounds: BREAK_MIN_VUS=${MIN_VUS}, BREAK_MAX_VUS=${MAX_VUS_BOUND}`
  );
  process.exit(1);
}

function runOnce(targetVus) {
  const env = {
    ...process.env,
    // Forward BASE_URL if the caller provided it, otherwise rely on k6 default.
    MAX_VUS: String(targetVus),
    STRESS_MODE: "fixed",
    ERROR_THRESHOLD: String(ERROR_THRESHOLD_PERCENT / 100),
    BREAK_P95_MS: String(P95_THRESHOLD_MS),
  };

  const result = spawnSync(
    "k6",
    ["run", "loadtest/stress-test.js"],
    {
      env,
      encoding: "utf8",
    }
  );

  if (result.error) {
    console.error("Failed to run k6:", result.error);
    process.exit(1);
  }

  const output = `${result.stdout || ""}${result.stderr || ""}`;

  // Re-emit k6 output so CI logs and stress.log contain full run details
  process.stdout.write(output);

  const vusMatch = output.match(/STRESS_MAX_VUS\s+(\d+)/);
  const errorMatch = output.match(/STRESS_ERROR_RATE\s+([0-9.]+)/);
  const p95Match = output.match(/STRESS_SEARCH_P95\s+([0-9.]+)/);

  if (!vusMatch || !errorMatch || !p95Match) {
    console.error(
      "Could not parse STRESS_MAX_VUS, STRESS_ERROR_RATE, or STRESS_SEARCH_P95 from k6 output."
    );
    process.exit(1);
  }

  const vus = Number(vusMatch[1]);
  const errorPercent = Number(errorMatch[1]);
  const searchP95 = Number(p95Match[1]);

  console.log(
    `Run @ ${vus} VUs → error=${errorPercent.toFixed(
      4
    )}% (threshold=${ERROR_THRESHOLD_PERCENT}%), p95=${searchP95.toFixed(
      2
    )}ms (threshold=${P95_THRESHOLD_MS}ms)`
  );

  return { vus, errorPercent, searchP95 };
}

function isFail(runResult) {
  return (
    runResult.errorPercent > ERROR_THRESHOLD_PERCENT ||
    runResult.searchP95 > P95_THRESHOLD_MS
  );
}

function main() {
  let runs = 0;

  // Phase 1: exponential search to find a failing region.
  let safeVus = 0;
  let failVus = null;
  let current = MIN_VUS;

  while (current <= MAX_VUS_BOUND && runs < MAX_RUNS) {
    runs += 1;
    const result = runOnce(current);

    if (!isFail(result)) {
      safeVus = result.vus;
      current *= 2;
    } else {
      failVus = result.vus;
      break;
    }
  }

  if (failVus === null) {
    console.log(
      `No breaking point detected up to ${current > MAX_VUS_BOUND ? MAX_VUS_BOUND : current} VUs (error stayed <= ${ERROR_THRESHOLD_PERCENT}%).`
    );
    process.exit(0);
  }

  console.log(
    `Initial breaking region found between ${safeVus} (safe) and ${failVus} (failing) VUs.`
  );

  // Phase 2: binary search between safeVus and failVus to narrow the window.
  let low = safeVus + 1;
  let high = failVus;

  while (low <= high && runs < MAX_RUNS) {
    const mid = Math.floor((low + high) / 2);
    runs += 1;
    const result = runOnce(mid);

    if (!isFail(result)) {
      safeVus = result.vus;
      low = result.vus + 1;
    } else {
      failVus = result.vus;
      high = result.vus - 1;
    }
  }

  console.log(
    `Approximate breaking point window: safe up to ${safeVus} VUs, failing from ${failVus} VUs (thresholds: error ${ERROR_THRESHOLD_PERCENT}%, p95 ${P95_THRESHOLD_MS}ms).`
  );
}

main();
