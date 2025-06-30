import { getPaginatedFlashcards } from '@/app/actions/flashcardsActions';
import FlashList from '@/app/_components/FlashList';
import Link from 'next/link';
import PaginationControls from '@/app/_components/PaginationControls';

interface FlashcardsSectionProps {
  page: number;
}

const PAGE_SIZE = 10;

export default async function FlashcardsSection({ page }: FlashcardsSectionProps) {
  const result = await getPaginatedFlashcards(page, PAGE_SIZE);

  if (!result.success) {
    return (
      <p className="text-red-600 text-center mt-8">
        Error loading your flashcards. Please try refreshing the page.
      </p>
    );
  }

  if (result.data && result.data.length > 0) {
    const totalPages = result.count ? Math.ceil(result.count / PAGE_SIZE) : 1;
    return (
      <div>
        <FlashList flashcards={result.data} />
        {totalPages > 1 && <PaginationControls currentPage={page} totalPages={totalPages} />}
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
