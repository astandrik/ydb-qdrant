import "dotenv/config";
import { createYdbQdrantClient } from "./package/Api.js";

async function main(): Promise<void> {
  const tenant = process.env.SMOKE_TENANT ?? "smoke";
  const collection = process.env.SMOKE_COLLECTION ?? "demo";

  const client = await createYdbQdrantClient({ defaultTenant: tenant });

  await client.createCollection(collection, {
    vectors: {
      size: 4,
      distance: "Cosine",
      data_type: "float",
    },
  });

  await client.upsertPoints(collection, {
    points: [
      {
        id: "p1",
        vector: [0, 0, 0, 1],
        payload: { label: "p1" },
      },
      {
        id: "p2",
        vector: [0, 0, 1, 0],
        payload: { label: "p2" },
      },
    ],
  });

  const result = await client.searchPoints(collection, {
    vector: [0, 0, 0, 1],
    top: 2,
    with_payload: true,
  });

  console.log(JSON.stringify(result, null, 2));
}

void main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
