import { getPaginatedQuizNames } from '@/app/actions/quizActions';
import { QuizList } from '@/app/_components/QuizList';
import Link from 'next/link';

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
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 my-8">
            <Link
              href={`?page=${page - 1}`}
              className={`px-5 py-3 w-[7rem] text-center rounded border border-gray-600 flex justify-center items-center text-slate-300 hover:bg-gray-800 transition-colors duration-200 ${
                page <= 1 ? 'opacity-50 pointer-events-none' : ''
              }`}
              aria-disabled={page <= 1}>
              Previous
            </Link>
            <span className="px-4 py-2 md:space-x-1 flex md:flex-row flex-col text-center justify-center items-center text-slate-400">
              <p className="text-sm text-center">Page </p>
              <p className="text-sm font-bold">
                {page} of {totalPages}
              </p>
            </span>
            <Link
              href={`?page=${page + 1}`}
              className={`px-5 py-3 w-[7rem] text-center rounded border border-gray-600 flex justify-center items-center text-slate-300 hover:bg-gray-800 transition-colors duration-200 ${
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
      You haven&apos;t created any quizzes yet. <br />
      Go to the{' '}
      <Link href="/learn" className="text-sky-400 hover:text-sky-300 font-medium">
        Learn page
      </Link>{' '}
      to generate some!
    </p>
  );
}
