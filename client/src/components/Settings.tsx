import { useState } from 'react';
import type { AppSettings } from '../settings';

interface Props {
  initial: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: (() => void) | null;
}

export default function Settings({ initial, onSave, onClose }: Props) {
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [showKey, setShowKey] = useState(false);

  const save = () => {
    if (apiKey.trim().length === 0) return;
    onSave({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() || 'deepseek-chat' });
  };

  return (
    <div className="panel settings-panel">
      <h1>Настройки</h1>
      <p className="subtitle">
        Приложение работает полностью в браузере: запросы к DeepSeek API уходят напрямую с твоего
        устройства, ключ хранится только в этом браузере (localStorage) и никуда, кроме DeepSeek
        (или указанного тобой прокси), не отправляется.
      </p>

      <label className="field-label" htmlFor="api-key">
        DeepSeek API ключ
      </label>
      <div className="key-input-row">
        <input
          id="api-key"
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          autoComplete="off"
        />
        <button className="secondary" onClick={() => setShowKey((v) => !v)}>
          {showKey ? 'Скрыть' : 'Показать'}
        </button>
      </div>
      <p className="hint">
        Получить ключ можно на{' '}
        <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">
          platform.deepseek.com
        </a>{' '}
        — DeepSeek обычно доступен напрямую из России без VPN.
      </p>

      <label className="field-label" htmlFor="base-url">
        Base URL (необязательно)
      </label>
      <input
        id="base-url"
        type="text"
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
        placeholder="https://api.deepseek.com (по умолчанию)"
      />
      <p className="hint">
        Меняй только если пользуешься совместимым прокси/шлюзом вместо прямого обращения к
        api.deepseek.com.
      </p>

      <label className="field-label" htmlFor="model">
        Модель (необязательно)
      </label>
      <input
        id="model"
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="deepseek-chat"
      />

      <div className="actions">
        {onClose && (
          <button className="secondary" onClick={onClose}>
            Отмена
          </button>
        )}
        <button className="primary" onClick={save} disabled={apiKey.trim().length === 0}>
          Сохранить
        </button>
      </div>
    </div>
  );
}
