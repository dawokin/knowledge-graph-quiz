import type { AnalysisResult, AnalyzedItem, GradingResult, QuizSet, RawItem } from './types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? `Request to ${url} failed with status ${res.status}`);
  }
  return data as T;
}

export function analyzeItems(items: RawItem[]): Promise<AnalysisResult> {
  return postJson('/api/analyze', { items });
}

export function generateQuiz(items: AnalyzedItem[], count: number): Promise<QuizSet> {
  return postJson('/api/quiz/generate', { items, count });
}

export function gradeAnswer(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}): Promise<GradingResult> {
  return postJson('/api/quiz/grade', params);
}
