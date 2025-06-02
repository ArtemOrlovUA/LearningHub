import { createClient } from '@/app/utils/server';
import { cookies } from 'next/headers';
import FlashList from '@/app/_components/FlashList';
import Link from 'next/link';

interface FlashcardsSectionProps {
  userId: string;
  page: number;
}

const PAGE_SIZE = 10;

export default async function FlashcardsSection({ userId, page }: FlashcardsSectionProps) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const {
    data: flashcards,
    error: flashcardsError,
    count,
  } = await supabase
    .from('flashcards')
    .select('id, question, answer, created_at, pack_id', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  if (flashcardsError) {
    return (
      <p className="text-red-600 text-center mt-8">
        Error loading your flashcards. Please try refreshing the page.
      </p>
    );
  }

  if (flashcards && flashcards.length > 0) {
    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;
    return (
      <div>
        <FlashList flashcards={flashcards} />
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 my-8">
            <Link
              href={`?page=${page - 1}`}
              className={`px-4 py-2 w-[7rem] text-center rounded border border-gray-600 text-slate-300 hover:bg-gray-800 transition-colors duration-200 ${
                page <= 1 ? 'opacity-50 pointer-events-none' : ''
              }`}
              aria-disabled={page <= 1}>
              Previous
            </Link>
            <span className="px-4 py-2 text-slate-400">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`?page=${page + 1}`}
              className={`px-4 py-2 w-[7rem] text-center rounded border border-gray-600 text-slate-300 hover:bg-gray-800 transition-colors duration-200 ${
                page >= totalPages ? 'opacity-50 pointer-events-none' : ''
              }`}
              aria-disabled={page >= totalPages}>
              Next
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <p className="text-center mt-8 text-lg text-slate-300">
      You haven&apos;t created any flashcards yet. <br />
      Go to the{' '}
      <Link href="/learn" className="text-sky-400 hover:text-sky-300 font-medium">
        Learn page
      </Link>{' '}
      to generate some!
    </p>
  );
}
