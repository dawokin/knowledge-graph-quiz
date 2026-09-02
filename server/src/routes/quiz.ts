import { Router } from 'express';
import { callToolForJson } from '../anthropic.js';
import type { AnalyzedItem, GradingResult, QuizSet } from '../types.js';

const router = Router();

const QUIZ_SCHEMA = {
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
            description: 'For multiple_choice, must exactly match one of the options. For open, the ideal answer.',
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

router.post('/generate', async (req, res) => {
  try {
    const items: AnalyzedItem[] = req.body?.items;
    const count: number = Number(req.body?.count) || 8;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Provide a non-empty "items" array (analyzed items).' });
      return;
    }

    const listing = items
      .map((it) => `- id: ${it.id}\n  title: ${it.title}\n  category: ${it.categoryId}\n  summary: ${it.summary}`)
      .join('\n');

    const result = await callToolForJson<QuizSet>({
      system:
        'You are a quiz master testing a user on their saved knowledge base of notes and links. ' +
        `Create exactly ${count} varied quiz questions (mix of multiple_choice and open) strictly based on the ` +
        'provided items - do not invent facts not implied by the summaries. Multiple choice questions must have ' +
        'exactly 4 plausible options with exactly one correct answer. Spread questions across different items/categories. ' +
        'Reference the relevant source item ids in itemIds for each question.',
      userMessage: `Saved knowledge base items:\n\n${listing}`,
      toolName: 'submit_quiz',
      toolDescription: 'Submit the generated quiz questions.',
      inputSchema: QUIZ_SCHEMA,
      maxTokens: 4096,
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Quiz generation failed.' });
  }
});

const GRADING_SCHEMA = {
  type: 'object',
  properties: {
    correct: { type: 'boolean', description: 'Whether the user answer is substantially correct' },
    score: { type: 'number', description: 'Score from 0 to 1, allowing partial credit' },
    feedback: { type: 'string', description: 'Short, encouraging feedback explaining the correct answer' },
  },
  required: ['correct', 'score', 'feedback'],
};

router.post('/grade', async (req, res) => {
  try {
    const { question, correctAnswer, userAnswer, explanation } = req.body ?? {};
    if (!question || !correctAnswer || typeof userAnswer !== 'string') {
      res.status(400).json({ error: 'Provide question, correctAnswer, userAnswer.' });
      return;
    }

    const result = await callToolForJson<GradingResult>({
      system:
        'You grade a quiz answer for an open-ended question. Be reasonably lenient: give credit for ' +
        'answers that capture the key idea even if phrased differently. Provide brief, constructive feedback.',
      userMessage:
        `Question: ${question}\n` +
        `Reference correct answer: ${correctAnswer}\n` +
        `Explanation: ${explanation ?? ''}\n` +
        `User's answer: ${userAnswer}`,
      toolName: 'submit_grading',
      toolDescription: 'Submit the grading result for the user answer.',
      inputSchema: GRADING_SCHEMA,
      maxTokens: 1024,
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Grading failed.' });
  }
});

export default router;
