export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto my-8 px-4 min-h-screen bg-black text-slate-100">
      <header className="mb-8 pb-4 border-b border-gray-700 flex justify-between items-center">
        <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-12 w-32 bg-gray-700 rounded animate-pulse"></div>
      </header>
      <section>
        <p className="text-center mt-8 text-lg text-slate-300">Loading page contents...</p>
      </section>
    </div>
  );
}
