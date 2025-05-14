import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.API_KEY;
const modelName = process.env.MODEL_NAME || 'gemini-1.0-pro';

if (!apiKey) {
  console.error('API_KEY is not defined in environment variables.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

const FLASHCARD_INSTRUCTIONS = `You are FlashCardMaker, a specialized AI designed to read any user-provided text and convert it into a series of simple question-and-answer flashcards.

Your goals are:

1. **Extract** every distinct factual item from the user text, including:
   * Persons (names, roles)
   * Dates and years
   * Numeric data (statistics, quantities, measurements)
   * Definitions and concepts
   * Formulas and equations
   * Locations and events

2. **Generate** for each fact a standalone flashcard in the format:
Question|||||Answer
* Use "Question:" phrasing that prompts recall of exactly that fact.
* Keep both Q and A concise (one sentence or equation).
* Do **not** include any extra commentary, bullet points, numbering, or markdown.
* One flashcard per fact.

3. **Handle complex sentences** by splitting them into multiple flashcards if they contain multiple facts.

4. **Omit** anything that is not a clear concrete fact (e.g., opinions, narrative fluff, transitions).

5. **Preserve** formulas or chemical equations exactly on the answer side.

6. **Output Format:**
* Return your answer as a JSON-style array of strings.
* Each element of the array is one flashcard string in the exact format "Question|||||Answer".
* Separate elements with commas, enclosed in square brackets.
* Do not include any extra text outside the array.

7. **Clean Spacing**: Ensure there are no double spaces (e.g., "  ") in questions or answers.

8. **Limit Quantity**: Generate a maximum of 15 flashcards.

**Example transformation:**
Input sentence: "Isaac Newton formulated the law of universal gravitation in 1687."
Output: [
  "Who formulated the law of universal gravitation, and in what year?|||||Isaac Newton in 1687 if it's not mentiond that it should be detailed, if meantioned, then it should be detailed with more information",
  "What law did Isaac Newton formulate in 1687?|||||The law of universal gravitation if it's not mentiond that it should be detailed, if meantioned, then it should be detailed with more information",
  "In what year did Isaac Newton publish the law of universal gravitation?|||||1687 if it's not mentiond that it should be detailed, if meantioned, then it should be detailed with more information"
]

Now, here is the user's text. Read it carefully and output only the array of flashcards:
<<<USER_TEXT_START>>>`;

export async function POST(request: Request) {
  if (!model || !genAI) {
    return NextResponse.json(
      { error: 'Gemini AI client not initialized. Check API_KEY.' },
      { status: 500 },
    );
  }

  try {
    const { prompt, detailed } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
    }

    let instructions = FLASHCARD_INSTRUCTIONS;
    if (detailed) {
      instructions = instructions.replace(
        '* Do **not** include any extra commentary, bullet points, numbering, or markdown.',
        '* Do **not** include any, bullet points, numbering, or markdown.',
      );
      instructions = instructions.replace(
        '<<<USER_TEXT_START>>>',
        "9. **Enrich Answers**: For each answer, add a detail enrichment. This could be an explanation of its general factual correctness, or a related interesting fact. Avoid merely stating where the information is found in the user's text at the start of the answer, do it in the end but without words 'clearly' or any that makes user feels weird'.\n<<<USER_TEXT_START>>>",
      );
    }

    const customPrompt = `${instructions}
${prompt}
<<<USER_TEXT_END>>>`;

    const result = await model.generateContent(customPrompt);
    const rawTextFromAI = await result.response.text();
    let cleanedTextForClient;

    try {
      let processedText = rawTextFromAI
        .trim()
        .replace(/^```(?:json)?\s*/im, '')
        .replace(/```$/, '')
        .trim();

      if (processedText.toLowerCase().startsWith('json\n')) {
        processedText = processedText.substring(5).trim();
      }

      const flashcardsArray: string[] = JSON.parse(processedText);

      const cleanedFlashcardsArray = flashcardsArray.map((fcString) => {
        const parts = fcString.split('|||||');
        if (parts.length === 2) {
          const question = parts[0].trim();
          let answer = parts[1].trim();
          answer = answer.replace(/\s\s+/g, ' ');
          return `${question}|||||${answer}`;
        }
        return fcString;
      });

      cleanedTextForClient = JSON.stringify(cleanedFlashcardsArray);
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
