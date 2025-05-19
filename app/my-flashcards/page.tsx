import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/server';
import FlashList from '@/app/_components/FlashList';
import Link from 'next/link';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  pack_id?: string;
}

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

  const { data, error: flashcardsError } = await supabase
    .from('flashcards')
    .select('id, question, answer, created_at, pack_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const flashcards: Flashcard[] | null = data;

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <header className="mb-8 pb-4 border-b border-gray-200 flex justify-between items-center">
        <Link href="/learn" className="text-blue-600 hover:text-blue-700 font-medium">
          Create flashcards
        </Link>
        <h1 className="text-4xl font-bold text-gray-800 m-0">My Flashcards</h1>
        {userLimits && !limitsError ? (
          <div className="text-right">
            <p className="m-0 mb-1 text-sm text-gray-600">Usage:</p>
            <p className="m-0 text-lg font-medium text-gray-800">
              {userLimits.fc_current} / {userLimits.fc_limit} flashcards
            </p>
          </div>
        ) : (
          <p className="m-0 text-sm text-red-600">Could not load usage limits.</p>
        )}
      </header>

      <section>
        {flashcardsError ? (
          <p className="text-red-600 text-center mt-8">
            Error loading your flashcards. Please try refreshing the page.
          </p>
        ) : flashcards && flashcards.length > 0 ? (
          <FlashList flashcards={flashcards} />
        ) : (
          <p className="text-center mt-8 text-lg text-gray-600">
            You haven&apos;t created any flashcards yet. <br />
            Go to the{' '}
            <Link href="/learn" className="text-blue-600 hover:text-blue-700 font-medium">
              Learn page
            </Link>{' '}
            to generate some!
          </p>
        )}
      </section>
    </div>
  );
}
