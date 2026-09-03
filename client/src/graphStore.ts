import type { AnalysisResult, AnalyzedItem } from './types';

export interface SavedGraph {
  analysis: AnalysisResult;
  items: AnalyzedItem[];
}

const STORAGE_KEY = 'kgq_graph_v1';

export function loadGraph(): SavedGraph | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.analysis || !Array.isArray(parsed?.items)) return null;
    return parsed as SavedGraph;
  } catch {
    return null;
  }
}

export function saveGraph(graph: SavedGraph): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - graph just won't persist across reloads.
  }
}

export function clearGraph(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
