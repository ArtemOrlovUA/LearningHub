import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <header className="mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Welcome to LearningHub</h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
          Elevate your knowledge and master new skills with LearningHub. We provide intuitive tools
          and curated content to accelerate your learning journey, making education engaging and
          effective.
        </p>
      </header>

      <main className="mb-12">
        <p className="text-md md:text-lg text-slate-400 max-w-xl mx-auto mb-10">
          Whether you&apos;re diving into complex topics or reinforcing your understanding with
          interactive flashcards, LearningHub is your dedicated partner in achieving academic and
          professional excellence.
        </p>
      </main>

      <Link
        href="/login"
        className="bg-white text-black font-semibold py-4 px-10 rounded-lg text-xl shadow-xl hover:bg-gray-200 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">
        Start Your Learning Adventure
      </Link>

      <footer className="absolute bottom-8 text-slate-500 text-sm">
        <p>
          {new Date().getFullYear()} LearningHub. Non-commercial educational project by Artem Orlov.
        </p>
      </footer>
    </div>
  );
}
