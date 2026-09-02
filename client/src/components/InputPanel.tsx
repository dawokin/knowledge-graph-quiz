import { useState } from 'react';
import type { RawItem } from '../types';

const SAMPLE = `https://react.dev/learn - официальная документация React, объясняет компоненты и хуки
https://vitejs.dev - Vite, быстрый сборщик для фронтенда
Заметка: TypeScript добавляет статическую типизацию поверх JavaScript, ловит ошибки на этапе компиляции
https://www.docker.com/resources/what-container - что такое контейнеры и чем они отличаются от VM
Заметка: Kubernetes оркестрирует контейнеры, использует Docker или containerd как рантайм
https://en.wikipedia.org/wiki/REST - принципы REST API: statelessness, ресурсы, HTTP методы
Заметка: GraphQL - альтернатива REST, клиент сам описывает какие поля нужны
https://nodejs.org/en/docs - документация Node.js рантайма на движке V8`;

interface Props {
  onSubmit: (items: RawItem[]) => void;
  loading: boolean;
  error: string | null;
}

function parseLines(text: string): RawItem[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((raw, index) => ({ id: `item-${index}`, raw }));
}

export default function InputPanel({ onSubmit, loading, error }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const items = parseLines(text);
    if (items.length > 0) onSubmit(items);
  };

  return (
    <div className="panel input-panel">
      <h1>Knowledge Graph Quiz</h1>
      <p className="subtitle">
        Вставь ссылки и заметки (по одной на строку). ИИ разобьёт их на категории, построит граф связей
        и сможет протестировать тебя по этому материалу в режиме «Квиз».
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="https://example.com/article - описание&#10;Заметка: важная мысль про X&#10;..."
        rows={14}
      />
      <div className="actions">
        <button className="secondary" onClick={() => setText(SAMPLE)} disabled={loading}>
          Вставить пример
        </button>
        <button className="primary" onClick={handleSubmit} disabled={loading || text.trim().length === 0}>
          {loading ? 'Анализирую…' : 'Построить граф'}
        </button>
      </div>
      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
