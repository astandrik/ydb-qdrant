# Basic Insert & Search Example (ydb-qdrant)

Minimal working example demonstrating:
- creating a collection
- inserting vectors
- searching with a query vector

You can run it two ways:
- **Manual vectors (default):** uses hard-coded 4D vectors to show the request flow.
- **With an embedder (OpenRouter):** set environment variables and the script will generate embeddings for real text.

### Where do the vectors come from?

By default this example uses hard-coded vectors so you can see the request flow end-to-end. For a real workflow, generate embeddings with your preferred model (e.g., OpenRouter, Cohere, Hugging Face) and pass the resulting float arrays directly to the `vector` fields in `upsert` and `search`—just keep the dimension consistent with the collection definition (`size: 4` in the manual path). An optional OpenRouter embedder flow is provided below.

## Run a local YDB + ydb-qdrant stack

This example needs a YDB backend. You can mirror our integration-test setup locally by running the YDB emulator and pointing ydb-qdrant at it via Docker networking:

```
# 1) Start a throwaway Docker network so the two containers can see each other
docker network create ydb-qdrant-example

# 2) Launch YDB local (listens on port 2136 inside the network)
docker run -d --name local-ydb --network ydb-qdrant-example -p 2136:2136 ghcr.io/ydb-platform/local-ydb:nightly

# 3) Start ydb-qdrant wired to that YDB instance
docker run -d --name ydb-qdrant --network ydb-qdrant-example -p 6333:6333 \
  -e YDB_ENDPOINT=grpc://local-ydb:2136 \
  -e YDB_DATABASE=/local \
  -e YDB_ANONYMOUS_CREDENTIALS=1 \
  astandrik/ydb-qdrant
```

When you're done, clean up with:

```
docker rm -f ydb-qdrant local-ydb
docker network rm ydb-qdrant-example
```

## Install and run the example

npm install
npm start

### Optional: run with an embedder (OpenRouter)

1) Set your OpenRouter key and opt into the embedder path:

```
export OPENROUTER_API_KEY=sk-or-...
export USE_EMBEDDER=openrouter
# Optional: override the embedding model (defaults to openai/text-embedding-3-small)
export OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
# Optional: override the base URL (defaults to https://openrouter.ai/api/v1)
export OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
# Optional: add recommended request metadata for OpenRouter's usage dashboard
export OPENROUTER_SITE_URL=https://your-site-or-docs.example.com
export OPENROUTER_APP_NAME="ydb-qdrant basic example"
```

2) Run the script again:

```
npm start
```

The script will:
- generate embeddings for three sample sentences via OpenRouter,
- create a collection whose dimension matches the model output,
- upsert the embedded sentences, and
- run a query embedding for "Find something peaceful and quiet" to illustrate a real semantic search.
