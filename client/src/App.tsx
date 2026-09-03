import { useState } from 'react';
import InputPanel from './components/InputPanel';
import GraphView from './components/GraphView';
import QuizMode from './components/QuizMode';
import SettingsForm from './components/Settings';
import { analyzeItems } from './api';
import { clearGraph, loadGraph, saveGraph } from './graphStore';
import { hasApiKey, loadSettings, saveSettings, type AppSettings } from './settings';
import type { AnalysisResult, AnalyzedItem, RawItem } from './types';

type View = 'settings' | 'input' | 'graph' | 'quiz';

function initialView(settings: AppSettings): View {
  if (!hasApiKey(settings)) return 'settings';
  return loadGraph() ? 'graph' : 'input';
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [view, setView] = useState<View>(() => initialView(loadSettings()));
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => loadGraph()?.analysis ?? null);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedItem[]>(() => loadGraph()?.items ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveSettings = (next: AppSettings) => {
    saveSettings(next);
    setSettings(next);
    setView(analysis ? 'graph' : 'input');
  };

  const handleDeleteKey = () => {
    const cleared: AppSettings = { apiKey: '', baseUrl: '', model: settings.model };
    saveSettings(cleared);
    setSettings(cleared);
  };

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
      saveGraph({ analysis: result, items: merged });
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
    clearGraph();
    setView('input');
    setError(null);
  };

  return (
    <div className="app">
      {view !== 'settings' && (
        <button className="gear-button" title="Настройки" onClick={() => setView('settings')}>
          ⚙
        </button>
      )}

      {view === 'settings' && (
        <SettingsForm
          initial={settings}
          onSave={handleSaveSettings}
          onDelete={hasApiKey(settings) ? handleDeleteKey : null}
          onClose={hasApiKey(settings) ? () => setView(analysis ? 'graph' : 'input') : null}
        />
      )}
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
