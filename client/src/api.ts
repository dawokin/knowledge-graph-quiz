import { callToolForJson } from './anthropicClient';
import { ANALYSIS_SCHEMA, GRADING_SCHEMA, QUIZ_SCHEMA } from './schemas';
import type { AnalysisResult, AnalyzedItem, GradingResult, QuizSet, RawItem } from './types';

export function analyzeItems(items: RawItem[]): Promise<AnalysisResult> {
  const listing = items
    .map((it) => `- id: ${it.id}\n  content: ${it.raw.slice(0, 2000)}`)
    .join('\n');

  return callToolForJson<AnalysisResult>({
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
    inputSchema: ANALYSIS_SCHEMA,
    maxTokens: 8192,
  });
}

export function generateQuiz(items: AnalyzedItem[], count: number): Promise<QuizSet> {
  const listing = items
    .map((it) => `- id: ${it.id}\n  title: ${it.title}\n  category: ${it.categoryId}\n  summary: ${it.summary}`)
    .join('\n');

  return callToolForJson<QuizSet>({
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
}

export function gradeAnswer(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}): Promise<GradingResult> {
  return callToolForJson<GradingResult>({
    system:
      'You grade a quiz answer for an open-ended question. Be reasonably lenient: give credit for ' +
      'answers that capture the key idea even if phrased differently. Provide brief, constructive feedback.',
    userMessage:
      `Question: ${params.question}\n` +
      `Reference correct answer: ${params.correctAnswer}\n` +
      `Explanation: ${params.explanation}\n` +
      `User's answer: ${params.userAnswer}`,
    toolName: 'submit_grading',
    toolDescription: 'Submit the grading result for the user answer.',
    inputSchema: GRADING_SCHEMA,
    maxTokens: 1024,
  });
}
