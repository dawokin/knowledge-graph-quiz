import Anthropic from '@anthropic-ai/sdk';
import { loadSettings } from './settings';

interface ToolCallOptions {
  system: string;
  userMessage: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}

function getClient(): { client: Anthropic; model: string } {
  const settings = loadSettings();
  if (!settings.apiKey.trim()) {
    throw new Error('Не задан API-ключ Anthropic. Открой настройки (значок ⚙) и вставь свой ключ.');
  }
  const client = new Anthropic({
    apiKey: settings.apiKey.trim(),
    baseURL: settings.baseUrl.trim() || undefined,
    dangerouslyAllowBrowser: true,
  });
  return { client, model: settings.model || 'claude-sonnet-5' };
}

export async function callToolForJson<T>(options: ToolCallOptions): Promise<T> {
  const { client, model } = getClient();

  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 4096,
      system: options.system,
      messages: [{ role: 'user', content: options.userMessage }],
      tools: [
        {
          name: options.toolName,
          description: options.toolDescription,
          input_schema: options.inputSchema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: options.toolName },
    });
  } catch (err) {
    throw new Error(describeAnthropicError(err));
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolUse) {
    throw new Error('Модель не вернула ожидаемый структурированный ответ (tool_use).');
  }

  return toolUse.input as T;
}

function describeAnthropicError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) {
      return 'Anthropic отклонил API-ключ (401). Проверь ключ в настройках.';
    }
    if (err.status === 429) {
      return 'Превышен лимит запросов к Anthropic API (429). Попробуй позже.';
    }
    return `Ошибка Anthropic API (${err.status ?? '?'}): ${err.message}`;
  }
  if (err instanceof TypeError) {
    return (
      'Не удалось соединиться с Anthropic API из браузера. Если запрос заблокирован ' +
      'в твоей сети/стране — укажи в настройках свой Base URL (адрес прокси, совместимого ' +
      'с Anthropic API), либо используй VPN.'
    );
  }
  return err instanceof Error ? err.message : 'Неизвестная ошибка при обращении к Anthropic API.';
}
