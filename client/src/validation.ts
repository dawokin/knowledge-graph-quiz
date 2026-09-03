import { z } from 'zod';

const CategoryZ = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

const AnalyzedItemZ = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(['link', 'note']),
});

const GraphEdgeZ = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().min(1),
});

export const AnalysisResultZ = z.object({
  categories: z.array(CategoryZ).min(1),
  items: z.array(AnalyzedItemZ),
  edges: z.array(GraphEdgeZ),
});

const QuizQuestionZ = z.object({
  id: z.string().min(1),
  type: z.enum(['multiple_choice', 'open']),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  itemIds: z.array(z.string()),
  explanation: z.string(),
});

export const QuizSetZ = z.object({
  questions: z.array(QuizQuestionZ),
});

export const GradingResultZ = z.object({
  correct: z.boolean(),
  score: z.number().min(0).max(1),
  feedback: z.string(),
});

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join('.') || '(root)';
    throw new Error(
      `Модель вернула ответ не по ожидаемой схеме (${label}, поле "${path}": ${issue?.message ?? 'unknown'}). ` +
        'Попробуй ещё раз - иногда помогает переформулировать входные данные.'
    );
  }
  return result.data;
}
