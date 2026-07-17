'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronRight, HelpCircle as HelpIcon, Award, RotateCcw, Check, X } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';

interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

const SAMPLE_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    question: 'How do you configure strict compile options inside types compiler settings?',
    options: [
      'Set "strict": true in compilerOptions parameters compiler config',
      'Toggle implicit declarations only',
      'Declare compile-checks manually during workspace scripts runs',
      'Enable ESModules default export parameters bindings'
    ],
    correct: 'Set "strict": true in compilerOptions parameters compiler config',
    explanation: 'Setting "strict": true in tsconfig compilerOptions acts as a master toggle that automatically enables all strict type-checking logic options.',
  },
  {
    id: 2,
    question: 'What is the purpose of Zod schema checking configurations inside backend routers?',
    options: [
      'To build databases tables structures automatically',
      'To validate incoming JSON bodies payloads maps at route limits',
      'To hash credentials passwords using system salts',
      'To authenticate user sessions using JWT keys'
    ],
    correct: 'To validate incoming JSON bodies payloads maps at route limits',
    explanation: 'Zod parses req.body objects, rejecting malformed structures with informative validation codes before execution reach controller functions.',
  },
  {
    id: 3,
    question: 'Which routing middleware order executes correctly in Express controllers loops?',
    options: [
      'Response logs -> Error handlers -> DB inserts -> Authenticator triggers',
      'Logger middlewares -> Auth validators -> Controller handlers -> Error endpoints',
      'Error wrappers -> DB query returns -> CORS setup controllers',
      'Static assets loads -> DB sync updates -> Final loggers pings'
    ],
    correct: 'Logger middlewares -> Auth validators -> Controller handlers -> Error endpoints',
    explanation: 'Requests standard pipelines evaluate telemetry loggers first, verify JWT auth claims, route parameters to handlers, and log unhandled exceptions in error middlewares.',
  }
];

export default function QuizPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answersRecords, setAnswersRecords] = useState<Record<number, string>>({});
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const question = SAMPLE_QUESTIONS[currentIdx];

  const handleSelectOption = (option: string) => {
    if (isEvaluated) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || isEvaluated) return;

    const isCorrect = selectedOption === question.correct;
    if (isCorrect) setScore((prev) => prev + 1);

    setAnswersRecords((prev) => ({ ...prev, [question.id]: selectedOption }));
    setIsEvaluated(true);
  };

  const handleNextStep = () => {
    setSelectedOption(null);
    setIsEvaluated(false);

    if (currentIdx + 1 < SAMPLE_QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswersRecords({});
    setIsEvaluated(false);
    setScore(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    const passed = score >= 2;
    return (
      <div className="max-w-xl mx-auto py-8 text-center shrink-0">
        <Card hoverable={false} className="border-card-border p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center border ${
              passed
                ? 'bg-status-success/10 border-status-success/35 text-status-success shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'bg-status-error/10 border-status-error/35 text-status-error'
            }`}>
              <Award className="h-8 w-8" />
            </div>
          </div>
          <h2 className="font-display font-bold text-2xl text-text-primary">
            Assessment Completed
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Topic: TypeScript Compiler & Express Routes
          </p>

          <div className="my-6 p-4 border border-white/5 bg-background/50 rounded-md">
            <span className="text-xs text-text-secondary select-none">Total Correct Score</span>
            <p className="text-3xl font-bold text-text-primary tracking-tight mt-1">
              {score} <span className="text-sm text-text-secondary">of {SAMPLE_QUESTIONS.length}</span>
            </p>
            <div className="mt-3">
              <Badge variant={passed ? 'success' : 'danger'}>
                {passed ? 'PASSED (Threshold: 70%)' : 'FAILED (Threshold: 70%)'}
              </Badge>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1 cursor-pointer" onClick={handleRestartQuiz}>
              <RotateCcw className="h-4 w-4" />
              Reset Quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6">
      {/* Header */}
      <div className="text-left mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-text-primary">
            Assess Knowledge Retention
          </h2>
          <span className="text-[10px] text-text-secondary font-semibold">
            Milestone 2 Assessment
          </span>
        </div>
        <Badge variant="primary">
          Question {currentIdx + 1}/{SAMPLE_QUESTIONS.length}
        </Badge>
      </div>

      <Card hoverable={false} className="border-card-border p-6 text-left">
        <CardContent className="space-y-6">
          
          {/* Question Text */}
          <div className="flex gap-3 items-start select-none">
            <div className="h-7 w-7 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary flex items-center justify-center shrink-0">
              <HelpIcon className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mt-0.5 leading-relaxed">
              {question.question}
            </h4>
          </div>

          {/* Option Selector List */}
          <div className="flex flex-col gap-3">
            {question.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrectOpt = option === question.correct;
              const wasSelected = answersRecords[question.id] === option;

              let optionStyles = 'border-white/5 bg-background/50 hover:bg-white/2 hover:border-white/10';
              if (isSelected) optionStyles = 'border-brand-primary/60 bg-brand-primary/5 text-brand-secondary';
              
              if (isEvaluated) {
                if (isCorrectOpt) {
                  optionStyles = 'border-status-success/40 bg-status-success/10 text-status-success';
                } else if (wasSelected && !isCorrectOpt) {
                  optionStyles = 'border-status-error/40 bg-status-error/10 text-status-error';
                } else {
                  optionStyles = 'border-white/2 bg-white/1 opacity-55 pointer-events-none';
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  disabled={isEvaluated}
                  className={`w-full flex items-center text-xs font-semibold p-4 rounded-md border text-left cursor-pointer transition-all ${optionStyles}`}
                >
                  <span className="flex-1 leading-normal">{option}</span>
                  {isEvaluated && isCorrectOpt && <Check className="h-4 w-4 text-status-success shrink-0" />}
                  {isEvaluated && wasSelected && !isCorrectOpt && <X className="h-4 w-4 text-status-error shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation panel */}
          {isEvaluated && (
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
          <div className="pt-2 border-t border-white/5 flex items-center justify-end">
            {!isEvaluated ? (
              <Button
                variant="primary"
                onClick={handleCheckAnswer}
                disabled={!selectedOption}
              >
                Validate Answer
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNextStep}>
                Next Question
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
