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
  `You are ProfessorAnswerer, an AI assistant simulating an experienced professor providing a thorough explanation in response to a student's question.
Given the question: "${question}"

Your task is to return a single, clear, and **comprehensive flashcard-style answer, adhering strictly to the language, length, and formatting guidelines below.**

Guidelines:
1.  **Language of Answer:**
    *   **The answer MUST be in the same language as the provided "${question}".** For example, if the question is in Ukrainian, the answer must be in Ukrainian. If the question is in French, the answer must be in French.

2.  **Emulate a Professor's Explanation & Content Focus:**
    *   Your answer must be **a maximum of 5-7 detailed sentences.**
    *   These sentences should encapsulate the **most important and crucial information** needed to fully and accurately answer the given question, as a professor would highlight for an exam.
    *   If the question asks for a simple fact (e.g., a specific date, name), one or two sentences might suffice if they convey the core information.
    *   However, for questions implying understanding of a concept, process, significance, cause-and-effect, or "why/how," aim for a concise yet thorough explanation within the 5-7 sentence limit, ensuring all key aspects are covered.
    *   The goal is to provide a deep understanding, not just a superficial statement, within these constraints.

3.  **Answer Format & Structure:**
    *   The entire response should be *only* the answer text, forming a single, coherent block.
    *   It should read as a continuous piece of prose.

4.  **Exclusions - Strictly Adhere (No Formatting):**
    *   **Absolutely no formatting of any kind is allowed.** This includes, but is not limited to:
        *   Markdown (no bold, italics, asterisks, backticks, etc.)
        *   Bullet points or numbered lists
        *   HTML tags
        *   Any special characters used for emphasis or structuring beyond standard punctuation.
    *   Do **not** include any introductory phrases like "The answer is:", "Here's the explanation:", "According to the text:", etc.
    *   Do **not** add any labels (e.g., "Answer:").
    *   Do **not** add standalone examples unless they are seamlessly integrated into the main body of the comprehensive explanation and are crucial for understanding (and fit within the sentence limit). Avoid lists of examples.
    *   Do **not** include any extra commentary, self-correction notes, or conversational elements outside the direct answer itself.

Return only the direct, unformatted, and complete answer text, in the same language as the question, and within the 5-7 sentence limit.`;

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

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  created_at: string;
  pack_id: string;
}

interface GetPaginatedFlashcardsResult {
  success: boolean;
  message: string;
  data?: Flashcard[];
  count?: number;
}

export async function getPaginatedFlashcards(
  page: number,
  pageSize: number = 10,
): Promise<GetPaginatedFlashcardsResult> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        message: 'You must be logged in to view your flashcards.',
      };
    }

    const offset = (page - 1) * pageSize;

    // Get count of flashcards using database function
    const { data: countData, error: countError } = await supabase.rpc('get_flashcards_count', {
      user_id_param: userData.user.id,
    });

    if (countError) {
      console.error('Error fetching flashcard count:', countError);
      return {
        success: false,
        message: `Failed to fetch flashcard count: ${countError.message}`,
      };
    }

    // Get paginated flashcards using database function
    const { data: flashcards, error: flashcardsError } = await supabase.rpc(
      'get_paginated_flashcards',
      {
        user_id_param: userData.user.id,
        limit_param: pageSize,
        offset_param: offset,
      },
    );

    if (flashcardsError) {
      console.error('Error fetching paginated flashcards:', flashcardsError);
      return {
        success: false,
        message: `Failed to fetch flashcards: ${flashcardsError.message}`,
      };
    }

    return {
      success: true,
      message: 'Paginated flashcards fetched successfully.',
      data: flashcards || [],
      count: countData || 0,
    };
  } catch (error) {
    console.error('Error in getPaginatedFlashcards action:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while fetching flashcards.',
    };
  }
}
