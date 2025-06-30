import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/server';

import QuizzesSection from '@/app/_components/QuizzesSection';

export const metadata = {
  title: 'My Quizzes',
  description: 'View your quizzes',
};

export default async function MyQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = Number(params?.page) > 0 ? Number(params.page) : 1;

  return (
    <div className="max-w-3xl mx-auto my-2 px-4">
      <header className="mb-8 pb-4 border-b border-gray-200 flex justify-center items-center">
        <h1 className="text-xl sm:text-4xl font-bold text-white m-0">My Quizzes</h1>
      </header>

      <section>
        <QuizzesSection page={page} />
      </section>
    </div>
  );
}
