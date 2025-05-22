'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../utils/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export async function updateFlashcardAction(
  flashcardId: number,
  question: string,
  answer: string,
): Promise<DeleteFlashcardResult> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { error } = await supabase
      .from('flashcards')
      .update({ question, answer })
      .eq('id', flashcardId);

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/my-flashcards');

    return { success: true };
  } catch (e: unknown) {
    console.error('Error updating flashcard:', e);
    let errorMessage = 'An unexpected error occurred';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    return { success: false, error: errorMessage };
  }
}

const apiKey = process.env.API_KEY;
const modelName = process.env.MODEL_NAME || 'gemini-2.0-flash';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

const FLASHCARD_ANSWER_PROMPT = (question: string) =>
  `You are FlashCardAnswerer. Given the question: "${question}", return a single, concise flashcard–style answer (one sentence or equation). Do not add labels, markdown, examples or extra text—just the answer.`;

interface GenerateAnswerResult {
  success: boolean;
  answer?: string | null;
  error?: string | null;
}

export async function generateFlashcardAnswerAction(
  flashcardId: number,
  question: string,
): Promise<GenerateAnswerResult> {
  if (!model || !genAI) {
    return { success: false, error: 'Gemini AI client not initialized. Check API_KEY.' };
  }

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth error or no user in server action:', authError);
    return { success: false, error: 'User not authenticated.' };
  }

  if (!question || flashcardId === undefined) {
    return { success: false, error: 'Invalid flashcard ID or question.' };
  }

  const currentUserId = user.id;

  const { data: userLimitData, error: userLimitError } = await supabase
    .from('user_limits')
    .select('fc_limit, fc_current')
    .eq('user_id', currentUserId)
    .single();

  if (userLimitError || !userLimitData) {
    console.error('Error fetching user limits in server action:', userLimitError);
    return { success: false, error: 'Failed to fetch user limits.' };
  }

  const fcLimit = userLimitData.fc_limit;
  const fcCurrent = userLimitData.fc_current;

  if (fcCurrent >= fcLimit) {
    return {
      success: false,
      error:
        'You have reached your flashcard generation limit. Please try again later or upgrade your plan.',
    };
  }
  try {
    const prompt = FLASHCARD_ANSWER_PROMPT(question);
    const resultAI = await model.generateContent(prompt);
    const rawText = await resultAI.response.text();
    const generatedAnswer = rawText.trim().replace(/\s\s+/g, ' ');

    const newFcCurrent = fcCurrent + 1;
    const { error: updateLimitError } = await supabase
      .from('user_limits')
      .update({ fc_current: newFcCurrent })
      .eq('user_id', currentUserId);

    if (updateLimitError) {
      console.error('Failed to update user fc_current after AI generation:', updateLimitError);
      return { success: false, error: 'Failed to update generation limit.' };
    }

    revalidatePath('/my-flashcards');
    return { success: true, answer: generatedAnswer };
  } catch (e: unknown) {
    console.error('Error in server action AI generation:', e);
    let errorMessage = 'An unexpected error occurred while generating answer.';
    if (e instanceof Error) errorMessage = e.message;
    return { success: false, error: errorMessage };
  }
}
