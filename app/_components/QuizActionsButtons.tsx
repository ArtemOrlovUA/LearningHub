'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteQuiz } from '@/app/actions/quizActions';

interface QuizActionsProps {
  pack_id: string;
  onDelete: (pack_id: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  isRenaming: boolean;
}

export function QuizActions({
  pack_id,
  onDelete,
  isEditing,
  onEdit,
  onCancel,
  isRenaming,
}: QuizActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteQuiz({ pack_id });
    if (result.success) {
      onDelete(pack_id);
    } else {
      alert(result.message);
    }
    setIsDeleting(false);
  }

  if (isEditing) {
    return (
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={isRenaming}
          className="py-2 px-4 text-sm font-semibold text-black bg-white rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-gray-200">
          {!isRenaming ? 'Save' : 'Saving...'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isRenaming}
          className="py-2 px-4 text-slate-100 border border-gray-600 rounded-md hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed duration-200 ease-in-out">
          Discard
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-3">
      <Link
        href={`/quiz/${pack_id}`}
        className="py-2 px-4 text-sm text-emerald-400 bg-transparent border border-emerald-400 rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-emerald-400 hover:text-black">
        Start
      </Link>
      <button
        onClick={onEdit}
        className="py-2 px-4 text-sm cursor-pointer text-sky-400 border-sky-400 hover:bg-sky-400 hover:text-black border rounded-md transition-colors duration-150 ease-in-out">
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="py-2 px-4 text-sm cursor-pointer text-red-500 border-red-500 hover:bg-red-500 hover:text-black border rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
