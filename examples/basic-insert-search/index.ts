import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";

type InsertConfig =
  | { mode: "manual"; collectionName: string }
  | {
      mode: "openai";
      apiKey: string;
      model: string;
      texts: string[];
      collectionName: string;
    };

const openAiApiKey = process.env.OPENAI_API_KEY;
const useOpenAI = process.env.USE_EMBEDDER === "openai" && Boolean(openAiApiKey);

const insertConfig: InsertConfig = useOpenAI
  ? {
      mode: "openai",
      apiKey: openAiApiKey as string,
      model: process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small",
      texts: [
        "A calm day by the sea",
        "A loud concert in a packed stadium",
        "A quiet library with old books",
      ],
      collectionName: "demo_basic_openai",
    }
  : {
      mode: "manual",
      collectionName: "demo_basic",
    };

async function embedWithOpenAI(config: Extract<InsertConfig, { mode: "openai" }>) {
  const openai = new OpenAI({ apiKey: config.apiKey });

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

  console.log("Generating embeddings with OpenAI…");
  const vectors = await embedWithOpenAI(embedConfig);

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
  const [queryVector] = await embedWithOpenAI({
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
