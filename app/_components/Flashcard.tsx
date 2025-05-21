'use client';

import { useState } from 'react';
import { deleteFlashcardAction } from '../actions/flashcardsActions';

interface FlashcardProps {
  question: string;
  answer: string;
  fc_id: number;
}

export default function Flashcard({ fc_id, question, answer }: FlashcardProps) {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleAnswer = () => {
    setIsAnswerVisible(!isAnswerVisible);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteFlashcardAction(fc_id);

      if (!result.success) {
        setDeleteError(result.error || 'Failed to delete flashcard.');
        console.error('Error deleting flashcard:', result.error);
      }
    } catch (error) {
      console.error('Exception during delete flashcard action:', error);
      setDeleteError('An unexpected error occurred while trying to delete.');
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg my-4 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out">
      <div className="font-semibold mb-3 text-lg text-slate-100">{question}</div>
      <div className="flex gap-x-[1rem] items-center">
        <button
          onClick={toggleAnswer}
          className="py-2 px-4 text-sm text-sky-400 bg-transparent border border-sky-400 rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-sky-400 hover:text-black">
          {isAnswerVisible ? 'Hide Answer' : 'Show Answer'}
        </button>
        <button className="py-2 px-4 text-sm cursor-pointer text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-black border rounded-md transition-colors duration-150 ease-in-out">
          Edit
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete();
          }}>
          <button
            type="submit"
            disabled={isDeleting}
            className="py-2 px-4 text-sm cursor-pointer text-red-500 border-red-500 hover:bg-red-500 hover:text-white border rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </form>
      </div>
      {isAnswerVisible && (
        <div className="mt-3 text-slate-300 text-base leading-relaxed">{answer}</div>
      )}
      {deleteError && <div className="mt-2 text-sm text-red-600">{deleteError}</div>}
    </div>
  );
}
