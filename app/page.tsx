import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <header className="mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white sm:mb-6 mb-[1.5rem]">
          Welcome to LearningHub
        </h1>
      </header>

      <main className="mb-12">
        <p className="text-md md:text-lg text-slate-200 max-w-xl mx-auto mb-10">
          Whether you&apos;re diving into complex topics or reinforcing your understanding with
          interactive flashcards, LearningHub is your dedicated partner in achieving academic and
          professional excellence.
        </p>
      </main>

      <Link
        href="/login"
        className="bg-white  text-black font-semibold py-4 px-10 rounded-lg text-xl shadow-xl hover:bg-gray-200 hover:shadow-2xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">
        Start Your Learning Adventure
      </Link>

      <footer className="text-slate-500 text-sm absolute bottom-0 mb-4">
        <p>Non-commercial educational project by Artem Orlov.</p>
        <p>{new Date().getFullYear()} LearningHub.</p>
      </footer>
    </div>
  );
}
