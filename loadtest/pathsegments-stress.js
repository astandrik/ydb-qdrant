/**
 * k6 stress-style workload that explicitly exercises the pathSegments flow:
 * - writes points with pathSegments so qdrant_points_by_file is populated
 * - issues exact path-filter deletes so qdrant_points_by_file drives deletion
 * - runs filtered search to keep the full path-based flow hot
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import {
  API_KEY,
  BASE_URL,
  COLLECTION_NAME,
  STRESS_THRESHOLDS,
  VECTOR_DIM,
  randomVector,
} from "./config.js";
import { teardownCollection, waitForHealth } from "./helpers/setup.js";

const pathSearchLatency = new Trend("path_search_latency", true);
const pathUpsertLatency = new Trend("path_upsert_latency", true);
const pathDeleteLatency = new Trend("path_delete_latency", true);
const pathSearchErrors = new Rate("path_search_errors");
const pathUpsertErrors = new Rate("path_upsert_errors");
const pathDeleteErrors = new Rate("path_delete_errors");
const totalOperations = new Counter("total_operations");

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "45s", target: 20 },
    { duration: "10s", target: 0 },
  ],
  thresholds: STRESS_THRESHOLDS,
  tags: {
    testType: "pathsegments-stress",
  },
};

const headers = {
  "Content-Type": "application/json",
  "api-key": API_KEY,
};

function buildPathSegments(vu, iter, pointIndex) {
  return [
    "src",
    "loadtest",
    `vu-${vu}`,
    `iter-${iter}`,
    `point-${pointIndex}.ts`,
  ];
}

function buildPointId(vu, iter, pointIndex) {
  return `path-vu-${vu}-iter-${iter}-pt-${pointIndex}`;
}

function buildPoint(vu, iter, pointIndex) {
  return {
    id: buildPointId(vu, iter, pointIndex),
    vector: randomVector(VECTOR_DIM),
    payload: {
      label: `path-${vu}-${iter}-${pointIndex}`,
      pathSegments: buildPathSegments(vu, iter, pointIndex),
    },
  };
}

function buildDeleteFilter(pathSegments) {
  return {
    must: pathSegments.map((value, index) => ({
      key: `pathSegments.${index}`,
      match: { value },
    })),
  };
}

export function setup() {
  if (!waitForHealth()) {
    return { collectionName: null, error: "Server not healthy" };
  }

  const createRes = http.put(
    `${BASE_URL}/collections/${COLLECTION_NAME}`,
    JSON.stringify({
      vectors: {
        size: VECTOR_DIM,
        distance: "Cosine",
        data_type: "float",
      },
    }),
    { headers, tags: { type: "setup" } }
  );

  const createOk = check(createRes, {
    "path collection created": (r) => r.status === 200 || r.status === 201,
  });

  if (!createOk) {
    console.error(
      `Failed to create pathSegments collection: ${createRes.status} ${createRes.body}`
    );
    return { collectionName: null, error: "Failed to create collection" };
  }

  return { collectionName: COLLECTION_NAME };
}

export function teardown(data) {
  teardownCollection(data);
}

export default function (data) {
  if (!data || !data.collectionName) {
    console.error("Setup failed, skipping iteration");
    return;
  }

  const vu = __VU;
  const iter = __ITER;
  const points = [buildPoint(vu, iter, 0), buildPoint(vu, iter, 1)];
  const searchFilter = {
    must: [
      { key: "pathSegments.0", match: { value: "src" } },
      { key: "pathSegments.1", match: { value: "loadtest" } },
      { key: "pathSegments.2", match: { value: `vu-${vu}` } },
    ],
  };

  const upsertStartedAt = Date.now();
  const upsertRes = http.post(
    `${BASE_URL}/collections/${data.collectionName}/points/upsert`,
    JSON.stringify({ points }),
    {
      headers,
      tags: { type: "path-upsert" },
      timeout: "10s",
    }
  );
  const upsertDuration = Date.now() - upsertStartedAt;
  const upsertOk = check(upsertRes, {
    "path upsert status 200": (r) => r.status === 200,
  });
  pathUpsertLatency.add(upsertDuration);
  pathUpsertErrors.add(!upsertOk);
  totalOperations.add(1);

  const searchStartedAt = Date.now();
  const searchRes = http.post(
    `${BASE_URL}/collections/${data.collectionName}/points/search`,
    JSON.stringify({
      vector: points[0].vector,
      top: 20,
      with_payload: true,
      filter: searchFilter,
    }),
    {
      headers,
      tags: { type: "path-search" },
      timeout: "10s",
    }
  );
  const searchDuration = Date.now() - searchStartedAt;
  const searchOk = check(searchRes, {
    "path search status 200": (r) => r.status === 200,
    "path search has result array": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.result);
      } catch {
        return false;
      }
    },
  });
  pathSearchLatency.add(searchDuration);
  pathSearchErrors.add(!searchOk);
  totalOperations.add(1);

  const deleteStartedAt = Date.now();
  const deleteRes = http.post(
    `${BASE_URL}/collections/${data.collectionName}/points/delete`,
    JSON.stringify({
      filter: buildDeleteFilter(points[0].payload.pathSegments),
    }),
    {
      headers,
      tags: { type: "path-delete" },
      timeout: "10s",
    }
  );
  const deleteDuration = Date.now() - deleteStartedAt;
  const deleteOk = check(deleteRes, {
    "path delete status 200": (r) => r.status === 200,
  });
  pathDeleteLatency.add(deleteDuration);
  pathDeleteErrors.add(!deleteOk);
  totalOperations.add(1);

  sleep(0.05);
}

export function handleSummary(data) {
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  const totalOps = data.metrics.total_operations?.values?.count || 0;
  const duration = (data.state.testRunDurationMs || 0) / 1000;
  const opsPerSec = duration > 0 ? totalOps / duration : 0;
  const searchP95 = data.metrics.path_search_latency?.values?.["p(95)"] || 0;
  const upsertP95 = data.metrics.path_upsert_latency?.values?.["p(95)"] || 0;
  const deleteP95 = data.metrics.path_delete_latency?.values?.["p(95)"] || 0;

  console.log("\n========== PATHSEGMENTS STRESS SUMMARY ==========");
  console.log(`Total operations: ${totalOps}`);
  console.log(`Test duration: ${duration.toFixed(1)}s`);
  console.log(`Throughput: ${opsPerSec.toFixed(2)} ops/s`);
  console.log(`Path search p95: ${searchP95}ms`);
  console.log(`Path upsert p95: ${upsertP95}ms`);
  console.log(`Path delete p95: ${deleteP95}ms`);
  console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log("===============================================\n");

  console.log(`PATHSTRESS_OPS_PER_SEC ${opsPerSec.toFixed(2)}`);
  console.log(`PATHSTRESS_SEARCH_P95 ${searchP95}`);
  console.log(`PATHSTRESS_UPSERT_P95 ${upsertP95}`);
  console.log(`PATHSTRESS_DELETE_P95 ${deleteP95}`);
  console.log(`PATHSTRESS_ERROR_RATE ${(errorRate * 100).toFixed(4)}`);

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
