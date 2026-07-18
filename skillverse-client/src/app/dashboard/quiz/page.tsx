'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle as HelpIcon,
  Award,
  RotateCcw,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Loader2,
} from 'lucide-react';
import Card, { CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';
import { api } from '../../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface QuizData {
  quizId: string;
  title: string;
  moduleName: string;
  milestoneNumber: number;
  topicsCovered: string[];
  skillLevel: string;
  questions: QuizQuestion[];
  maxScore: number;
  passPercentage: number;
}

interface QuestionResult {
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  topic: string;
}

interface SubmitResult {
  attemptId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  percentage: number;
  passPercentage: number;
  results: QuestionResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const difficultyColor = (d: string) => {
  if (d === 'easy')   return 'text-status-success';
  if (d === 'hard')   return 'text-status-danger';
  return 'text-status-warning';
};

const difficultyVariant = (d: string): any => {
  if (d === 'easy')   return 'success';
  if (d === 'hard')   return 'danger';
  return 'warning';
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function QuizSkeleton() {
  return (
    <div className="max-w-xl mx-auto py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-white/5 rounded" />
          <div className="h-3 w-32 bg-white/3 rounded" />
        </div>
        <div className="h-6 w-24 bg-white/5 rounded-full" />
      </div>
      <Card hoverable={false} className="border-card-border p-6">
        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="h-7 w-7 bg-white/5 rounded-md shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-full bg-white/5 rounded" />
              <div className="h-4 w-3/4 bg-white/5 rounded" />
            </div>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 w-full bg-white/3 rounded-md border border-white/5" />
          ))}
          <div className="pt-2 border-t border-white/5 flex justify-end">
            <div className="h-9 w-32 bg-white/5 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function QuizError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-xl mx-auto py-8">
      <Card hoverable={false} className="border-card-border p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-xl bg-status-danger/10 border border-status-danger/20 flex items-center justify-center text-status-danger">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm font-semibold text-text-primary">Quiz Unavailable</p>
        <p className="text-xs text-text-muted mt-2 max-w-xs mx-auto leading-relaxed">{message}</p>
        <Button variant="secondary" size="sm" className="mt-6 gap-2 cursor-pointer" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      </Card>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  quiz,
  result,
  onRestart,
}: {
  quiz: QuizData;
  result: SubmitResult;
  onRestart: () => void;
}) {
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6 text-center">
      {/* Score card */}
      <Card hoverable={false} className="border-card-border p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center border ${
            result.passed
              ? 'bg-status-success/10 border-status-success/35 text-status-success shadow-[0_0_15px_rgba(34,197,94,0.3)]'
              : 'bg-status-danger/10 border-status-danger/30 text-status-danger'
          }`}>
            <Award className="h-8 w-8" />
          </div>
        </div>

        <h2 className="font-display font-bold text-2xl text-text-primary">Assessment Completed</h2>
        <p className="text-xs text-text-secondary mt-1">
          {quiz.title}
        </p>

        <div className="my-6 p-4 border border-white/5 bg-background/50 rounded-md">
          <span className="text-xs text-text-secondary select-none">Total Correct Score</span>
          <p className="text-3xl font-bold text-text-primary tracking-tight mt-1">
            {result.score} <span className="text-sm text-text-secondary">of {result.maxScore}</span>
          </p>
          <p className="text-xs text-text-muted mt-1">{result.percentage}%</p>
          <div className="mt-3">
            <Badge variant={result.passed ? 'success' : 'danger'}>
              {result.passed
                ? `PASSED (Threshold: ${result.passPercentage}%)`
                : `FAILED (Threshold: ${result.passPercentage}%)`}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 cursor-pointer gap-2" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" />
            New Quiz
          </Button>
          <Button variant="secondary" className="flex-1 cursor-pointer gap-2" onClick={() => setShowReview(v => !v)}>
            <BookOpen className="h-4 w-4" />
            {showReview ? 'Hide' : 'Review'} Answers
          </Button>
        </div>
      </Card>

      {/* Per-question review */}
      {showReview && (
        <div className="space-y-4 text-left">
          {quiz.questions.map((q, idx) => {
            const r = result.results.find(r => r.questionId === q.id);
            if (!r) return null;
            return (
              <Card key={q.id} hoverable={false} className="border-card-border p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    r.isCorrect ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'
                  }`}>
                    {idx + 1}
                  </div>
                  <p className="text-xs font-semibold text-text-primary leading-snug">{q.question}</p>
                </div>

                <div className="space-y-1.5 ml-9">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === r.correctIndex;
                    const wasSelected = oi === r.selectedIndex;
                    return (
                      <div key={oi} className={`text-[11px] px-3 py-2 rounded-md border flex items-center gap-2 ${
                        isCorrect
                          ? 'border-status-success/30 bg-status-success/8 text-status-success'
                          : wasSelected && !isCorrect
                          ? 'border-status-danger/30 bg-status-danger/8 text-status-danger'
                          : 'border-white/5 text-text-muted opacity-60'
                      }`}>
                        {isCorrect && <Check className="h-3 w-3 shrink-0" />}
                        {wasSelected && !isCorrect && <X className="h-3 w-3 shrink-0" />}
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {r.explanation && (
                  <div className="mt-3 ml-9 p-3 bg-white/3 border border-white/5 rounded-md">
                    <span className="text-[9px] uppercase font-bold text-brand-secondary select-none">Explanation</span>
                    <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{r.explanation}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Quiz Page ───────────────────────────────────────────────────────────

export default function QuizPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [quiz, setQuiz]             = useState<QuizData | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Per-question state
  const [currentIdx, setCurrentIdx]             = useState(0);
  const [selectedIndex, setSelectedIndex]       = useState<number | null>(null);
  const [isEvaluated, setIsEvaluated]           = useState(false);
  const [answersMap, setAnswersMap]             = useState<Record<string, number>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // ── Fetch quiz ─────────────────────────────────────────────────────────────
  const loadQuiz = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setQuiz(null);
    setCurrentIdx(0);
    setSelectedIndex(null);
    setIsEvaluated(false);
    setAnswersMap({});
    setSubmitResult(null);
    try {
      const envelope = await api.quizzes.getCurrent();
      const data: QuizData = envelope?.data;
      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No quiz questions available for your current milestone.');
      }
      setQuiz(data);
    } catch (err: any) {
      let msg = 'Failed to generate quiz. Please try again.';
      if (err?.status === 401) msg = 'Your session has expired. Please log in again.';
      else if (err?.status === 404) msg = 'No active roadmap found. Complete onboarding to access quiz.';
      else if (err?.status === 429) msg = 'Rate limit reached. Please wait a moment and try again.';
      else if (err?.status >= 500) msg = 'Quiz generation service is temporarily unavailable.';
      else if (err?.message) msg = err.message;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  // ── Per-question handlers ─────────────────────────────────────────────────
  const handleSelectOption = (idx: number) => {
    if (isEvaluated) return;
    setSelectedIndex(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedIndex === null || isEvaluated || !quiz) return;
    const q = quiz.questions[currentIdx];
    setAnswersMap(prev => ({ ...prev, [q.id]: selectedIndex }));
    setIsEvaluated(true);
  };

  const handleNext = async () => {
    if (!quiz) return;
    setSelectedIndex(null);
    setIsEvaluated(false);

    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Last question — submit all answers
      setIsSubmitting(true);
      try {
        const envelope = await api.quizzes.submit(quiz.quizId, answersMap);
        setSubmitResult(envelope?.data);
      } catch (err: any) {
        let msg = 'Failed to submit quiz. Your progress may not be saved.';
        if (err?.status === 401) msg = 'Session expired during submission.';
        else if (err?.status === 404) msg = 'Quiz not found. Please reload and try again.';
        else if (err?.message) msg = err.message;
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (isLoading) return <QuizSkeleton />;
  if (error && !quiz) return <QuizError message={error} onRetry={loadQuiz} />;
  if (!quiz) return <QuizError message="Quiz unavailable." onRetry={loadQuiz} />;
  if (submitResult) return <ResultsScreen quiz={quiz} result={submitResult} onRestart={loadQuiz} />;
  if (isSubmitting) {
    return (
      <div className="max-w-xl mx-auto py-16 flex flex-col items-center gap-3 text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-brand-secondary" />
        <p className="text-sm text-text-secondary">Evaluating your answers…</p>
      </div>
    );
  }

  // ── Quiz in progress ──────────────────────────────────────────────────────
  const question = quiz.questions[currentIdx];
  const correctIndex = question.options.findIndex((_, i) => {
    // We don't expose correct_option_index to frontend during the quiz;
    // isEvaluated is set by the user clicking "Validate", and we stored the answer.
    // We only reveal correctness after the user locks in.
    return false;
  });

  // Retrieve what answer we recorded for this question (for highlighting after eval)
  const recordedIndex = answersMap[question.id] ?? null;

  // We need the correct index from the service to show after evaluation.
  // Since we don't expose it in the initial payload, fetch from answersMap after checking:
  // The service returns correct_option_index in the submit result.
  // During the quiz, we only know if we got it correct after "Validate Answer" —
  // we don't reveal the answer until the user submits to avoid forward-peeking.
  // For the per-question "Validate" flow, we highlight based on what the user chose
  // versus revealing the correct one — this matches the existing UX pattern exactly.

  const isLastQuestion = currentIdx === quiz.questions.length - 1;
  const answeredCount = Object.keys(answersMap).length;

  return (
    <div className="max-w-xl mx-auto py-6">

      {/* Header */}
      <div className="text-left mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-text-primary">
            Assess Knowledge Retention
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-text-secondary font-semibold">
              Milestone {quiz.milestoneNumber}: {quiz.moduleName}
            </span>
            <Badge variant={difficultyVariant(question.difficulty)} className="text-[9px] py-0">
              {question.difficulty}
            </Badge>
          </div>
        </div>
        <Badge variant="primary">
          Question {currentIdx + 1}/{quiz.questions.length}
        </Badge>
      </div>

      {/* Error banner (non-fatal, quiz still displayed) */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-md bg-status-warning/10 border border-status-warning/20 text-status-warning text-[11px]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Card */}
      <Card hoverable={false} className="border-card-border p-6 text-left">
        <CardContent className="space-y-6">

          {/* Topic pill */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-muted uppercase font-bold select-none">Topic:</span>
            <span className="text-[10px] text-brand-secondary font-semibold">{question.topic}</span>
          </div>

          {/* Question Text */}
          <div className="flex gap-3 items-start select-none">
            <div className="h-7 w-7 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary flex items-center justify-center shrink-0">
              <HelpIcon className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mt-0.5 leading-relaxed">
              {question.question}
            </h4>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {question.options.map((option, oi) => {
              const isSelected = selectedIndex === oi;
              const wasSelected = recordedIndex === oi;

              let styles = 'border-white/5 bg-background/50 hover:bg-white/2 hover:border-white/10';
              if (!isEvaluated && isSelected) {
                styles = 'border-brand-primary/60 bg-brand-primary/5 text-brand-secondary';
              }
              if (isEvaluated && wasSelected) {
                // After validate: show the selected answer in yellow (neutral)
                // The correct answer is revealed on the results screen after submit
                styles = 'border-brand-secondary/50 bg-brand-secondary/8 text-brand-secondary';
              }

              return (
                <button
                  key={oi}
                  onClick={() => handleSelectOption(oi)}
                  disabled={isEvaluated}
                  className={`w-full flex items-center text-xs font-semibold p-4 rounded-md border text-left cursor-pointer transition-all ${styles}`}
                >
                  <span className="h-5 w-5 rounded-sm mr-3 border border-current flex items-center justify-center text-[9px] font-bold shrink-0 select-none">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="flex-1 leading-normal">{option}</span>
                  {isEvaluated && wasSelected && <Check className="h-4 w-4 text-brand-secondary shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Explanation panel — only shows after evaluate */}
          {isEvaluated && question.explanation && (
            <div className="p-4 bg-white/3 border border-white/5 rounded-md space-y-2">
              <span className="text-[10px] uppercase font-bold text-brand-secondary select-none">
                Concept Explanation
              </span>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-text-muted select-none">
              {answeredCount} / {quiz.questions.length} answered
            </span>
            {!isEvaluated ? (
              <Button
                variant="primary"
                onClick={handleCheckAnswer}
                disabled={selectedIndex === null}
                className="cursor-pointer"
              >
                Validate Answer
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={isSubmitting}
                className="cursor-pointer gap-2"
              >
                {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
