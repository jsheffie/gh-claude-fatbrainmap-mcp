# gh-claude-fatbrainmap-mcp

An MCP server that turns GitHub issue/PR relationship graphs into interactive mindmaps. Designed to pair with the [`gh-claude`](https://github.com/jsheffie/gh-claude) Claude Code plugin: when you run `/gh-claude:gh-related 42`, the skill builds a JSON graph and hands it to this server, which spins up a local web UI and returns a clickable URL.

## What you get

- A FastMCP server that exposes one tool: `render_mindmap(graph)`
- A bundled FastAPI web app that serves a React Flow canvas with two layout engines:
  - **Hierarchy** (elk, layered) — root issue at top, related items branching down
  - **Organic** (d3-force) — coggle-style floating nodes pulled together by edges
- Bezier edges, solid for direct references and dashed for semantic matches
- Drag, zoom, minimap, right-click to hide a node
- Every node title links to the underlying GitHub issue/PR

## Install

Until this is on PyPI, install from source:

```bash
git clone https://github.com/jsheffie/gh-claude-fatbrainmap-mcp.git
cd gh-claude-fatbrainmap-mcp
python -m venv .venv && source .venv/bin/activate
pip install -e .
(cd ui && npm install && npm run build)

# Register with Claude Code (user scope = available in every project)
claude mcp add fatbrainmap --scope user -- "$(pwd)/.venv/bin/gh-claude-fatbrainmap-mcp"
```

Then restart Claude Code (or run `/mcp` to verify). Once connected, the `gh-claude` plugin's `/gh-claude:gh-related N` will detect the MCP tool and append a clickable mindmap URL to its output.

## Local development

```bash
# Python deps
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'

# UI deps
cd ui && npm install && cd ..

# Run both dev servers
./scripts/dev.sh

# In another terminal: seed an example graph and open the URL it prints
python scripts/seed.py
```

The MCP server proper (stdio transport for Claude Code) is launched via `gh-claude-fatbrainmap-mcp` (same name as the console script in `pyproject.toml`).

## Build for distribution

```bash
./scripts/build.sh    # builds UI into server/static/ then python wheel into dist/
```

## JSON contract

The skill must send graphs matching `server/schemas.py`:

```json
{
  "version": 1,
  "repo": "owner/name",
  "root": 42,
  "nodes": [
    {
      "id": 42, "kind": "issue", "state": "open",
      "title": "...", "url": "https://github.com/...",
      "labels": ["bug"], "milestone": "v2.1"
    }
  ],
  "edges": [
    { "source": 42, "target": 38, "kind": "direct", "reason": "fixes #38" }
  ]
}
```

See `examples/sample-graph.json` for a complete example.

## License

MIT
