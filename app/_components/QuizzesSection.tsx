import { getPaginatedQuizNames } from '@/app/actions/quizActions';
import { QuizList } from '@/app/_components/QuizList';
import Link from 'next/link';
import PaginationControls from '@/app/_components/PaginationControls';

interface QuizzesSectionProps {
  page: number;
}

const PAGE_SIZE = 5;

export default async function QuizzesSection({ page }: QuizzesSectionProps) {
  const result = await getPaginatedQuizNames(page, PAGE_SIZE);

  if (!result.success) {
    return (
      <p className="text-red-600 text-center mt-8">
        Error loading your quizzes. Please try refreshing the page.
      </p>
    );
  }

  if (result.data && result.data.length > 0) {
    const totalPages = result.count ? Math.ceil(result.count / PAGE_SIZE) : 1;
    return (
      <div>
        <QuizList initialQuizzes={result.data} />
        {totalPages > 1 && <PaginationControls currentPage={page} totalPages={totalPages} />}
      </div>
    );
  }

  return (
    <p className="text-center mt-8 text-lg text-slate-300">
      You haven&apos;t created any quizzes yet. <br />
      Go to the{' '}
      <Link href="/learn" className="text-sky-400 hover:text-sky-300 font-medium">
        Learn page
      </Link>{' '}
      to generate some!
    </p>
  );
}
