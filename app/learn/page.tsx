'use client';

import { useState } from 'react';
import { useUser } from '../utils/useUser';
import { useUserLimits } from '../utils/useLimits';
import { FlashcardGenerator } from '@/app/_components/FlashcardGenerator';
import { QuizGenerator } from '@/app/_components/QuizGenerator';

type ActiveTab = 'flashcards' | 'quiz';

export default function LearnPage() {
  const { user, loading: authLoading } = useUser();
  const {
    fc_limit,
    fc_current,
    q_limit,
    q_current,
    loading: limitsLoading,
    error: limitsError,
    refetchLimits,
  } = useUserLimits();
  const [activeTab, setActiveTab] = useState<ActiveTab>('flashcards');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-full bg-black">
        <h2 className="text-xl font-semibold text-center text-slate-100 mb-[10rem]">
          Loading user data...
        </h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-full bg-black pt-20">
        <h2 className="text-xl font-semibold text-center text-slate-100 mb-[10rem]">
          You have been logged out. Redirecting...
        </h2>
      </div>
    );
  }

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-full bg-black text-slate-100 max-w-2xl mx-auto pb-6 px-4">
      {limitsError && (
        <div className="mb-8 p-4 border border-red-700 bg-red-900 text-red-300 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-white mb-2">Limits Error</h1>
          <p>Could not load usage limits: {limitsError.message}</p>
          <p>Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="relative flex w-full mb-8 border-b border-gray-700">
        <button
          className={`flex-1 pb-3 font-medium text-center transition-colors ${
            activeTab === 'flashcards' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => handleTabChange('flashcards')}>
          Flashcards
        </button>

        <button
          className={`flex-1 pb-3 font-medium text-center transition-colors ${
            activeTab === 'quiz' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => handleTabChange('quiz')}>
          Quiz
        </button>

        <div
          className={`absolute bottom-0 h-0.5 w-1/2 bg-white transition-transform duration-300 ease-in-out ${
            activeTab === 'flashcards' ? 'translate-x-0' : 'translate-x-full'
          }`}
        />
      </div>

      {/* Content based on active tab */}
      {activeTab === 'flashcards' ? (
        <FlashcardGenerator
          user={user}
          fc_limit={fc_limit}
          fc_current={fc_current}
          limitsLoading={limitsLoading}
          limitsError={limitsError}
          refetchLimits={refetchLimits}
        />
      ) : (
        <QuizGenerator
          user={user}
          q_limit={q_limit}
          q_current={q_current}
          limitsLoading={limitsLoading}
          limitsError={limitsError}
          refetchLimits={refetchLimits}
        />
      )}
    </div>
  );
}
