export interface RawItem {
  id: string;
  raw: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface AnalyzedItem {
  id: string;
  title: string;
  summary: string;
  categoryId: string;
  type: 'link' | 'note';
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface AnalysisResult {
  categories: Category[];
  items: AnalyzedItem[];
  edges: GraphEdge[];
}

export type QuestionType = 'multiple_choice' | 'open';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  itemIds: string[];
  explanation: string;
}

export interface QuizSet {
  questions: QuizQuestion[];
}

export interface GradingResult {
  correct: boolean;
  score: number;
  feedback: string;
}
