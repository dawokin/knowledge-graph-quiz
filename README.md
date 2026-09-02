# knowledge-graph-quiz

AI-powered knowledge base: links & notes -> auto-categorized graph + quiz mode

Приложение принимает список ссылок и заметок, с помощью Claude (Anthropic API)
разбивает их на категории, строит интерактивный граф связей между материалами
(на [vis-network](https://visjs.github.io/vis-network/)) и умеет проверять
знания пользователя в режиме **«Квиз»**, где ИИ генерирует вопросы по
сохранённому материалу и оценивает ответы.

## Возможности

- **Ввод материала** — вставляешь ссылки и заметки построчно (по одной на
  строку).
- **Автокатегоризация** — ИИ распределяет элементы по 3–8 смысловым
  категориям, придумывает короткие заголовки и summary для каждого элемента.
- **Граф связей** — интерактивный граф (drag/zoom/hover) на vis-network:
  узлы раскрашены по категориям, рёбра подписаны типом связи ("builds on",
  "example of" и т.п.). Клик по узлу открывает карточку с деталями.
- **Режим «Квиз»** — ИИ генерирует вопросы (тест с вариантами и открытые)
  строго по сохранённому материалу, проверяет открытые ответы через отдельный
  вызов модели с частичным начислением баллов и объяснением, в конце —
  итоговый счёт.

## Архитектура

```
client/   Vite + React + TypeScript SPA (граф, квиз, ввод)
server/   Express API, вызывает Anthropic API через tool-use (принудительный
          structured JSON вместо парсинга свободного текста)
```

Взаимодействие с ИИ идёт только через сервер (ключ API никогда не попадает в
браузер). Все структурированные ответы модели (категории/граф, вопросы квиза,
оценка ответа) получаются через forced tool-use в Anthropic Messages API —
это надёжнее, чем просить модель вернуть "просто JSON" в тексте.

## Быстрый старт

Требуется Node.js 18+ и ключ Anthropic API ([console.anthropic.com](https://console.anthropic.com/)).

```bash
# 1. Установить зависимости (клиент + сервер)
npm run install:all

# 2. Настроить ключ API
cp server/.env.example server/.env
# и вписать туда ANTHROPIC_API_KEY=...

# 3. Запустить сервер и клиент одновременно
npm run dev
```

Клиент откроется на http://localhost:5173 (Vite dev-сервер проксирует запросы
`/api/*` на сервер, который слушает http://localhost:8787).

## Скрипты

| Команда                | Что делает                                      |
| ----------------------- | ------------------------------------------------ |
| `npm run install:all`   | установка зависимостей client + server           |
| `npm run dev`           | запуск обоих серверов разработки (concurrently)  |
| `npm run build`         | production-сборка server (tsc) и client (vite)  |
| `npm run typecheck`     | проверка типов в обоих проектах                  |

## Переменные окружения (`server/.env`)

```
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-sonnet-5   # опционально, модель по умолчанию
PORT=8787                          # опционально
```

## API

- `POST /api/analyze` — `{ items: { id, raw }[] }` → категории, элементы с
  заголовком/summary/категорией, рёбра графа.
- `POST /api/quiz/generate` — `{ items: AnalyzedItem[], count? }` → набор
  вопросов (multiple_choice / open) на основе сохранённого материала.
- `POST /api/quiz/grade` — `{ question, correctAnswer, userAnswer, explanation }`
  → `{ correct, score (0..1), feedback }` для открытых вопросов.
