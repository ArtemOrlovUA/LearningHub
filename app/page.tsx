'use client';

import Link from 'next/link';
import { useUser } from '@/app/utils/useUser';
import WavesBg from './_components/WavesBg';

export default function Home() {
  const { user } = useUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-full flex flex-col items-center justify-start p-6 text-center">
      <header className="mb-12 mt-24">
        <h1 className="text-5xl md:text-7xl font-bold text-white sm:mb-6 mb-[1.5rem]">
          Welcome to LearningHub
        </h1>
      </header>

      <WavesBg
        lineColor="#4f4f4f"
        backgroundColor="rgb(0, 0, 0)"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={40}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={24}
      />

      <main className="mb-12">
        <p className="text-md md:text-lg text-slate-200 max-w-xl mx-auto mb-10">
          Dive into complex topics or reinforce your understanding with interactive flashcards and
          quizzes - LearningHub is your dedicated partner in achieving academic and professional
          excellence
        </p>
      </main>

      <Link
        href={isLoggedIn ? '/learn' : '/login'}
        className="bg-white text-black font-semibold py-4 px-10 rounded-lg text-xl shadow-xl hover:bg-gray-200 hover:shadow-2xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">
        Start your learning adventure
      </Link>

      <footer className="text-slate-500 text-sm absolute bottom-0 mb-4">
        <p>Non-commercial educational project by Artem Orlov.</p>
        <p>{new Date().getFullYear()} LearningHub.</p>
      </footer>
    </div>
  );
}
