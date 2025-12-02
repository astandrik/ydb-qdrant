#!/usr/bin/env node

/**
 * BreakingPointRunner
 *
 * Helper script to approximate the breaking-point VUs by running
 * multiple k6 stress tests in "fixed" mode at different MAX_VUS values.
 *
 * Usage (from repo root):
 *   node loadtest/BreakingPointRunner.js
 *
 * Optional environment variables:
 *   BREAK_MIN_VUS        - starting VU level (default: 100)
 *   BREAK_MAX_VUS        - upper bound for VUs (default: 2000)
 *   BREAK_ERROR_THRESHOLD - error-rate threshold in percent (default: 5)
 *   BREAK_MAX_RUNS       - max k6 runs (default: 8)
 *   BASE_URL             - forwarded to k6 (default: http://localhost:8080)
 *
 * This script does not change CI behaviour; it is intended for manual
 * capacity exploration on a developer or dedicated load machine.
 */

const { spawnSync } = require("node:child_process");

function parseNumberEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  const n = Number(raw);
  return Number.isNaN(n) ? defaultValue : n;
}

const MIN_VUS = parseNumberEnv("BREAK_MIN_VUS", 100);
const MAX_VUS_BOUND = parseNumberEnv("BREAK_MAX_VUS", 2000);
const ERROR_THRESHOLD_PERCENT = parseNumberEnv("BREAK_ERROR_THRESHOLD", 5);
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

  if (!vusMatch || !errorMatch) {
    console.error("Could not parse STRESS_MAX_VUS or STRESS_ERROR_RATE from k6 output.");
    process.exit(1);
  }

  const vus = Number(vusMatch[1]);
  const errorPercent = Number(errorMatch[1]);

  console.log(
    `Run @ ${vus} VUs → error=${errorPercent.toFixed(
      4
    )}% (threshold=${ERROR_THRESHOLD_PERCENT}%)`
  );

  return { vus, errorPercent };
}

function main() {
  let runs = 0;

  // Phase 1: exponential search to find a failing region.
  let safeVus = 0;
  let failVus = null;
  let current = MIN_VUS;

  while (current <= MAX_VUS_BOUND && runs < MAX_RUNS) {
    runs += 1;
    const { vus, errorPercent } = runOnce(current);

    if (errorPercent <= ERROR_THRESHOLD_PERCENT) {
      safeVus = vus;
      current *= 2;
    } else {
      failVus = vus;
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
    const { vus, errorPercent } = runOnce(mid);

    if (errorPercent <= ERROR_THRESHOLD_PERCENT) {
      safeVus = vus;
      low = vus + 1;
    } else {
      failVus = vus;
      high = vus - 1;
    }
  }

  console.log(
    `Approximate breaking point window: safe up to ${safeVus} VUs, failing from ${failVus} VUs (threshold ${ERROR_THRESHOLD_PERCENT}% error rate).`
  );
}

main();


