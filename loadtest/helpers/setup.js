/**
 * Setup and teardown helpers for k6 load tests.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, COLLECTION_NAME, VECTOR_DIM, TENANT_ID, generatePoints } from "../config.js";

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-Id": TENANT_ID,
};

/**
 * Create a test collection and seed it with initial data.
 * Call this in setup() function of k6 test.
 */
export function setupCollection(seedPointCount = 1000) {
  console.log(`Setting up collection: ${COLLECTION_NAME}`);

  // Create collection
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
    "collection created": (r) => r.status === 200 || r.status === 201,
  });

  if (!createOk) {
    console.error(`Failed to create collection: ${createRes.status} ${createRes.body}`);
    return { collectionName: null, error: "Failed to create collection" };
  }

  // Seed with initial points in batches
  const batchSize = 100;
  for (let i = 0; i < seedPointCount; i += batchSize) {
    const count = Math.min(batchSize, seedPointCount - i);
    const points = generatePoints(count, VECTOR_DIM, i);

    const upsertRes = http.post(
      `${BASE_URL}/collections/${COLLECTION_NAME}/points/upsert`,
      JSON.stringify({ points }),
      { headers, tags: { type: "setup" } }
    );

    check(upsertRes, {
      "seed upsert successful": (r) => r.status === 200,
    });
  }

  console.log(`Collection ${COLLECTION_NAME} seeded with ${seedPointCount} points`);

  return {
    collectionName: COLLECTION_NAME,
    vectorDim: VECTOR_DIM,
    seedPointCount,
  };
}

/**
 * Delete the test collection.
 * Call this in teardown() function of k6 test.
 */
export function teardownCollection(data) {
  if (!data || !data.collectionName) {
    console.log("No collection to tear down");
    return;
  }

  console.log(`Tearing down collection: ${data.collectionName}`);

  const deleteRes = http.del(
    `${BASE_URL}/collections/${data.collectionName}`,
    null,
    { headers, tags: { type: "teardown" } }
  );

  check(deleteRes, {
    "collection deleted": (r) => r.status === 200 || r.status === 404,
  });
}

/**
 * Wait for the server to be healthy.
 * Useful at the start of tests.
 */
export function waitForHealth(maxAttempts = 30, delaySeconds = 2) {
  console.log(`Waiting for server health at ${BASE_URL}/health`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = http.get(`${BASE_URL}/health`, { tags: { type: "health" } });
      if (res.status === 200) {
        console.log("Server is healthy");
        return true;
      }
    } catch (e) {
      // Connection error, keep trying
    }
    console.log(`Health check attempt ${i + 1}/${maxAttempts} failed, retrying...`);
    sleep(delaySeconds);
  }

  console.error("Server did not become healthy in time");
  return false;
}