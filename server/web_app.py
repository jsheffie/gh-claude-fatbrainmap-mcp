from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import session_store
from .schemas import GraphInput

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="gh-claude-fatbrainmap-mcp")


@app.post("/api/dev/seed")
def dev_seed(graph: GraphInput) -> JSONResponse:
    """Dev-only endpoint to seed a graph without going through MCP."""
    import secrets

    session_id = secrets.token_hex(4)
    session_store.put(session_id, graph)
    return JSONResponse({"session_id": session_id, "url": f"/m/{session_id}"})


@app.get("/api/graph/{session_id}")
def get_graph(session_id: str) -> JSONResponse:
    graph = session_store.get(session_id)
    if graph is None:
        raise HTTPException(status_code=404, detail=f"No graph for session {session_id}")
    return JSONResponse(graph.model_dump())


@app.get("/api/sessions")
def list_sessions() -> JSONResponse:
    return JSONResponse({"sessions": session_store.keys()})


@app.get("/healthz")
def health() -> dict:
    return {"ok": True}


# SPA fallback: serve index.html for any /m/* path so React Router (or hash) works
@app.get("/m/{session_id}")
def view_mindmap(session_id: str) -> FileResponse:
    index = STATIC_DIR / "index.html"
    if not index.exists():
        raise HTTPException(
            status_code=503,
            detail="UI not built. Run `npm run build` in the ui/ directory.",
        )
    return FileResponse(index)


# Static asset mount — must come last
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
