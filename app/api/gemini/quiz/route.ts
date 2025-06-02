import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/app/utils/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

interface QuizRecord {
  user_id: string;
  pack_id: string;
  quiz_name: string;
  question: string;
  answer: string;
  created_at: string;
}

const apiKey = process.env.API_KEY;
const modelName = process.env.MODEL_NAME || 'gemini-2.0-flash';

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

const QUIZ_INSTRUCTIONS = `You are ProfessorQuizMaster, an AI assistant designed to simulate an experienced professor preparing quiz questions for students. Your task is to create insightful, challenging quiz questions with clear answers based on the provided text. ALWAYS CREATE QUIZZES IN ENGLISH.

Your goals are:

1. **Analyze and Extract Key Information:** From the provided text, identify the most important concepts, facts, definitions, and relationships that would be appropriate for quiz questions.

2. **Create Diverse Question Types:** Generate a variety of question formats, such as:
   * Multiple-choice questions (with one correct answer and 3-4 plausible distractors)
   * True/False questions
   * Short answer questions (requiring a brief, direct answer)

3. **Ensure Educational Value:** Each question should:
   * Test understanding of important concepts rather than trivial details
   * Be clear and unambiguous
   * Have a definitive correct answer
   * Be challenging but fair
   * Focus on material that would realistically appear on a test

4. **Format Requirements:** Each quiz item must be in the format:
   Question|||||Answer
   * For multiple-choice questions, format as: "Question|||||Option A|||||Option B|||||Option C|||||Option D" (separate the question from each option with |||||)
   * For true/false questions, just state the proposition in the question part and "True" or "False" in the answer part
   * For other question types, provide a clear question and the definitive correct answer

5. **Quiz Name:** Generate an appropriate, descriptive name for the quiz based on the content of the text but do not include the word "Quiz" in the name.

6. **Output Format (Strict):**
   * Return your answer as a JSON-style array of strings.
   * The first element should be the quiz name.
   * Each subsequent element should be one quiz question in the format "Question|||||Answer".
   * Separate elements with commas, enclosed in square brackets.
   * Do not include any extra text outside the array.

7. **Limit Quantity:** Generate a maximum of {{MAX_QUESTIONS}} quiz questions, focusing on the most important content.

Example output format:
[
  "Introduction to Classical Physics",
  "Which scientist formulated the law of universal gravitation in 1687?|||||A) Albert Einstein|||||B) Isaac Newton|||||C) Galileo Galilei|||||D) Johannes Kepler",
  "The law of universal gravitation states that the gravitational force between two objects is inversely proportional to:|||||A) Their combined mass|||||B) The square root of the distance between them|||||C) The square of the distance between them|||||D) The cube of the distance between them",
  "True or False: Newton's law of universal gravitation unified terrestrial and celestial mechanics.|||||True"
]

Now, here is the user's text. Read it carefully and output only the array with the quiz name and questions, adhering to all instructions above:
<<<USER_TEXT_START>>>`;

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth error or no user:', authError);
    return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
  }

  if (!model || !genAI) {
    return NextResponse.json(
      { error: 'Gemini AI client not initialized. Check API_KEY.' },
      { status: 500 },
    );
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
    }

    const currentUserId = user.id;

    const { data: userLimitData, error: userLimitError } = await supabase
      .from('user_limits')
      .select('q_limit, q_current')
      .eq('user_id', currentUserId)
      .single();

    if (userLimitError) {
      console.error('Error fetching user limits in API route:', userLimitError);
      return NextResponse.json(
        {
          error:
            'Failed to fetch user limits. The record may not exist or another error occurred. Please try logging out and back in, or contact support.',
          details: userLimitError.message,
        },
        { status: 500 },
      );
    }

    if (!userLimitData) {
      console.error(
        `User limit record not found for user ${currentUserId} in API route, though it should have been created on login and no specific fetch error was caught.`,
      );
      return NextResponse.json(
        {
          error:
            'User limit configuration missing unexpectedly. Please try logging out and back in, or contact support.',
        },
        { status: 500 },
      );
    }

    const qLimit: number = userLimitData.q_limit;
    const qCurrent: number = userLimitData.q_current;

    if (qCurrent >= qLimit) {
      return NextResponse.json(
        {
          error:
            'You have reached your quiz generation limit. Please try again later or upgrade your plan.',
        },
        { status: 403 },
      );
    }

    const availableToGenerate = qLimit - qCurrent;
    let instructions = QUIZ_INSTRUCTIONS;
    const MAX_QUESTIONS_PER_QUIZ = availableToGenerate >= 15 ? 15 : availableToGenerate;

    instructions = instructions.replace('{{MAX_QUESTIONS}}', MAX_QUESTIONS_PER_QUIZ.toString());

    const customPrompt = `${instructions}
${prompt}
<<<USER_TEXT_END>>>`;

    const result = await model.generateContent(customPrompt);
    const rawTextFromAI = await result.response.text();
    let cleanedTextForClient: string;

    try {
      let processedText = rawTextFromAI
        .trim()
        .replace(/^```(?:json)?\s*/im, '')
        .replace(/```$/, '')
        .trim();

      if (processedText.toLowerCase().startsWith('json\n')) {
        processedText = processedText.substring(5).trim();
      }

      const quizArray: string[] = JSON.parse(processedText);
      const quizName = quizArray[0] || 'Untitled Quiz';
      const questions = quizArray.slice(1);

      const actualGeneratedByGemini = questions.length;
      const numToProcessAndSave = Math.min(actualGeneratedByGemini, MAX_QUESTIONS_PER_QUIZ);

      const finalQuestionsForDB: Omit<QuizRecord, 'pack_id'>[] = [];
      const finalQuestionsForClient: string[] = [];

      for (let i = 0; i < numToProcessAndSave; i++) {
        const qString = questions[i];
        if (!qString) continue;

        const parts = qString.split('|||||');
        if (parts.length >= 2) {
          const question = parts[0].trim();
          const answer = parts.length > 2 ? parts.slice(1).join('|||||') : parts[1].trim();

          finalQuestionsForDB.push({
            user_id: currentUserId,
            quiz_name: quizName,
            question: question,
            answer: answer,
            created_at: new Date().toISOString(),
          });
          finalQuestionsForClient.push(`${question}|||||${answer}`);
        }
      }

      const clientResponse = [quizName, ...finalQuestionsForClient];
      cleanedTextForClient = JSON.stringify(clientResponse);

      if (finalQuestionsForDB.length > 0) {
        const packId = `quiz-${uuidv4()}`;
        const recordsToInsert: QuizRecord[] = finalQuestionsForDB.map((q) => ({
          ...q,
          pack_id: packId,
        }));

        const { error: dbError } = await supabase.from('quizzes').insert(recordsToInsert);

        if (dbError) {
          console.error('Supabase insert error:', dbError);
          return NextResponse.json(
            { error: 'Failed to save quiz to database.', details: dbError.message },
            { status: 500 },
          );
        } else {
          console.log('Quiz saved to Supabase successfully.');
          const newQCurrent = qCurrent + 1;
          const { error: updateLimitError } = await supabase
            .from('user_limits')
            .update({ q_current: newQCurrent })
            .eq('user_id', currentUserId);

          if (updateLimitError) {
            console.error('Failed to update user q_current:', updateLimitError);
          } else {
            console.log(`User ${currentUserId} q_current updated to ${newQCurrent}`);
          }
        }
      }
    } catch (parseError) {
      console.error(
        'Error parsing or cleaning AI response:',
        parseError,
        '\nRaw AI Response:\n',
        rawTextFromAI,
      );
      cleanedTextForClient = rawTextFromAI;
    }

    return NextResponse.json({ text: cleanedTextForClient });
  } catch (err: unknown) {
    console.error('Gemini API error or other internal error:', err);
    let errorMessage = 'Failed to fetch from Gemini.';
    let errorDetails = '';
    if (err instanceof Error) {
      errorMessage = err.message;
      errorDetails = err.stack || '';
    }
    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: 500 });
  }
}
