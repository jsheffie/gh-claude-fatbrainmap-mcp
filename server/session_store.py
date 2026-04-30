import threading
from .schemas import GraphInput

_store: dict[str, GraphInput] = {}
_lock = threading.Lock()


def put(session_id: str, graph: GraphInput) -> None:
    with _lock:
        _store[session_id] = graph


def get(session_id: str) -> GraphInput | None:
    with _lock:
        return _store.get(session_id)


def keys() -> list[str]:
    with _lock:
        return list(_store.keys())
