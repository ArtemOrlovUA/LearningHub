export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="animate-pulse">
        <h1 className="text-3xl font-semibold mb-4">Loading Profile...</h1>
        <div className="w-24 h-4 bg-gray-700 rounded mx-auto"></div>
      </div>
    </div>
  );
}
