import type { AnalysisResult, QuizSet } from '../types';

export const FALLBACK_CATEGORY_ID = '_uncategorized';
export const FALLBACK_CATEGORY_NAME = 'Без категории';

/**
 * Repairs model output that doesn't quite hold together: items pointing at a
 * categoryId that isn't in the categories list get bucketed into a synthetic
 * "Без категории" category (instead of silently vanishing from the legend),
 * duplicate item ids are dropped, and edges referencing a missing/duplicate
 * item id (or a self-loop) are removed so the graph never tries to draw an
 * edge to a node that doesn't exist.
 */
export function normalizeAnalysis(result: AnalysisResult): AnalysisResult {
  const categories = result.categories.filter((c) => c.id && c.name);
  const categoryIds = new Set(categories.map((c) => c.id));

  const seenItemIds = new Set<string>();
  const items: AnalysisResult['items'] = [];
  let usedFallbackCategory = false;

  for (const item of result.items) {
    if (!item.id || seenItemIds.has(item.id)) continue;
    seenItemIds.add(item.id);
    if (categoryIds.has(item.categoryId)) {
      items.push(item);
    } else {
      usedFallbackCategory = true;
      items.push({ ...item, categoryId: FALLBACK_CATEGORY_ID });
    }
  }

  const finalCategories = usedFallbackCategory
    ? [...categories, { id: FALLBACK_CATEGORY_ID, name: FALLBACK_CATEGORY_NAME }]
    : categories;

  const itemIds = new Set(items.map((it) => it.id));
  const edges = result.edges.filter(
    (e) => e.source !== e.target && itemIds.has(e.source) && itemIds.has(e.target)
  );

  return { categories: finalCategories, items, edges };
}

/** Strips a leading option marker ("B)", "(2)", "3.", "A:") before comparing answer text. */
export function normalizeAnswerText(raw: string): string {
  return raw
    .trim()
    .replace(/^[([]?[a-dA-D1-4][)\].:]\s*/, '')
    .trim()
    .toLowerCase();
}

export function matchesAnswer(candidate: string, correctAnswer: string): boolean {
  return normalizeAnswerText(candidate) === normalizeAnswerText(correctAnswer);
}

/**
 * Drops multiple_choice questions that don't hold together (fewer than 2
 * options, or a correctAnswer that matches none of them even once option
 * markers are stripped) - better to serve a shorter quiz than a question
 * that can never be answered correctly.
 */
export function sanitizeQuiz(quiz: QuizSet): QuizSet {
  const questions = quiz.questions.filter((q) => {
    if (q.type !== 'multiple_choice') return true;
    if (!q.options || q.options.length < 2) return false;
    return q.options.some((opt) => matchesAnswer(opt, q.correctAnswer));
  });
  return { questions };
}

export function isValidBaseUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === '') return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
