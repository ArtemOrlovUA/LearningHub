import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/server';
import Link from 'next/link';
import { Suspense } from 'react';
import FlashcardsSection from '@/app/_components/FlashcardsSection';

interface UserLimit {
  fc_limit: number;
  fc_current: number;
}

export default async function MyFlashcardsPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: userLimits, error: limitsError } = await supabase
    .from('user_limits')
    .select('fc_limit, fc_current')
    .eq('user_id', user.id)
    .single<UserLimit>();

  return (
    <div className="max-w-3xl mx-auto my-2 px-4">
      <header className="mb-8 pb-4 border-b border-gray-200 flex justify-between items-center">
        <Link
          href="/learn"
          className="text-sky-400 sm:w-auto w-[5.3rem] sm:mt-2 text-[1.2rem] hover:text-sky-600 font-medium">
          Create flashcards
        </Link>
        <h1 className="text-xl sm:text-4xl font-bold text-white m-0">My Flashcards</h1>
        {userLimits && !limitsError ? (
          <div className="text-right text-white sm:w-auto w-[5rem]">
            <p className="m-0 mb-1 text-sm ">Usage:</p>
            <p className="m-0 text-lg font-medium ">
              {userLimits.fc_current} / {userLimits.fc_limit} flashcards
            </p>
          </div>
        ) : (
          <p className="m-0 text-sm text-red-600">Could not load usage limits.</p>
        )}
      </header>

      <section>
        <Suspense
          fallback={
            <p className="text-center mt-8 text-lg text-gray-600">Loading your flashcards...</p>
          }>
          <FlashcardsSection userId={user.id} />
        </Suspense>
      </section>
    </div>
  );
}
