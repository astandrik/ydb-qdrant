#!/usr/bin/env bash
set -euo pipefail

YDB_LOCAL_GRPC_PORT="${YDB_LOCAL_GRPC_PORT:-2136}"
YDB_LOCAL_MON_PORT="${YDB_LOCAL_MON_PORT:-8765}"
YDB_DATABASE="${YDB_DATABASE:-/local}"
PORT="${PORT:-8080}"

export YDB_DATABASE
export YDB_ANONYMOUS_CREDENTIALS="${YDB_ANONYMOUS_CREDENTIALS:-1}"

export GRPC_PORT="${YDB_LOCAL_GRPC_PORT}"
export MON_PORT="${YDB_LOCAL_MON_PORT}"

start_local_ydb() {
  if [[ -f "/initialize_local_ydb" ]]; then
    sh /initialize_local_ydb &
  else
    echo "initialize_local_ydb script not found; local YDB may not start correctly" >&2
  fi
}

wait_for_ydb() {
  local host="127.0.0.1"
  local port="${YDB_LOCAL_GRPC_PORT}"
  local retries=60

  # Uses bash /dev/tcp to test TCP connectivity; this script is bash-only (see shebang).
  for ((i=1; i<=retries; i++)); do
    if echo >"/dev/tcp/${host}/${port}" 2>/dev/null; then
      echo "YDB is accepting connections on ${host}:${port}"
      return 0
    fi
    echo "Waiting for YDB at ${host}:${port} (${i}/${retries})..."
    sleep 2
  done

  echo "YDB did not become ready in time" >&2
  exit 1
}

export YDB_ENDPOINT="grpc://localhost:${YDB_LOCAL_GRPC_PORT}"
start_local_ydb
wait_for_ydb

export PORT

exec node --experimental-specifier-resolution=node --enable-source-maps dist/index.js


