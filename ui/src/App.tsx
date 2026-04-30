import { useEffect, useState } from "react";
import { fetchGraph } from "./lib/api";
import type { Graph } from "./lib/types";
import { MindmapCanvas } from "./components/MindmapCanvas";

function getSessionIdFromPath(): string | null {
  const match = window.location.pathname.match(/\/m\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function App() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionId = getSessionIdFromPath();

  useEffect(() => {
    if (!sessionId) {
      setError("No session id in URL. Expected /m/<session_id>.");
      return;
    }
    fetchGraph(sessionId)
      .then(setGraph)
      .catch((e) => setError(String(e)));
  }, [sessionId]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-xl font-semibold mb-2 text-rose-300">
            Could not load mindmap
          </h1>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="h-full flex items-center justify-center text-white/40 text-sm">
        Loading mindmap…
      </div>
    );
  }

  return <MindmapCanvas graph={graph} />;
}
