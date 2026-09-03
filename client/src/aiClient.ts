import { loadSettings } from './settings';

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';

interface ToolCallOptions {
  system: string;
  userMessage: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}

export async function callToolForJson<T>(options: ToolCallOptions): Promise<T> {
  const settings = loadSettings();
  if (!settings.apiKey.trim()) {
    throw new Error('Не задан API-ключ DeepSeek. Открой настройки (значок ⚙) и вставь свой ключ.');
  }

  const baseUrl = (settings.baseUrl.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const model = settings.model.trim() || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
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
  } catch {
    throw new Error(
      'Не удалось соединиться с DeepSeek API. Проверь интернет-соединение, либо, если запрос ' +
      'блокируется в твоей сети, укажи в настройках свой Base URL (совместимый прокси-эндпоинт).'
    );
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
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error('Модель не вернула ожидаемый структурированный ответ (tool call).');
  }

  try {
    return JSON.parse(toolCall.function.arguments) as T;
  } catch {
    throw new Error('Не удалось разобрать JSON-ответ модели.');
  }
}
