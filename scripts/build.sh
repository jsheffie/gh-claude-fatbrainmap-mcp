#!/usr/bin/env bash
# Build the UI into server/static/ and produce a Python wheel.
set -euo pipefail
cd "$(dirname "$0")/.."

(cd ui && npm install && npm run build)
python -m build
