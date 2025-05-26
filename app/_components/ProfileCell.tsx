import React from 'react'; // Import React for ReactNode type

interface ProfileCellProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  errorText?: string | null;
}

/**
 * A reusable UI component to display a section of information on the profile page,
 * often referred to as a "cell" or "card".
 * It handles displaying a title, content, loading state, and error state.
 */
export default function ProfileCell({
  title,
  children,
  isLoading = false,
  errorText = null,
}: ProfileCellProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full">
      <h2 className="text-xl font-semibold text-slate-300 mb-3">{title}</h2>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      ) : errorText ? (
        <p className="text-red-400">{errorText}</p>
      ) : (
        <div className="text-slate-100 text-lg">{children}</div>
      )}
    </div>
  );
}
