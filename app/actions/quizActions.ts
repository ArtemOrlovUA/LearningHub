'use server';

import { createClient } from '@/app/utils/server';
import { cookies } from 'next/headers';

interface QuizNameAndPackId {
  quiz_name: string;
  pack_id: string;
}

interface RenameQuizResult {
  success: boolean;
  message: string;
}

interface DeleteQuizResult {
  success: boolean;
  message: string;
}

interface GetUniqueQuizNamesResult {
  success: boolean;
  message: string;
  data?: QuizNameAndPackId[];
}

interface QuizQuestion {
  question: string;
  answer: string;
  quiz_name: string;
}

interface GetQuizResult {
  success: boolean;
  message: string;
  data?: QuizQuestion[];
}

export async function renameQuiz(input: {
  pack_id: string;
  new_name: string;
}): Promise<RenameQuizResult> {
  try {
    const { pack_id, new_name } = input;

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        message: 'You must be logged in to update a quiz.',
      };
    }

    const { error: updateError } = await supabase
      .from('quizzes')
      .update({ quiz_name: new_name })
      .eq('pack_id', pack_id)
      .eq('user_id', userData.user.id);

    if (updateError) {
      console.error('Error updating quiz name:', updateError);
      return {
        success: false,
        message: `Failed to update quiz name: ${updateError.message}`,
      };
    }

    return {
      success: true,
      message: 'Quiz name updated successfully.',
    };
  } catch (error) {
    console.error('Error in renameQuiz action:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while renaming the quiz.',
    };
  }
}

export async function deleteQuiz(input: { pack_id: string }): Promise<DeleteQuizResult> {
  try {
    const { pack_id } = input;

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        message: 'You must be logged in to delete a quiz.',
      };
    }

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('pack_id', pack_id)
      .eq('user_id', userData.user.id)
      .limit(1);

    if (quizError) {
      console.error('Error checking quiz ownership:', quizError);
      return {
        success: false,
        message: `Failed to verify quiz ownership: ${quizError.message}`,
      };
    }

    if (!quizData || quizData.length === 0) {
      return {
        success: false,
        message: 'Quiz not found or you do not have permission to delete it.',
      };
    }

    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('pack_id', pack_id)
      .eq('user_id', userData.user.id);

    if (deleteError) {
      console.error('Error deleting quiz:', deleteError);
      return {
        success: false,
        message: `Failed to delete quiz: ${deleteError.message}`,
      };
    }

    return {
      success: true,
      message: 'Quiz deleted successfully.',
    };
  } catch (error) {
    console.error('Error in deleteQuiz action:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while deleting the quiz.',
    };
  }
}

export async function getUniqueQuizNames(): Promise<GetUniqueQuizNamesResult> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        message: 'You must be logged in to view your quizzes.',
      };
    }

    const { data, error } = await supabase
      .from('quizzes')
      .select('quiz_name, pack_id')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unique quiz names:', error);
      return {
        success: false,
        message: `Failed to fetch quiz names: ${error.message}`,
      };
    }

    const uniqueQuizzesMap = new Map<string, string>();
    data?.forEach((item) => {
      if (item.quiz_name && item.pack_id && !uniqueQuizzesMap.has(item.quiz_name)) {
        uniqueQuizzesMap.set(item.quiz_name, item.pack_id);
      }
    });

    const uniqueQuizzes = Array.from(uniqueQuizzesMap.entries()).map(([quiz_name, pack_id]) => ({
      quiz_name,
      pack_id,
    }));

    return {
      success: true,
      message: 'Unique quiz names fetched successfully.',
      data: uniqueQuizzes,
    };
  } catch (error) {
    console.error('Error in getUniqueQuizNames action:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while fetching quiz names.',
    };
  }
}

export async function getQuizByPackId(pack_id: string): Promise<GetQuizResult> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        message: 'You must be logged in to view a quiz.',
      };
    }

    const { data, error } = await supabase
      .from('quizzes')
      .select('question, answer, quiz_name')
      .eq('pack_id', pack_id)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching quiz data:', error);
      return {
        success: false,
        message: `Failed to fetch quiz data: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'Quiz not found or you do not have permission to view it.',
      };
    }

    return {
      success: true,
      message: 'Quiz data fetched successfully.',
      data: data as QuizQuestion[],
    };
  } catch (error) {
    console.error('Error in getQuizByPackId action:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while fetching the quiz.',
    };
  }
}
