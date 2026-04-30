import type { Graph } from "./types";

export async function fetchGraph(sessionId: string): Promise<Graph> {
  const res = await fetch(`/api/graph/${sessionId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch graph (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
