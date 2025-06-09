export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto my-3 px-4 min-h-full bg-black text-slate-100">
      <header className="mb-8 pb-4 border-b border-gray-200 flex justify-center items-center">
        <h1 className="text-xl sm:text-4xl font-bold text-white m-0">My Flashcards</h1>
      </header>
      <section>
        <p className="text-center mt-8 text-lg text-slate-300">Loading flashcards...</p>
      </section>
    </div>
  );
}
