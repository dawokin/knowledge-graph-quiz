import { Router } from 'express';
import { callToolForJson } from '../anthropic.js';
import type { AnalysisResult, RawItem } from '../types.js';

const router = Router();

const INPUT_SCHEMA = {
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

router.post('/', async (req, res) => {
  try {
    const items: RawItem[] = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Provide a non-empty "items" array of { id, raw }.' });
      return;
    }
    if (items.length > 200) {
      res.status(400).json({ error: 'Too many items; limit to 200 per request.' });
      return;
    }

    const listing = items
      .map((it) => `- id: ${it.id}\n  content: ${it.raw.slice(0, 2000)}`)
      .join('\n');

    const result = await callToolForJson<AnalysisResult>({
      system:
        'You are a research assistant that organizes a personal knowledge base. ' +
        'Given a list of links and notes, classify each into a small number (3-8) of clear categories, ' +
        'write a concise title and 1-2 sentence summary for each item based on its content (for URLs, infer ' +
        'topic from the URL and any surrounding text), and identify meaningful conceptual relationships ' +
        'between items to build a knowledge graph. Not every item needs to connect to every other item - ' +
        'only add an edge when there is a real conceptual relationship (same topic, builds on, contrasts with, ' +
        'example of, prerequisite for, etc). Every item must be assigned to exactly one category from your list.',
      userMessage: `Here are the items to analyze:\n\n${listing}`,
      toolName: 'submit_knowledge_graph',
      toolDescription: 'Submit the categorization and relationship graph for the provided items.',
      inputSchema: INPUT_SCHEMA,
      maxTokens: 8192,
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Analysis failed.' });
  }
});

export default router;
