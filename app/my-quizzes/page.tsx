import { getUniqueQuizNames } from '@/app/actions/quizActions';
import { cookies } from 'next/headers';
import { createClient } from '@/app/utils/server';
import { redirect } from 'next/navigation';
import { QuizList } from '../_components/QuizList';

export const metadata = {
  title: 'My Quizzes',
  description: 'View your quizzes',
};

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
        {!result.success ? (
          <p className="text-center mt-8 text-lg text-red-400">
            {result.message || 'Could not load quizzes.'}
          </p>
        ) : (
          <QuizList initialQuizzes={quizzes} />
        )}
      </section>
    </div>
  );
}

export default MyQuizzesPage;
