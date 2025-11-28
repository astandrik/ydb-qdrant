# Basic Insert & Search Example (ydb-qdrant)

Minimal working example demonstrating:
- creating a collection
- inserting vectors
- searching with a query vector

You can run it two ways:
- **Manual vectors (default):** uses hard-coded 4D vectors to show the request flow.
- **With an embedder (OpenAI):** set environment variables and the script will generate embeddings for real text.

### Where do the vectors come from?

This example does **not** include an embedder. The vectors are hard-coded so you can see the request flow end-to-end. In a real application, generate embeddings with your preferred model (e.g., OpenAI, Cohere, Hugging Face) and pass the resulting float arrays directly to the `vector` fields in `upsert` and `search`—just keep the dimension consistent with the collection definition (`size: 4` in this example).

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

### Optional: run with an embedder (OpenAI)

1) Set your OpenAI key and opt into the embedder path:

```
export OPENAI_API_KEY=sk-...
export USE_EMBEDDER=openai
# Optional: override the embedding model (defaults to text-embedding-3-small)
export OPENAI_EMBED_MODEL=text-embedding-3-small
```

2) Run the script again:

```
npm start
```

The script will:
- generate embeddings for three sample sentences,
- create a collection whose dimension matches the model output,
- upsert the embedded sentences, and
- run a query embedding for "Find something peaceful and quiet" to illustrate a real semantic search.
