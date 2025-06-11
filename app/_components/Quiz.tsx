'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/utils/store';
import { startQuiz, answerQuestion, resetQuiz } from '@/app/utils/quizSlice';
import Link from 'next/link';

interface QuizQuestion {
  question: string;
  answer: string;
  quiz_name: string;
}

interface QuizProps {
  questions: QuizQuestion[];
}

export default function Quiz({ questions }: QuizProps) {
  const dispatch = useAppDispatch();
  const {
    currentQuestionIndex,
    score,
    isQuizOver,
    questions: quizQuestions,
  } = useAppSelector((state) => state.quiz);

  const correctPercentage = Math.round((score / quizQuestions.length) * 100);

  useEffect(() => {
    dispatch(startQuiz(questions));
    return () => {
      dispatch(resetQuiz());
    };
  }, [dispatch, questions]);

  const handleAnswerClick = (answer: string) => {
    dispatch(answerQuestion({ answer }));
  };

  const currentQuestionData = useMemo(() => {
    if (!quizQuestions[currentQuestionIndex]) {
      return null;
    }
    const parts = quizQuestions[currentQuestionIndex].question.split('|||||');
    if (parts.length < 5) {
      return { questionText: 'Invalid question format', options: [] };
    }
    return {
      questionText: parts[0],
      options: parts.slice(1, 5),
    };
  }, [quizQuestions, currentQuestionIndex]);

  if (isQuizOver) {
    return (
      <div className="text-center bg-gray-900 border border-gray-700 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Quiz Completed!</h2>
        <p className="text-xl mb-[2.5rem]">
          Your final score is: <span className="text-emerald-400 font-bold">{score}</span> out of{' '}
          <span className="text-emerald-400 font-bold">{quizQuestions.length}</span> (
          {correctPercentage}%)
        </p>
        <Link
          href="/my-quizzes"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out">
          Back to My Quizzes
        </Link>
      </div>
    );
  }

  if (!currentQuestionData) {
    return (
      <div className="text-center text-lg">
        Loading quiz... If this takes too long, please try refreshing the page.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-400">
          Question {currentQuestionIndex + 1} / {quizQuestions.length}
        </p>
        <div className="text-lg font-semibold">Score: {score}</div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">{currentQuestionData.questionText}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestionData.options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswerClick(option)}
            className="w-full p-4 text-left text-lg bg-gray-800 text-slate-100 rounded-lg shadow-inner border border-gray-600 hover:bg-sky-700 hover:border-sky-500 transition-colors duration-200 ease-in-out">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
