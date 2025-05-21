'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../utils/server';
import { cookies } from 'next/headers';

interface DeleteFlashcardResult {
  success: boolean;
  error?: string | null;
}

export async function deleteFlashcardAction(flashcardId: number): Promise<DeleteFlashcardResult> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { error, count } = await supabase
      .from('flashcards')
      .delete({ count: 'exact' })
      .eq('id', flashcardId);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    if (count === 0) {
      console.warn(`No flashcard found with id: ${flashcardId} to delete.`);
      return { success: false, error: `Flashcard with ID ${flashcardId} not found.` };
    }

    if (count === null) {
      console.warn(
        `Count of deleted rows was null for flashcard id: ${flashcardId}. This might indicate an RLS issue or configuration problem. Proceeding with revalidation as no DB error occurred.`,
      );
    }

    revalidatePath('/my-flashcards');

    return { success: true };
  } catch (e: unknown) {
    console.error('Error deleting flashcard:', e);
    let errorMessage = 'An unexpected error occurred';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    return { success: false, error: errorMessage };
  }
}
