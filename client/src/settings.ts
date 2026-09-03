export interface AppSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = 'kgq_settings_v2';

const DEFAULT_MODEL = 'deepseek-chat';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { apiKey: '', baseUrl: '', model: DEFAULT_MODEL };
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey ?? '',
      baseUrl: parsed.baseUrl ?? '',
      model: parsed.model || DEFAULT_MODEL,
    };
  } catch {
    return { apiKey: '', baseUrl: '', model: DEFAULT_MODEL };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private mode, etc.) - settings just won't persist.
  }
}

export function hasApiKey(settings: AppSettings): boolean {
  return settings.apiKey.trim().length > 0;
}
