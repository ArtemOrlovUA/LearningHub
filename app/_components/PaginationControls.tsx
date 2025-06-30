'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  scrollContainerSelector?: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  scrollContainerSelector,
}: PaginationControlsProps) {
  const router = useRouter();

  const isBrowser = () => typeof window !== 'undefined';

  const scrollToTop = () => {
    if (!isBrowser()) return;

    const targetSelector = scrollContainerSelector || 'main';
    const container = document.querySelector(targetSelector);

    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handlePageChange = (page: number) => {
    router.push(`?page=${page}`);
  };

  useEffect(() => {
    scrollToTop();
  }, [currentPage]);

  return (
    <div className="flex justify-center gap-4 my-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`px-5 py-3 w-[7rem] text-center rounded border border-gray-600 flex justify-center items-center text-slate-300 hover:bg-gray-800 transition-colors duration-200 ${
          currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''
        }`}>
        Previous
      </button>
      <span className="px-4 py-2 md:space-x-1 flex md:flex-row flex-col text-center justify-center items-center text-slate-400">
        <p className="text-sm text-center">Page </p>
        <p className="text-sm font-bold">
          {currentPage} of {totalPages}
        </p>
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`px-5 py-3 w-[7rem] text-center rounded border border-gray-600 flex justify-center items-center text-slate-300 hover:bg-gray-800 transition-colors duration-200 ${
          currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''
        }`}>
        Next
      </button>
    </div>
  );
}
