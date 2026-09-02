import { useEffect, useState } from 'react';
import { gradeAnswer, generateQuiz } from '../api';
import type { AnalyzedItem, QuizQuestion } from '../types';

interface Props {
  items: AnalyzedItem[];
  onExit: () => void;
}

interface AnsweredState {
  score: number;
  feedback: string;
}

type Phase = 'loading' | 'active' | 'finished' | 'error';

export default function QuizMode({ items, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, AnsweredState>>({});
  const [openAnswer, setOpenAnswer] = useState('');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    generateQuiz(items, 8)
      .then((quiz) => {
        if (cancelled) return;
        setQuestions(quiz.questions);
        setPhase('active');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Не удалось сгенерировать квиз.');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [items]);

  const current = questions[index];
  const currentResult = current ? results[current.id] : undefined;

  const answerMultipleChoice = (option: string) => {
    if (!current || currentResult) return;
    const correct = option === current.correctAnswer;
    setResults((prev) => ({
      ...prev,
      [current.id]: { score: correct ? 1 : 0, feedback: current.explanation },
    }));
  };

  const submitOpenAnswer = async () => {
    if (!current || currentResult || openAnswer.trim().length === 0) return;
    setGrading(true);
    try {
      const grading = await gradeAnswer({
        question: current.question,
        correctAnswer: current.correctAnswer,
        userAnswer: openAnswer,
        explanation: current.explanation,
      });
      setResults((prev) => ({
        ...prev,
        [current.id]: { score: grading.score, feedback: grading.feedback },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [current.id]: {
          score: 0,
          feedback: err instanceof Error ? err.message : 'Не удалось проверить ответ.',
        },
      }));
    } finally {
      setGrading(false);
    }
  };

  const next = () => {
    setOpenAnswer('');
    if (index + 1 >= questions.length) {
      setPhase('finished');
    } else {
      setIndex(index + 1);
    }
  };

  if (phase === 'loading') {
    return (
      <div className="panel quiz-panel">
        <p>Генерирую вопросы по твоему материалу…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="panel quiz-panel">
        <div className="error-box">{error}</div>
        <button className="secondary" onClick={onExit}>
          ← назад к графу
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    const total = questions.length;
    const scoreSum = questions.reduce((sum, q) => sum + (results[q.id]?.score ?? 0), 0);
    return (
      <div className="panel quiz-panel">
        <h2>Результат: {scoreSum.toFixed(1)} / {total}</h2>
        <ul className="quiz-summary">
          {questions.map((q, i) => {
            const r = results[q.id];
            const good = (r?.score ?? 0) >= 0.6;
            return (
              <li key={q.id} className={good ? 'ok' : 'bad'}>
                <span className="q-index">{i + 1}.</span> {q.question}
                <span className="q-score">{(r?.score ?? 0).toFixed(1)}</span>
              </li>
            );
          })}
        </ul>
        <div className="actions">
          <button className="secondary" onClick={onExit}>
            ← назад к графу
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="panel quiz-panel">
      <div className="quiz-progress">
        Вопрос {index + 1} из {questions.length}
      </div>
      <h2>{current.question}</h2>

      {current.type === 'multiple_choice' && current.options ? (
        <div className="options">
          {current.options.map((opt) => {
            let cls = 'option';
            if (currentResult) {
              if (opt === current.correctAnswer) cls += ' correct';
              else if (currentResult.score === 0 && opt === openAnswer) cls += ' incorrect';
            }
            return (
              <button
                key={opt}
                className={cls}
                disabled={Boolean(currentResult)}
                onClick={() => {
                  setOpenAnswer(opt);
                  answerMultipleChoice(opt);
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="open-answer">
          <textarea
            rows={4}
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value)}
            placeholder="Твой ответ…"
            disabled={Boolean(currentResult) || grading}
          />
          {!currentResult && (
            <button className="primary" onClick={submitOpenAnswer} disabled={grading}>
              {grading ? 'Проверяю…' : 'Ответить'}
            </button>
          )}
        </div>
      )}

      {currentResult && (
        <div className={`feedback ${currentResult.score >= 0.6 ? 'ok' : 'bad'}`}>
          <strong>{currentResult.score >= 0.6 ? 'Верно!' : 'Неточно.'}</strong>{' '}
          {currentResult.feedback}
        </div>
      )}

      <div className="actions">
        <button className="secondary" onClick={onExit}>
          Прервать
        </button>
        {currentResult && (
          <button className="primary" onClick={next}>
            {index + 1 >= questions.length ? 'Итоги' : 'Дальше →'}
          </button>
        )}
      </div>
    </div>
  );
}
