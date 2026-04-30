import secrets
import threading
import time
from typing import Any

import uvicorn
from fastmcp import FastMCP

from . import session_store
from .schemas import GraphInput
from .web_app import app as web_app

WEB_HOST = "127.0.0.1"
WEB_PORT = 8765

_server_started = False
_server_lock = threading.Lock()


def _run_uvicorn() -> None:
    config = uvicorn.Config(
        web_app,
        host=WEB_HOST,
        port=WEB_PORT,
        log_level="warning",
        access_log=False,
    )
    server = uvicorn.Server(config)
    server.run()


def ensure_web_server_started() -> None:
    global _server_started
    with _server_lock:
        if _server_started:
            return
        thread = threading.Thread(target=_run_uvicorn, daemon=True, name="fatbrainmap-web")
        thread.start()
        # brief wait so the URL we return is actually serving
        for _ in range(20):
            time.sleep(0.05)
            try:
                import socket

                with socket.create_connection((WEB_HOST, WEB_PORT), timeout=0.1):
                    break
            except OSError:
                continue
        _server_started = True


mcp = FastMCP(
    name="fatbrainmap",
    instructions=(
        "Render GitHub issue/PR relationship graphs as interactive mindmaps. "
        "Call render_mindmap with a graph following the GraphInput schema."
    ),
)


@mcp.tool()
async def render_mindmap(graph: GraphInput) -> str:
    """Render a GitHub issue/PR relationship graph as an interactive mindmap.

    Pass a graph with `repo`, `root` (the queried issue/PR number),
    `nodes` (id, kind, state, title, url, labels, milestone), and
    `edges` (source, target, kind, reason). Returns a clickable URL
    that opens the visualization in the user's browser.
    """
    session_id = secrets.token_hex(4)
    session_store.put(session_id, graph)
    ensure_web_server_started()
    url = f"http://{WEB_HOST}:{WEB_PORT}/m/{session_id}"
    return f"Mindmap ready: [Open visualization]({url})"


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
