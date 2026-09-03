import { describe, expect, it } from 'vitest';
import { isValidBaseUrl, matchesAnswer, normalizeAnalysis, sanitizeQuiz } from './normalize';
import type { AnalysisResult, QuizSet } from '../types';

describe('normalizeAnalysis', () => {
  const base: AnalysisResult = {
    categories: [{ id: 'a', name: 'Alpha' }],
    items: [
      { id: 'i1', title: 'One', summary: 's', categoryId: 'a', type: 'note' },
      { id: 'i2', title: 'Two', summary: 's', categoryId: 'a', type: 'note' },
    ],
    edges: [{ source: 'i1', target: 'i2', label: 'related' }],
  };

  it('passes through a well-formed result unchanged', () => {
    const result = normalizeAnalysis(base);
    expect(result.items).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.categories).toHaveLength(1);
  });

  it('drops edges that reference a missing item id', () => {
    const result = normalizeAnalysis({
      ...base,
      edges: [
        { source: 'i1', target: 'i2', label: 'related' },
        { source: 'i1', target: 'does-not-exist', label: 'ghost' },
      ],
    });
    expect(result.edges).toEqual([{ source: 'i1', target: 'i2', label: 'related' }]);
  });

  it('drops self-loop edges', () => {
    const result = normalizeAnalysis({
      ...base,
      edges: [{ source: 'i1', target: 'i1', label: 'self' }],
    });
    expect(result.edges).toHaveLength(0);
  });

  it('buckets an item with an unknown categoryId into a fallback category', () => {
    const result = normalizeAnalysis({
      ...base,
      items: [{ id: 'i1', title: 'One', summary: 's', categoryId: 'ghost-category', type: 'note' }],
      edges: [],
    });
    expect(result.items[0].categoryId).toBe('_uncategorized');
    expect(result.categories.some((c) => c.id === '_uncategorized')).toBe(true);
  });

  it('drops duplicate item ids, keeping only the first', () => {
    const result = normalizeAnalysis({
      ...base,
      items: [
        { id: 'i1', title: 'First', summary: 's', categoryId: 'a', type: 'note' },
        { id: 'i1', title: 'Duplicate', summary: 's', categoryId: 'a', type: 'note' },
      ],
      edges: [],
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('First');
  });
});

describe('matchesAnswer', () => {
  it('matches identical strings', () => {
    expect(matchesAnswer('Kubernetes', 'Kubernetes')).toBe(true);
  });

  it('ignores an option-letter prefix on either side', () => {
    expect(matchesAnswer('B) Kubernetes', 'Kubernetes')).toBe(true);
    expect(matchesAnswer('Kubernetes', '2. Kubernetes')).toBe(true);
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(matchesAnswer('  kubernetes  ', 'Kubernetes')).toBe(true);
  });

  it('rejects an actually different answer', () => {
    expect(matchesAnswer('React', 'Kubernetes')).toBe(false);
  });
});

describe('sanitizeQuiz', () => {
  it('keeps every open question regardless of shape', () => {
    const quiz: QuizSet = {
      questions: [
        { id: 'q1', type: 'open', question: '?', correctAnswer: 'x', itemIds: [], explanation: '' },
      ],
    };
    expect(sanitizeQuiz(quiz).questions).toHaveLength(1);
  });

  it('drops a multiple_choice question whose correctAnswer matches no option', () => {
    const quiz: QuizSet = {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: '?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'Not in the list',
          itemIds: [],
          explanation: '',
        },
      ],
    };
    expect(sanitizeQuiz(quiz).questions).toHaveLength(0);
  });

  it('keeps a multiple_choice question whose correctAnswer matches an option with a prefix', () => {
    const quiz: QuizSet = {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: '?',
          options: ['A) React', 'B) Kubernetes'],
          correctAnswer: 'Kubernetes',
          itemIds: [],
          explanation: '',
        },
      ],
    };
    expect(sanitizeQuiz(quiz).questions).toHaveLength(1);
  });
});

describe('isValidBaseUrl', () => {
  it('accepts an empty string (means "use default")', () => {
    expect(isValidBaseUrl('')).toBe(true);
    expect(isValidBaseUrl('   ')).toBe(true);
  });

  it('accepts http/https URLs', () => {
    expect(isValidBaseUrl('https://api.deepseek.com')).toBe(true);
    expect(isValidBaseUrl('http://localhost:8080')).toBe(true);
  });

  it('rejects garbage and non-http(s) schemes', () => {
    expect(isValidBaseUrl('not a url')).toBe(false);
    expect(isValidBaseUrl('javascript:alert(1)')).toBe(false);
    expect(isValidBaseUrl('ftp://example.com')).toBe(false);
  });
});
