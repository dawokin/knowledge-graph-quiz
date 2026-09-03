export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    categories: {
      type: 'array',
      description: 'A small set of meaningful topical categories that cover the items.',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Short slug id, e.g. "web-dev"' },
          name: { type: 'string', description: 'Human readable category name' },
        },
        required: ['id', 'name'],
      },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Must match the input item id exactly' },
          title: { type: 'string', description: 'Short descriptive title (max ~8 words)' },
          summary: { type: 'string', description: '1-2 sentence summary of the item content' },
          categoryId: { type: 'string', description: 'Must match one of the categories ids' },
          type: { type: 'string', enum: ['link', 'note'] },
        },
        required: ['id', 'title', 'summary', 'categoryId', 'type'],
      },
    },
    edges: {
      type: 'array',
      description: 'Meaningful conceptual relationships between items (not every pair needs an edge).',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'item id' },
          target: { type: 'string', description: 'item id' },
          label: { type: 'string', description: 'short relation label, e.g. "builds on", "example of"' },
        },
        required: ['source', 'target', 'label'],
      },
    },
  },
  required: ['categories', 'items', 'edges'],
};

export const QUIZ_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'unique short id, e.g. "q1"' },
          type: { type: 'string', enum: ['multiple_choice', 'open'] },
          question: { type: 'string' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exactly 4 options, only for multiple_choice questions',
          },
          correctAnswer: {
            type: 'string',
            description:
              'For multiple_choice, must exactly match one of the options. For open, the ideal answer.',
          },
          itemIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'ids of the source items this question is based on',
          },
          explanation: { type: 'string', description: 'short explanation shown after answering' },
        },
        required: ['id', 'type', 'question', 'correctAnswer', 'itemIds', 'explanation'],
      },
    },
  },
  required: ['questions'],
};

export const GRADING_SCHEMA = {
  type: 'object',
  properties: {
    correct: { type: 'boolean', description: 'Whether the user answer is substantially correct' },
    score: { type: 'number', description: 'Score from 0 to 1, allowing partial credit' },
    feedback: { type: 'string', description: 'Short, encouraging feedback explaining the correct answer' },
  },
  required: ['correct', 'score', 'feedback'],
};
