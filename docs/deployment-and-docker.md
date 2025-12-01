## Deployment and Docker

This document covers both the **standalone** `ydb-qdrant` image (connects to an external YDB) and the **all-in-one** `ydb-qdrant-local` image (includes a local YDB inside the container).

### Standalone HTTP Server (Published Image)

Published container: `ghcr.io/astandrik/ydb-qdrant`

Option A – pull the published image (recommended):

```bash
docker pull ghcr.io/astandrik/ydb-qdrant:latest

docker run -d --name ydb-qdrant \
  -p 8080:8080 \
  -e YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135 \
  -e YDB_DATABASE=/ru-central1/<cloud>/<db> \
  -e YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json \
  -v /abs/path/sa-key.json:/sa-key.json:ro \
  ghcr.io/astandrik/ydb-qdrant:latest
```

Option B – build the image locally:

From the `ydb-qdrant/` directory:

```bash
docker build -t ydb-qdrant:latest .

docker run -d --name ydb-qdrant \
  -p 8080:8080 \
  -e YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135 \
  -e YDB_DATABASE=/ru-central1/<cloud>/<db> \
  -e YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json \
  -v /abs/path/sa-key.json:/sa-key.json:ro \
  ydb-qdrant:latest
```

### All-in-one: Local YDB + ydb-qdrant

For a single-container local dev/demo setup with both YDB and ydb-qdrant inside:

```bash
docker pull ghcr.io/astandrik/ydb-qdrant-local:latest

docker run -d --name ydb-qdrant-local \
  -p 8080:8080 \
  -p 8765:8765 \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

Key env vars (all optional; the image provides sensible defaults, override only when you need custom tuning):

- YDB / local YDB:
  - `YDB_LOCAL_GRPC_PORT` (default `2136`): internal YDB gRPC port.
  - `YDB_LOCAL_MON_PORT` (default `8765`): internal YDB Embedded UI HTTP port.
  - `YDB_DATABASE` (default `/local`).
  - `YDB_ANONYMOUS_CREDENTIALS` (default `1` inside this image).
  - `YDB_USE_IN_MEMORY_PDISKS` (default `0`, values `0`/`1`): store data in RAM only when `1` (fast, non-persistent).
  - `YDB_LOCAL_SURVIVE_RESTART` (default `0`, values `0`/`1`): control persistence across restarts when using a mounted data volume.
  - `YDB_DEFAULT_LOG_LEVEL`, `YDB_FEATURE_FLAGS`, `YDB_ENABLE_COLUMN_TABLES`, `YDB_KAFKA_PROXY_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` – passed through to YDB as in the official `local-ydb` image.

- ydb-qdrant:
  - `PORT` (default `8080`): HTTP port inside the container.
  - `LOG_LEVEL` (default `info`).
  - `VECTOR_INDEX_BUILD_ENABLED` (default `true` in `multi_table` mode, `false` in `one_table` mode).
  - `YDB_QDRANT_COLLECTION_STORAGE_MODE` / `YDB_QDRANT_TABLE_LAYOUT` (`multi_table` or `one_table`).
  - `YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE`.

> Note: In the `ydb-qdrant-local` image, `YDB_ENDPOINT` is unconditionally set to `grpc://127.0.0.1:<YDB_LOCAL_GRPC_PORT>` by the entrypoint — any user-provided value is ignored. Use the standalone `ydb-qdrant` image if you need to connect to an external YDB.

#### Health checks and self-healing (`ydb-qdrant-local`)

The local image exposes `/health` on port `8080`. This endpoint reports `status: "ok"` only when both the HTTP server and the embedded YDB instance are reachable. If YDB is down, `/health` returns HTTP 503 so Docker health checks can detect the failure.

When running with a restart policy, Docker or your orchestrator can automatically restart the container if the process exits or the container is marked unhealthy. A typical local run with a restart policy:

```bash
docker run -d --name ydb-qdrant-local \
  --restart=unless-stopped \
  -p 8080:8080 \
  -p 8765:8765 \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

For Docker Compose:

```yaml
services:
  ydb-qdrant-local:
    image: ghcr.io/astandrik/ydb-qdrant-local:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "8765:8765"
```

Together with the embedded YDB monitor in the entrypoint script, this allows a simple Docker or Compose setup to recover automatically when the embedded YDB process dies.

#### Persistence across restarts (optional)

The example above is optimized for quick local experiments and uses container-local storage, so data is effectively ephemeral. To keep embedded YDB data across container restarts and recreation, mount a volume for the YDB data directory and enable restart survival:

```bash
docker run -d --name ydb-qdrant-local \
  -p 8080:8080 \
  -p 8765:8765 \
  -e YDB_LOCAL_SURVIVE_RESTART=1 \
  -v "$PWD/ydb_data:/ydb_data" \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

