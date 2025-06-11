'use client';

import { useState } from 'react';
import { QuizActions } from './QuizActionsButtons';
import { renameQuiz } from '@/app/actions/quizActions';

interface QuizNameAndPackId {
  quiz_name: string;
  pack_id: string;
}

interface QuizListProps {
  initialQuizzes: QuizNameAndPackId[];
}

export function QuizList({ initialQuizzes }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<QuizNameAndPackId[]>(initialQuizzes);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [renamingPackId, setRenamingPackId] = useState<string | null>(null);

  function handleQuizDeleted(pack_id: string) {
    setQuizzes((prevQuizzes) => prevQuizzes.filter((quiz) => quiz.pack_id !== pack_id));
  }

  async function handleRename(formData: FormData) {
    const pack_id = formData.get('pack_id') as string;
    const new_name = (formData.get('new_name') as string)?.trim();

    if (!new_name) {
      setEditingQuizId(null);
      return;
    }

    const originalName = quizzes.find((q) => q.pack_id === pack_id)?.quiz_name;
    if (new_name === originalName) {
      setEditingQuizId(null);
      return;
    }

    setRenamingPackId(pack_id);

    try {
      const result = await renameQuiz({ pack_id, new_name });

      if (result.success) {
        setQuizzes((prevQuizzes) =>
          prevQuizzes.map((quiz) =>
            quiz.pack_id === pack_id ? { ...quiz, quiz_name: new_name } : quiz,
          ),
        );
        setEditingQuizId(null);
      } else {
        alert(result.message);
      }
    } catch (e) {
      console.error('An unexpected error occurred while renaming. ', e);
    } finally {
      setRenamingPackId(null);
    }
  }

  if (quizzes.length === 0) {
    return (
      <p className="text-center mt-8 text-lg text-slate-300">
        You haven&apos;t created any quizzes yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {quizzes.map(({ quiz_name, pack_id }) => {
        const isEditing = editingQuizId === pack_id;
        const isRenaming = renamingPackId === pack_id;
        return (
          <li key={pack_id} className="bg-gray-900 p-5 rounded-lg border border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRename(new FormData(e.currentTarget));
              }}
              className="flex flex-col sm:flex-row justify-between items-center w-full">
              <input type="hidden" name="pack_id" value={pack_id} />
              {isEditing ? (
                <input
                  type="text"
                  name="new_name"
                  defaultValue={quiz_name}
                  placeholder="Enter new quiz name..."
                  maxLength={75}
                  className="text-xl sm:w-full w-[85vw] font-medium mb-4 sm:mb-0 sm:mr-4 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md p-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingQuizId(null);
                    }
                  }}
                />
              ) : (
                <h2
                  className="text-xl sm:w-full w-[85vw] font-medium mb-4 sm:mb-0 sm:mr-4 text-white"
                  title={quiz_name}>
                  {quiz_name}
                </h2>
              )}
              <QuizActions
                pack_id={pack_id}
                onDelete={handleQuizDeleted}
                isEditing={isEditing}
                onEdit={() => setEditingQuizId(pack_id)}
                onCancel={() => setEditingQuizId(null)}
                isRenaming={isRenaming}
              />
            </form>
          </li>
        );
      })}
    </ul>
  );
}
