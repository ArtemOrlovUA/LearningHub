export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto my-8 px-4 min-h-screen bg-black text-slate-100">
      <header className="mb-8 pb-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h1 className="text-sky-400 text-[1.2rem] hover:text-sky-600 font-medium">
            Create flashcards
          </h1>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white m-0">My Flashcards</h1>
        </div>
        <div className="h-12 w-32 bg-gray-700 rounded animate-pulse"></div>
      </header>
      <section>
        <p className="text-center mt-8 text-lg text-slate-300">Loading page contents...</p>
      </section>
    </div>
  );
}
