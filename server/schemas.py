from typing import Literal
from pydantic import BaseModel, Field


class Node(BaseModel):
    id: int
    kind: Literal["issue", "pr"]
    state: Literal["open", "closed", "merged"]
    title: str
    url: str
    labels: list[str] = Field(default_factory=list)
    milestone: str | None = None


class Edge(BaseModel):
    source: int
    target: int
    kind: Literal["direct", "semantic"]
    reason: str


class GraphInput(BaseModel):
    version: Literal[1] = 1
    repo: str
    root: int
    nodes: list[Node]
    edges: list[Edge]
