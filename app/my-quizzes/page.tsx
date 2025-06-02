import { getUniqueQuizNames } from '@/app/actions/quizActions';
import { cookies } from 'next/headers';
import { createClient } from '@/app/utils/server';
import { redirect } from 'next/navigation';

interface QuizNameAndPackId {
  quiz_name: string;
  pack_id: string;
}

async function MyQuizzesPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const result = await getUniqueQuizNames();

  let quizzes: QuizNameAndPackId[] = [];
  if (result.success && result.data) {
    quizzes = result.data as QuizNameAndPackId[];
  }

  return (
    <div className="max-w-3xl mx-auto my-2 px-4">
      <header className="mb-8 pb-4 border-b border-gray-200 flex justify-center items-center">
        <h1 className="text-xl sm:text-4xl font-bold text-white m-0">My Quizzes</h1>
      </header>

      <section>
        {quizzes.length === 0 && !result.success && (
          <p className="text-center mt-8 text-lg text-red-400">
            {result.message || 'Could not load quizzes.'}
          </p>
        )}

        {quizzes.length === 0 && result.success && (
          <p className="text-center mt-8 text-lg text-slate-300">
            You haven&apos;t created any quizzes yet.
          </p>
        )}

        {quizzes.length > 0 && (
          <ul className="space-y-4">
            {quizzes.map(({ quiz_name, pack_id }) => (
              <li
                key={pack_id}
                className="bg-gray-900 p-5 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between items-center">
                <h2
                  className="text-xl sm:w-full w-[85vw] font-medium mb-4 sm:mb-0 sm:mr-4 text-white"
                  title={quiz_name}>
                  {quiz_name}
                </h2>
                <div className="flex space-x-3">
                  <button className="py-2 px-4 text-sm text-emerald-400 bg-transparent border border-emerald-400 rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-emerald-400 hover:text-black">
                    Start
                  </button>
                  <button className="py-2 px-4 text-sm cursor-pointer text-sky-400 border-sky-400 hover:bg-sky-400 hover:text-black border rounded-md transition-colors duration-150 ease-in-out">
                    Edit
                  </button>
                  <button className="py-2 px-4 text-sm cursor-pointer text-red-500 border-red-500 hover:bg-red-500 hover:text-black border rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default MyQuizzesPage;
