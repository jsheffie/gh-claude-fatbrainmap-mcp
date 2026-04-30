#!/usr/bin/env bash
# Run the FastAPI web server and Vite dev server concurrently for development.
# UI:  http://localhost:5173
# API: http://localhost:8765 (proxied at /api by Vite)
#
# To preload a graph for testing without Claude:
#   curl -X POST http://localhost:8765/api/dev/seed -H 'content-type: application/json' \
#     --data @examples/sample-graph.json
# (the dev-seed endpoint is not implemented; use the python REPL instead — see README)
set -euo pipefail
cd "$(dirname "$0")/.."

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT

(cd ui && npm run dev) &
uvicorn server.web_app:app --host 127.0.0.1 --port 8765 --reload
