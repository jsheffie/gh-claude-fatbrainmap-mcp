"""Quick helper to seed the running web server with the example graph for offline UI dev.

Usage (with the web server running on :8765):
    python scripts/seed.py [PATH_TO_JSON]

Defaults to examples/sample-graph.json. Prints the URL to open in your browser.
"""
import json
import secrets
import sys
import urllib.request
from pathlib import Path


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else (
        Path(__file__).parent.parent / "examples" / "sample-graph.json"
    )
    data = json.loads(path.read_text())
    session_id = secrets.token_hex(4)

    # Hit the server's internal seed endpoint via direct module call would be cleaner,
    # but the simplest path: just import the store and write to it.
    # This script must be run with the same Python that's running the server.
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from server import session_store
    from server.schemas import GraphInput

    session_store.put(session_id, GraphInput.model_validate(data))
    print(f"Seeded session {session_id}")
    print(f"Open: http://localhost:5173/m/{session_id}  (Vite dev)")
    print(f"  or: http://localhost:8765/m/{session_id}  (production build)")


if __name__ == "__main__":
    main()
