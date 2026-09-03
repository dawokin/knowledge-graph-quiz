import { useState } from 'react';
import { isValidBaseUrl } from '../lib/normalize';
import type { AppSettings } from '../settings';

interface Props {
  initial: AppSettings;
  onSave: (settings: AppSettings) => void;
  onDelete: (() => void) | null;
  onClose: (() => void) | null;
}

export default function Settings({ initial, onSave, onDelete, onClose }: Props) {
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [showKey, setShowKey] = useState(false);

  const baseUrlValid = isValidBaseUrl(baseUrl);
  const canSave = apiKey.trim().length > 0 && baseUrlValid;

  const save = () => {
    if (!canSave) return;
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
        aria-invalid={!baseUrlValid}
      />
      {baseUrlValid ? (
        <p className="hint">
          Меняй только если пользуешься совместимым прокси/шлюзом вместо прямого обращения к
          api.deepseek.com.
        </p>
      ) : (
        <p className="hint error-text">Похоже на невалидный URL — нужен адрес вида https://...</p>
      )}

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
        {onDelete && (
          <button
            className="secondary danger"
            onClick={() => {
              onDelete();
              setApiKey('');
            }}
          >
            Удалить ключ
          </button>
        )}
        {onClose && (
          <button className="secondary" onClick={onClose}>
            Отмена
          </button>
        )}
        <button className="primary" onClick={save} disabled={!canSave}>
          Сохранить
        </button>
      </div>
    </div>
  );
}
