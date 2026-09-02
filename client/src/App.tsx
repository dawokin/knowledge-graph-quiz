import { useState } from 'react';
import InputPanel from './components/InputPanel';
import GraphView from './components/GraphView';
import QuizMode from './components/QuizMode';
import { analyzeItems } from './api';
import type { AnalysisResult, AnalyzedItem, RawItem } from './types';

type View = 'input' | 'graph' | 'quiz';

export default function App() {
  const [view, setView] = useState<View>('input');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (rawItems: RawItem[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeItems(rawItems);
      const rawById = new Map(rawItems.map((r) => [r.id, r.raw]));
      const merged: AnalyzedItem[] = result.items.map((item) => ({
        ...item,
        raw: rawById.get(item.id) ?? '',
      }));
      setAnalysis(result);
      setAnalyzedItems(merged);
      setView('graph');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось проанализировать материал.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setAnalyzedItems([]);
    setView('input');
    setError(null);
  };

  return (
    <div className="app">
      {view === 'input' && <InputPanel onSubmit={handleSubmit} loading={loading} error={error} />}
      {view === 'graph' && analysis && (
        <GraphView
          analysis={analysis}
          items={analyzedItems}
          onStartQuiz={() => setView('quiz')}
          onReset={reset}
        />
      )}
      {view === 'quiz' && <QuizMode items={analyzedItems} onExit={() => setView('graph')} />}
    </div>
  );
}
