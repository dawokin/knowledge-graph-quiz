import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisResult, AnalyzedItem } from '../types';
import { colorForCategory } from '../palette';

interface Props {
  analysis: AnalysisResult;
  items: AnalyzedItem[];
  onStartQuiz: () => void;
  onReset: () => void;
}

export default function GraphView({ analysis, items, onStartQuiz, onReset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categoryIds = useMemo(() => analysis.categories.map((c) => c.id), [analysis.categories]);
  const itemsById = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = new DataSet(
      analysis.items.map((item) => ({
        id: item.id,
        label: item.title,
        color: {
          background: colorForCategory(item.categoryId, categoryIds),
          border: '#1b1b1f',
          highlight: { background: '#ffffff', border: '#1b1b1f' },
        },
        font: { color: '#1b1b1f', size: 13 },
        shape: 'dot',
        size: 16,
      }))
    );

    const edges = new DataSet(
      analysis.edges.map((edge, index) => ({
        id: index,
        from: edge.source,
        to: edge.target,
        label: edge.label,
        arrows: 'to',
        color: { color: '#9aa0aa', highlight: '#5b8def' },
        font: { size: 10, color: '#6b7280', strokeWidth: 0, align: 'top' },
        smooth: { enabled: true, type: 'continuous', roundness: 0.4 },
      }))
    );

    const network = new Network(
      containerRef.current,
      { nodes, edges },
      {
        physics: {
          barnesHut: { gravitationalConstant: -12000, springLength: 140, springConstant: 0.04 },
          stabilization: { iterations: 150 },
        },
        interaction: { hover: true, tooltipDelay: 150 },
        edges: { width: 1.5 },
      }
    );

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        setSelectedId(String(params.nodes[0]));
      } else {
        setSelectedId(null);
      }
    });

    networkRef.current = network;

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [analysis, categoryIds]);

  const selectedItem = selectedId ? itemsById.get(selectedId) : null;

  return (
    <div className="graph-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Категории</h2>
          <button className="link-button" onClick={onReset}>
            ← новый ввод
          </button>
        </div>
        <ul className="legend">
          {analysis.categories.map((cat) => (
            <li key={cat.id}>
              <span className="dot" style={{ background: colorForCategory(cat.id, categoryIds) }} />
              {cat.name}
              <span className="count">
                {analysis.items.filter((it) => it.categoryId === cat.id).length}
              </span>
            </li>
          ))}
        </ul>

        {selectedItem ? (
          <div className="item-detail">
            <div className="badge">{selectedItem.type === 'link' ? 'Ссылка' : 'Заметка'}</div>
            <h3>{selectedItem.title}</h3>
            <p className="summary">{selectedItem.summary}</p>
            {selectedItem.type === 'link' ? (
              <a href={extractUrl(selectedItem.raw)} target="_blank" rel="noreferrer" className="raw-link">
                Открыть ссылку
              </a>
            ) : (
              <p className="raw-text">{selectedItem.raw}</p>
            )}
          </div>
        ) : (
          <p className="hint">Кликни на узел графа, чтобы увидеть детали.</p>
        )}

        <button className="primary quiz-button" onClick={onStartQuiz}>
          🎯 Начать квиз
        </button>
      </aside>
      <div className="graph-canvas" ref={containerRef} />
    </div>
  );
}

function extractUrl(raw: string): string {
  const match = raw.match(/https?:\/\/\S+/);
  return match ? match[0] : '#';
}
