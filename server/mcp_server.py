import os
import secrets
import signal
import socket
import threading
import time

import uvicorn
from fastmcp import FastMCP

from . import session_store
from .schemas import GraphInput
from .web_app import app as web_app

WEB_HOST = "127.0.0.1"
WEB_PORT = 8765

_server_started = False
_server_lock = threading.Lock()


def _kill_port_occupant(host: str, port: int) -> None:
    """Kill any process already listening on host:port (macOS/Linux)."""
    try:
        import subprocess
        result = subprocess.run(
            ["lsof", "-ti", f"TCP:{port}"],
            capture_output=True, text=True
        )
        for pid_str in result.stdout.strip().splitlines():
            try:
                os.kill(int(pid_str), signal.SIGTERM)
            except (ProcessLookupError, ValueError):
                pass
        # give them a moment to die
        time.sleep(0.3)
    except Exception:
        pass


def _port_in_use(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=0.2):
            return True
    except OSError:
        return False


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
        # Kill any stale server from a previous session so our session store is authoritative
        if _port_in_use(WEB_HOST, WEB_PORT):
            _kill_port_occupant(WEB_HOST, WEB_PORT)
        thread = threading.Thread(target=_run_uvicorn, daemon=True, name="fatbrainmap-web")
        thread.start()
        # wait for port to accept connections
        for _ in range(40):
            time.sleep(0.1)
            if _port_in_use(WEB_HOST, WEB_PORT):
                break
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