- **`-v "$PWD/ydb_data:/ydb_data"`**: mounts a host directory where the embedded YDB stores its data; as long as you reuse this volume, your data survives container restarts and recreation.
- **`YDB_LOCAL_SURVIVE_RESTART=1`**: tells the local YDB instance to reuse existing data in `/ydb_data` instead of reinitializing the cluster on each start.
- Other YDB env vars such as `YDB_USE_IN_MEMORY_PDISKS` (default `0`) and `YDB_DATABASE` (default `/local`) are left at their documented defaults and usually do not need to be overridden for this setup.

If you prefer a Docker-managed named volume instead of a host directory:

```bash
docker volume create ydb-qdrant-local-data

docker run -d --name ydb-qdrant-local \
  -p 8080:8080 \
  -p 8765:8765 \
  -e YDB_LOCAL_SURVIVE_RESTART=1 \
  -v ydb-qdrant-local-data:/ydb_data \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

- **`docker volume create ydb-qdrant-local-data`**: creates a persistent Docker volume managed by the Docker engine.
- **`-v ydb-qdrant-local-data:/ydb_data`**: mounts that volume at `/ydb_data`; data survives container restarts and container recreation as long as the volume is not removed.

You can achieve the same with Docker Compose:

```yaml
services:
  ydb-qdrant-local:
    image: ghcr.io/astandrik/ydb-qdrant-local:latest
    ports:
      - "8080:8080"
      - "8765:8765"
    environment:
      YDB_LOCAL_SURVIVE_RESTART: "1"
    volumes:
      - ./ydb_data:/ydb_data
```

With this configuration, data is only lost if you delete the mounted host directory or Docker volume backing `/ydb_data`.

To quickly verify persistence:

- Start `ydb-qdrant-local` with the persistent `docker run` (or Compose) example above.
- Create a collection and upsert at least one point via the HTTP API on `http://localhost:8080`.
- Restart the container (`docker restart ydb-qdrant-local`) or recreate it while reusing the same volume.
- Query the collection again and confirm the previously inserted point is still returned.

### Apple Silicon (Mac) Notes

The `ydb-qdrant-local` image is built on top of the `local-ydb` Docker image, which is x86_64/amd64-only. On Apple Silicon (M1/M2/M3) you need to run it under x86_64/amd64 emulation:

- Enable Rosetta (x86_64/amd64 emulation) in your Docker backend:
  - Docker Desktop: enable Rosetta to run x86_64/amd64 containers.
  - Or use Colima as in the YDB docs:
    - `colima start --arch aarch64 --vm-type=vz --vz-rosetta`
- When running the container, force the amd64 platform explicitly:

```bash
docker run --platform linux/amd64 -d --name ydb-qdrant-local \
  -p 8080:8080 -p 8765:8765 \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

This keeps behavior aligned with the official YDB `local-ydb` image recommendations for macOS/Apple Silicon.

### Docker Compose

Example `docker-compose.yml` (can be used instead of raw `docker run`):

```yaml
services:
  ydb-qdrant:
    image: ghcr.io/astandrik/ydb-qdrant:latest
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      YDB_ENDPOINT: ${YDB_ENDPOINT}
      YDB_DATABASE: ${YDB_DATABASE}
      YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS: /sa-key.json
      PORT: ${PORT:-8080}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    volumes:
      - ${YDB_SA_KEY_PATH}:/sa-key.json:ro
```

Example `.env` (per environment):

```bash
YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135
YDB_DATABASE=/ru-central1/<cloud>/<db>
YDB_SA_KEY_PATH=/abs/path/to/ydb-sa.json
PORT=8080
LOG_LEVEL=info
```

- Updating to a newer image with Compose (no rebuild):
  - Pull the latest tag and restart the service:

```bash
docker-compose pull ydb-qdrant
docker-compose up -d ydb-qdrant
```

Environment variables for Docker deployments use the same variables as documented in [Configure credentials in the root README](../README.md#configure-credentials) (`YDB_ENDPOINT`, `YDB_DATABASE`, one of the `YDB_*_CREDENTIALS` options, optional `PORT`/`LOG_LEVEL`).

### References

- [Configure credentials in the root README](../README.md#configure-credentials)

