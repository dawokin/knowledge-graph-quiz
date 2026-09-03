import { loadSettings } from './settings';

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_TIMEOUT_MS = 60_000;

interface ToolCallOptions {
  system: string;
  userMessage: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
  timeoutMs?: number;
}

export async function callToolForJson<T>(options: ToolCallOptions): Promise<T> {
  const settings = loadSettings();
  if (!settings.apiKey.trim()) {
    throw new Error('Не задан API-ключ DeepSeek. Открой настройки (значок ⚙) и вставь свой ключ.');
  }

  const baseUrl = (settings.baseUrl.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const model = settings.model.trim() || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 4096,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.userMessage },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: options.toolName,
              description: options.toolDescription,
              parameters: options.inputSchema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: options.toolName } },
      }),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Запрос к DeepSeek API превысил таймаут (${Math.round(timeoutMs / 1000)}с). Попробуй ещё раз.`);
    }
    // fetch throws the same opaque TypeError for a dropped connection and for
    // a CORS-blocked response - the browser never exposes which one happened.
    console.error('DeepSeek fetch failed (network error or CORS block):', err);
    throw new Error(
      'Не удалось получить ответ от DeepSeek API. Браузер не различает обрыв сети и блокировку ' +
        'CORS-политикой - если проблема не в интернет-соединении, вероятная причина в том, что ' +
        'api.deepseek.com (или указанный тобой Base URL) не отдаёт заголовки Access-Control-Allow-Origin ' +
        'для прямых запросов из браузера. В таком случае нужен прокси-эндпоинт с настроенным CORS - ' +
        'укажи его в поле Base URL. Подробности обычно видны во вкладке Network/Console DevTools.'
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error('DeepSeek отклонил API-ключ (401). Проверь ключ в настройках.');
    }
    if (res.status === 429) {
      throw new Error('Превышен лимит запросов к DeepSeek API (429). Попробуй позже.');
    }
    throw new Error(`Ошибка DeepSeek API (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  const choice = data?.choices?.[0];

  if (choice?.finish_reason === 'length') {
    throw new Error(
      'Ответ модели был обрезан по лимиту токенов (finish_reason: length) - вероятно, слишком много ' +
        'материала за один раз. Попробуй уменьшить количество ссылок/заметок за один анализ.'
    );
  }

  const toolCall = choice?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error('Модель не вернула ожидаемый структурированный ответ (tool call).');
  }

  try {
    return JSON.parse(toolCall.function.arguments) as T;
  } catch {
    throw new Error('Не удалось разобрать JSON-ответ модели (возможно, он был обрезан).');
  }
}
