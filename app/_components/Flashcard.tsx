'use client';

import { useState } from 'react';
import {
  deleteFlashcardAction,
  updateFlashcardAction,
  generateFlashcardAnswerAction,
} from '../actions/flashcardsActions';

interface FlashcardProps {
  question: string;
  answer: string;
  fc_id: number;
  isShowingInteractionButtons?: boolean;
}

export default function Flashcard({
  fc_id,
  question,
  answer,
  isShowingInteractionButtons = true,
}: FlashcardProps) {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(question);
  const [editAnswer, setEditAnswer] = useState(answer);
  const [isSaving, setIsSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [generateAnswerError, setGenerateAnswerError] = useState<string | null>(null);

  const toggleAnswer = () => {
    setIsEditing(false);
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

  const handleEdit = () => {
    setIsEditing(true);
    setIsAnswerVisible(false);
    setUpdateError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditQuestion(question);
    setEditAnswer(answer);
    setUpdateError(null);
  };

  const handleGenerateAnswer = async () => {
    setIsGeneratingAnswer(true);
    setGenerateAnswerError(null);
    setUpdateError(null);
    try {
      const result = await generateFlashcardAnswerAction(fc_id, editQuestion);

      if (!result.success) {
        setGenerateAnswerError(result.error || 'Failed to generate answer.');
        console.error('Error generating answer:', result.error);
      } else {
        setEditAnswer(result.answer || '');
      }
    } catch (error) {
      console.error('Exception during generate answer action:', error);
      setGenerateAnswerError('An unexpected error occurred while trying to generate an answer.');
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await updateFlashcardAction(fc_id, editQuestion, editAnswer);
    if (!result.success) {
      setUpdateError(result.error || 'Failed to update flashcard.');
    } else {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out">
      {isEditing ? (
        <form onSubmit={handleSave}>
          <h1 className="font-semibold mb-3 text-lg text-slate-100">Question:</h1>
          <input
            type="text"
            value={editQuestion}
            onChange={(e) => setEditQuestion(e.target.value)}
            className="w-full p-2 mb-2 bg-gray-800 text-slate-100 border border-gray-600 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
            disabled={isGeneratingAnswer}
          />
          <h1 className="font-semibold mb-3 text-lg text-slate-100 mt-2">Answer:</h1>
          <div className="flex items-center mb-2">
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              rows={3}
              className="w-full p-2 bg-gray-800 text-slate-100 border border-gray-600 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 mr-2 disabled:opacity-50"
              disabled={isSaving || isGeneratingAnswer}
            />
            <button
              type="button"
              onClick={handleGenerateAnswer}
              disabled={isGeneratingAnswer || isSaving}
              className="p-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              title="Get answer with AI">
              <svg
                className="w-6 h-6 text-gray-800 dark:text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M17.44 3a1 1 0 0 1 .707.293l2.56 2.56a1 1 0 0 1 0 1.414L18.194 9.78 14.22 5.806l2.513-2.513A1 1 0 0 1 17.44 3Zm-4.634 4.22-9.513 9.513a1 1 0 0 0 0 1.414l2.56 2.56a1 1 0 0 0 1.414 0l9.513-9.513-3.974-3.974ZM6 6a1 1 0 0 1 1 1v1h1a1 1 0 0 1 0 2H7v1a1 1 0 1 1-2 0v-1H4a1 1 0 0 1 0-2h1V7a1 1 0 0 1 1-1Zm9 9a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1h-1a1 1 0 1 1 0-2h1v-1a1 1 0 0 1 1-1Z"
                  clipRule="evenodd"
                />
                <path d="M19 13h-2v2h2v-2ZM13 3h-2v2h2V3Zm-2 2H9v2h2V5ZM9 3H7v2h2V3Zm12 8h-2v2h2v-2Zm0 4h-2v2h2v-2Z" />
              </svg>
            </button>
          </div>
          {updateError && <div className="text-red-500 text-sm mb-2">{updateError}</div>}
          {generateAnswerError && (
            <div className="text-red-500 text-sm mb-2">{generateAnswerError}</div>
          )}
          <div className="flex space-x-4 mt-2 sm:mt-[1.5rem]">
            <button
              type="submit"
              disabled={isSaving}
              className="py-2 px-4 bg-white text-black rounded-md shadow hover:bg-gray-200 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              className="py-2 px-4 text-slate-100 border border-gray-600 rounded-md hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="font-semibold mb-3 text-lg text-slate-100">{question}</div>

          {isShowingInteractionButtons ? (
            <div className="flex gap-x-[1rem] items-center">
              <button
                onClick={toggleAnswer}
                className="py-2 px-4 text-sm text-emerald-400 bg-transparent border border-emerald-400 rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-emerald-400 hover:text-black">
                {isAnswerVisible ? 'Hide Answer' : 'Show Answer'}
              </button>
              <button
                onClick={handleEdit}
                className="py-2 px-4 text-sm cursor-pointer text-sky-400 border-sky-400 hover:bg-sky-400 hover:text-black border rounded-md transition-colors duration-150 ease-in-out">
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
                  className="py-2 px-4 text-sm cursor-pointer text-red-500 border-red-500 hover:bg-red-500 hover:text-black border rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center">
              <button
                onClick={toggleAnswer}
                className="py-2 px-4 text-sm text-sky-400 bg-transparent border border-sky-400 rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-sky-400 hover:text-black">
                {isAnswerVisible ? 'Hide Answer' : 'Show Answer'}
              </button>
            </div>
          )}

          {isAnswerVisible && (
            <div className="mt-3 text-slate-300 text-base leading-relaxed">{answer}</div>
          )}
        </>
      )}
      {deleteError && <div className="mt-2 text-sm text-red-600">{deleteError}</div>}
    </div>
  );
}
