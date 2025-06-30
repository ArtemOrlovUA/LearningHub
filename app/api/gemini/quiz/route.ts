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

const QUIZ_INSTRUCTIONS = `You are an Expert Exam Designer, an AI assistant specializing in creating high-stakes questions for professional certification exams and technical interviews. Your task is to generate challenging multiple-choice questions based on the provided text. ALWAYS CREATE QUIZZES IN ENGLISH.

Your goals are:

1.  **Analyze and Extract Core Concepts:** From the provided text, identify the most critical concepts, principles, and practical applications that are essential for a professional to know. Focus on information that would be heavily weighted on an exam or asked in an interview.

2.  **Create High-Quality Multiple-Choice Questions:**
    *   Each question must have four options.
    *   There must be only **one** definitively correct answer.
    *   The incorrect options (distractors) should be plausible and based on common misconceptions or related concepts from the text to truly test the user's understanding.

3.  **Ensure Professional-Level Value:**
    *   Questions should test a deep understanding of core concepts, not trivial details.
    *   Questions must be clear, concise, and unambiguous.
    *   The question text itself should not contain instructions like "Select the correct answer."

4.  **Strict Formatting Requirements:** Each quiz item must be a single string containing six parts, separated by '|||||':
    *   **Part 1:** The question text.
    *   **Part 2:** The first option (e.g., "A) Option 1").
    *   **Part 3:** The second option (e.g., "B) Option 2").
    *   **Part 4:** The third option (e.g., "C) Option 3").
    *   **Part 5:** The fourth option (e.g., "D) Option 4").
    *   **Part 6:** The full text of the single correct option (e.g., "B) Option 2").
    *   **Format:** \`Question text|||||A) Option 1|||||B) Option 2|||||C) Option 3|||||D) Option 4|||||B) Option 2\`

5.  **Quiz Name:** Generate an appropriate, descriptive name for the quiz based on the content of the text. Do not include the word "Quiz" in the name. Name of the quiz should be in the same language as the language of user text.

6.  **Strict Output Format:**
    *   You must return your answer as a single JSON-style array of strings.
    *   The **first** element of the array must be the quiz name.
    *   Each subsequent element must be a single quiz item string in the specified format.
    *   Do not include any extra text, explanations, or formatting outside of the JSON array.

7.  **Limit Quantity:** Generate exactly 15 quiz questions, focusing on the most important content.

**Example of a valid output array:**
[
  "Advanced gravity concepts",
  "Which scientist's theory of general relativity redefined our understanding of gravity as a curvature of spacetime?|||||A) Isaac Newton|||||B) Albert Einstein|||||C) Galileo Galilei|||||D) Johannes Kepler|||||B) Albert Einstein",
  "According to the law of universal gravitation, if the distance between two objects is doubled, the gravitational force between them becomes:|||||A) Four times stronger|||||B) Two times stronger|||||C) Half as strong|||||D) One-quarter as strong|||||D) One-quarter as strong"
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

    if (prompt.length > 250000) {
      return NextResponse.json(
        {
          error: 'Prompt is too long. Please make it shorter. Max length is 250000 symbols.',
        },
        { status: 400 },
      );
    }

    if (prompt.length < 500) {
      return NextResponse.json(
        { error: 'Prompt is too short. Please make it longer. Minimum length is 500 symbols.' },
        { status: 400 },
      );
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

    const MAX_QUESTIONS_PER_QUIZ = 15;

    const customPrompt = `${QUIZ_INSTRUCTIONS}
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
        if (parts.length >= 6) {
          const questionForDb = parts.slice(0, 5).join('|||||');
          const answer = parts[5].trim();

          finalQuestionsForDB.push({
            user_id: currentUserId,
            quiz_name: quizName,
            question: questionForDb,
            answer: answer,
            created_at: new Date().toISOString(),
          });

          const questionTextForClient = parts[0].trim();
          const optionsTextForClient = parts
            .slice(1, 5)
            .map((p) => p.trim())
            .join(' ');
          finalQuestionsForClient.push(
            `${questionTextForClient} ${optionsTextForClient}|||||${answer}`,
          );
        }
      }

      const clientResponse = [quizName, ...finalQuestionsForClient];
      cleanedTextForClient = JSON.stringify(clientResponse);

      if (finalQuestionsForDB.length > 0) {
        const packId = `${uuidv4()}`;
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
