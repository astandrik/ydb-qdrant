import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";

type InsertConfig =
  | { mode: "manual"; collectionName: string }
  | {
      mode: "openrouter";
      apiKey: string;
      model: string;
      baseUrl: string;
      siteUrl?: string;
      appName?: string;
      texts: string[];
      collectionName: string;
    };

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const useOpenRouter =
  process.env.USE_EMBEDDER === "openrouter" && Boolean(openRouterApiKey);

const insertConfig: InsertConfig = useOpenRouter
  ? {
      mode: "openrouter",
      apiKey: openRouterApiKey as string,
      model: process.env.OPENROUTER_EMBED_MODEL || "openai/text-embedding-3-small",
      baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      siteUrl: process.env.OPENROUTER_SITE_URL,
      appName: process.env.OPENROUTER_APP_NAME,
      texts: [
        "A calm day by the sea",
        "A loud concert in a packed stadium",
        "A quiet library with old books",
      ],
      collectionName: "demo_basic_openrouter",
    }
  : {
      mode: "manual",
      collectionName: "demo_basic",
    };

async function embedWithOpenRouter(
  config: Extract<InsertConfig, { mode: "openrouter" }>,
) {
  const defaultHeaders: Record<string, string> = {};

  if (config.siteUrl) {
    defaultHeaders["HTTP-Referer"] = config.siteUrl;
  }

  if (config.appName) {
    defaultHeaders["X-Title"] = config.appName;
  }

  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    defaultHeaders: Object.keys(defaultHeaders).length ? defaultHeaders : undefined,
  });

  const embeddings = await openai.embeddings.create({
    model: config.model,
    input: config.texts,
  });

  return embeddings.data.map(item => item.embedding);
}

async function main() {
  const client = new QdrantClient({ url: "http://localhost:6333" });

  if (insertConfig.mode === "manual") {
    const collectionName = insertConfig.collectionName;

    console.log("Creating collection (manual vectors)…");
    await client.createCollection(collectionName, {
      vectors: { size: 4, distance: "Cosine" },
    });

    console.log("Inserting points with hard-coded vectors…");
    await client.upsert(collectionName, {
      points: [
        // Vectors are supplied directly; bring your own embedder in real apps.
        { id: "p1", vector: [0.1, 0.2, 0.3, 0.4], payload: { label: "first" } },
        { id: "p2", vector: [0.09, 0.21, 0.29, 0.41], payload: { label: "second" } },
        { id: "p3", vector: [0.9, 0.1, 0.2, 0.3], payload: { label: "far" } },
      ],
    });

    console.log("Searching…");
    const searchResult = await client.search(collectionName, {
      vector: [0.1, 0.2, 0.31, 0.41],
      limit: 3,
    });

    console.log("Search results:");
    console.log(
      searchResult.map(r => ({
        id: r.id,
        score: r.score.toFixed(4),
      })),
    );
    return;
  }

  const embedConfig = insertConfig;
  const collectionName = embedConfig.collectionName;

  console.log("Generating embeddings with OpenRouter…");
  const vectors = await embedWithOpenRouter(embedConfig);

  console.log(`Creating collection for ${vectors[0].length}-dimensional embeddings…`);
  await client.createCollection(collectionName, {
    vectors: { size: vectors[0].length, distance: "Cosine" },
  });

  console.log("Inserting embedded points…");
  await client.upsert(collectionName, {
    points: vectors.map((vector, idx) => ({
      id: `t${idx + 1}`,
      vector,
      payload: { text: embedConfig.texts[idx] },
    })),
  });

  console.log("Searching with an embedded query…");
  const [queryVector] = await embedWithOpenRouter({
    ...embedConfig,
    texts: ["Find something peaceful and quiet"],
  });

  const searchResult = await client.search(collectionName, {
    vector: queryVector,
    limit: 3,
  });

  console.log("Search results (id, score, payload):");
  console.log(
    searchResult.map(r => ({
      id: r.id,
      score: r.score.toFixed(4),
      payload: r.payload,
    })),
  );
}

main().catch(console.error);
