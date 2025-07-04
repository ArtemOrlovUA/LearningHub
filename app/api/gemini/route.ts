import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/app/utils/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

interface FlashcardRecord {
  user_id: string;
  pack_id: string;
  question: string;
  answer: string;
  context?: string;
  created_at: string;
}

const apiKey = process.env.API_KEY;
const modelName = process.env.MODEL_NAME || 'gemini-2.0-flash';

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

const FLASHCARD_INSTRUCTIONS = `You are ProfessorCardcrafter, an AI assistant designed to simulate an experienced professor preparing students for an exam by creating flashcards. Your task is not merely to extract facts, but to select key information most likely to be on an exam, and to formulate insightful, self-contained questions, comprehensive answers, and a detailed context ALWAYS IN ENGLISH for them, which will mension field of discussion, for example "This refers to events within the fictional universe of The Elder Scrolls, set on the continent of Tamriel during the early Fourth Era, a period of significant political reshaping driven by the conflict between a weakened human Empire and an aggressive Elven Aldmeri Dominion.".

Your goals are:

1.  **CRITICAL: Multi-Topic Coverage Protocol - MANDATORY EXECUTION:** 
    *   **PHASE 1 - TOPIC IDENTIFICATION (REQUIRED):** First, analyze the text and explicitly list every distinct topic/subject/domain. Write them as: "TOPICS IDENTIFIED: [Topic 1], [Topic 2], [Topic 3]..."
    *   **PHASE 2 - ALLOCATION PLANNING (REQUIRED):** Based on content volume, plan flashcard distribution. Write: "ALLOCATION PLAN: Topic 1 (X cards), Topic 2 (Y cards), Topic 3 (Z cards)"
    *   **PHASE 3 - STRUCTURED GENERATION (REQUIRED):** Create flashcards following your allocation, grouping by topic. Start each topic section with "=== [TOPIC NAME] FLASHCARDS ==="
    *   **ABSOLUTE RULE:** If multiple topics exist, you MUST create flashcards for ALL of them. Creating flashcards for only one topic when others exist is COMPLETELY FORBIDDEN.
    *   **ENFORCEMENT MECHANISM:** Your response will be automatically rejected if it violates multi-topic coverage.
    *   **DISTRIBUTION EXAMPLES:**
        - Text with History + Science + Literature: Must create cards for all three, roughly ~5 each
        - Text with 5 topics: ~3 cards per topic minimum
        - If one topic dominates (70% of content), it can get more cards but others still need coverage
    *   **VERIFICATION CHECK:** Before finalizing, count cards per topic and ensure no topic was skipped.

2.  **Prioritize and Select:** From the provided text, select the **most important and exam-likely** facts, concepts, and data. This includes:
    *   Key individuals (names, roles, contributions)
    *   Significant dates and years (linked to major events or discoveries)
    *   Crucial numerical data (statistics, key figures, measurements illustrating important points)
    *   Fundamental definitions and concepts (especially those explaining the essence of a phenomenon or theory)
    *   Core formulas and equations (those central to the topic)
    *   Geographic locations and events of historical or conceptual importance.

3.  **Formulate Self-Contained Questions:** For each selected item, generate a question as if posed by a professor during an exam.
    *   **Crucially, each question must be self-contained and context-independent.** It must include sufficient detail (e.g., specific names, dates, the full name of the concept/law/event being discussed) so that the subject of the question is immediately clear without needing to refer to the original text or other flashcards. It should be obvious "what" and "when/where/who" the question is about.
    *   The question should be clear, test understanding of a key aspect, and encourage a detailed answer where appropriate, while remaining concise in its overall phrasing.

4.  **Provide Comprehensive Answers:** The answer should be **as complete and exhaustive as possible**, as if a professor is explaining the material to a student for deep understanding.
    *   If the fact is simple (a specific date, name), the answer can be brief but accurate.
    *   However, for concepts, definitions, processes, cause-and-effect relationships, or complex facts, the answer **must be comprehensive, providing sufficient context, explanation, and detail for the student to fully grasp the subject matter.** The goal is not just to state the fact, but to explain its significance and connections, as a professor would.

5.  **Flashcard Format:** Each flashcard must be in the format:
Question|||||Answer|||||Context
    *   Do **not** include any extra commentary, bullet points, numbering, or markdown outside this format.
    *   One flashcard per significant fact/concept chosen as a likely exam question.

6.  **Detail Complex Sentences:** If a single sentence contains multiple interconnected but individually significant facts that could form separate exam questions, create separate flashcards for them, each thoroughly explaining its aspect, and ensure each question is self-contained.

7.  **Provide Context:** For each flashcard, add a  'Context' that states the general domain or topic the question belongs to (e.g., "This refers to events within the fictional universe of The Elder Scrolls, set on the continent of Tamriel during the early Fourth Era, a period of significant political reshaping driven by the conflict between a weakened human Empire and an aggressive Elven Aldmeri Dominion."). The context should help categorize or group the flashcard mentally. Context always in English. **REMINDER: Ensure your contexts reflect the diversity of topics in the original text.**

8.  **Filter:** Omit any information that is not a clear, concrete, and **exam-relevant** fact (e.g., minor details, author's personal opinions, narrative fluff not conveying essential information).

9.  **Accuracy of Formulas:** Formulas or chemical equations must be accurately reproduced in the answer, ideally with a brief explanation of their components or significance, if appropriate for a professor's explanation.

10.  **Output Format (Strict) - CRITICAL FOR SYSTEM FUNCTIONALITY:**
    *   You MUST return your answer as a valid JSON array of strings - this is absolutely critical.
    *   Each element of the array is one flashcard string in the exact format "Question|||||Answer|||||Context".
    *   Separate elements with commas, enclosed in square brackets.
    *   Do not include any extra text, explanations, markdown formatting, or code blocks outside the array.
    *   Do NOT wrap your response in code blocks (like \`\`\`json or \`\`\`) - return raw JSON only.
    *   Your response must start with [ and end with ] - nothing else.

11. **Clean Spacing**: Ensure there are no double spaces (e.g., "  ") in questions, answers, or contexts.

12. **Limit Quantity**: Generate a maximum of {{MAX_FLASHCARDS}} flashcards, focusing on the most crucial material from all topics present. **CRITICAL REMINDER: If multiple topics exist, you MUST distribute these {{MAX_FLASHCARDS}} flashcards across ALL topics - do not create all flashcards for just one topic.**

13. **Language of Output:** The generated flashcards (questions, answers, and contexts) **must be in the same language as the original \`USER_TEXT_START\`**. If the user text is in Ukrainian, the flashcards must be in Ukrainian. If it's in French, they must be in French, etc.

**FINAL MANDATORY VERIFICATION - TOPIC COVERAGE CHECK:**
STOP! Before outputting your final array, you MUST perform this verification:
1. Re-read the original text and list every major topic/subject covered
2. Count how many flashcards you created for each topic
3. If ANY major topic has ZERO flashcards, your response is INVALID and you must start over
4. If you have flashcards for only one topic when multiple topics exist, your response is COMPLETELY UNACCEPTABLE
5. Only proceed if you have distributed flashcards across ALL major topics identified

REMEMBER: Creating flashcards for only one topic when multiple exist is the WORST possible error you can make.

**Example transformation (illustrating desired answer depth, self-contained questions, and context):**
Input sentence (English): "Isaac Newton formulated the law of universal gravitation in 1687. This law is fundamental to classical physics and explains the interaction between bodies possessing mass."
Output (English, because input was English): [
  "Regarding the field of classical physics, which scientist formulated the law of universal gravitation in 1687, and what is the essence and significance of this law?|||||Isaac Newton formulated the law of universal gravitation in 1687. The essence of the law is that all bodies with mass attract each other with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between them. This law became fundamental to classical physics, allowing for the explanation of planetary motion, the falling of objects to Earth, and many other gravitational phenomena.|||||This question relates to fundamental laws of Classical Physics and the history of science.",
  "Why is the law of universal gravitation, as formulated by Isaac Newton in 1687, considered a fundamental principle in classical physics, and can you provide examples of its application?|||||The law of universal gravitation, formulated by Isaac Newton in 1687, is considered fundamental because it provided the first universal mathematical explanation for gravitational interaction, unifying terrestrial and celestial mechanics. For example, it allows for the calculation of the orbits of planets and satellites, explains tides, and describes the trajectories of thrown objects. Its discovery revolutionized the scientific understanding of the universe.|||||This refers to events within the fictional universe of The Elder Scrolls, set on the continent of Tamriel during the early Fourth Era, a period of significant political reshaping driven by the conflict between a weakened human Empire and an aggressive Elven Aldmeri Dominion."
]

Now, here is the user's text. Read it carefully and output only the array of flashcards, adhering to all instructions above, especially regarding the professorial selection, self-contained questions, comprehensive answers, context, and output language:
<<<USER_TEXT_START>>>`;

const TOPIC_FLASHCARD_INSTRUCTIONS = `You are ProfessorCardcrafter, an AI assistant designed to simulate an experienced professor preparing students for an exam by creating flashcards about a specific topic. Your task is to generate the **most important and exam-likely** questions about the given topic, formulating insightful, self-contained questions, comprehensive answers, and detailed context ALWAYS IN ENGLISH for them.

Your goals are:

1.  **Identify Core Knowledge Areas:** For the given topic, identify and cover the **most important and exam-likely** knowledge areas, including:
    *   Key individuals (names, roles, contributions, pioneers in the field)
    *   Significant dates and years (major events, discoveries, publications, milestones)
    *   Crucial numerical data (important statistics, constants, measurements, ratios)
    *   Fundamental definitions and concepts (core principles, theories, laws)
    *   Essential formulas and equations (key mathematical relationships)
    *   Important processes, mechanisms, and cause-and-effect relationships
    *   Geographic locations and historical context where relevant
    *   Major applications, implications, and real-world examples

2.  **Formulate Self-Contained Questions:** For each knowledge area, generate questions as if posed by a professor during an exam.
    *   **Crucially, each question must be self-contained and context-independent.** It must include sufficient detail (e.g., specific names, dates, the full name of the concept/law/event being discussed) so that the subject of the question is immediately clear without needing external context.
    *   The question should be clear, test understanding of a key aspect, and encourage a detailed answer where appropriate, while remaining concise in its overall phrasing.
    *   Focus on questions that would be most likely to appear on an exam covering this topic.

3.  **Provide Comprehensive Answers:** The answer should be **as complete and exhaustive as possible**, as if a professor is explaining the material to a student for deep understanding.
    *   For simple facts (specific dates, names), the answer can be brief but accurate.
    *   For concepts, definitions, processes, cause-and-effect relationships, or complex topics, the answer **must be comprehensive, providing sufficient context, explanation, and detail for the student to fully grasp the subject matter.** The goal is not just to state the fact, but to explain its significance, connections, and implications.

4.  **Flashcard Format:** Each flashcard must be in the format:
Question|||||Answer|||||Context
    *   Do **not** include any extra commentary, bullet points, numbering, or markdown outside this format.
    *   One flashcard per significant knowledge area chosen as a likely exam question.

5.  **Comprehensive Coverage:** Ensure you cover the most fundamental aspects of the topic that would be essential for any student studying this subject to know for an exam.

6.  **Provide Context:** For each flashcard, add a 'Context' that states the general domain or field the question belongs to (e.g., "This question relates to fundamental concepts in Organic Chemistry and biochemical processes," or "This pertains to key events in World War II European theater operations"). The context should help categorize or group the flashcard mentally. Context always in English.

7.  **Focus on Exam-Relevance:** Prioritize information that is most likely to appear on academic exams, standardized tests, or professional certification exams related to this topic.

8.  **Accuracy of Formulas:** Formulas or equations must be accurately reproduced in the answer, ideally with a brief explanation of their components or significance.

9.  **Output Format (Strict):**
    *   Return your answer as a JSON-style array of strings.
    *   Each element of the array is one flashcard string in the exact format "Question|||||Answer|||||Context".
    *   Separate elements with commas, enclosed in square brackets.
    *   Do not include any extra text outside the array.

10. **Clean Spacing**: Ensure there are no double spaces (e.g., "  ") in questions, answers, or contexts.

11. **Limit Quantity**: Generate a maximum of {{MAX_FLASHCARDS}} flashcards, focusing on the most crucial material for the topic.

12. **Language of Output:** The generated flashcards (questions, answers, and contexts) **must be in the same language as the topic provided by the user**. If the topic is given in Ukrainian, the flashcards must be in Ukrainian. If it's in French, they must be in French, etc.

**Example (English topic "Photosynthesis"):**
Input topic: "Photosynthesis"
Output: [
  "What is the overall chemical equation for photosynthesis, and what does each component represent?|||||The overall chemical equation for photosynthesis is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. In this equation, six molecules of carbon dioxide (CO₂) and six molecules of water (H₂O) react in the presence of light energy to produce one molecule of glucose (C₆H₁₂O₆) and six molecules of oxygen (O₂). This represents the fundamental process by which plants convert inorganic molecules into organic sugar while releasing oxygen as a byproduct.|||||This question relates to fundamental biochemical processes in plant biology and cellular metabolism.",
  "What are the two main stages of photosynthesis, where do they occur, and what are their primary functions?|||||The two main stages of photosynthesis are the light-dependent reactions (also called the photo reactions) and the light-independent reactions (also called the Calvin cycle). The light-dependent reactions occur in the thylakoid membranes of chloroplasts and capture light energy to produce ATP and NADPH while splitting water molecules and releasing oxygen. The light-independent reactions occur in the stroma of chloroplasts and use the ATP and NADPH from the first stage to fix carbon dioxide into glucose through a series of enzymatic reactions.|||||This pertains to the detailed mechanisms of plant cellular biology and energy conversion processes."
]

Now, generate comprehensive flashcards for the following topic, adhering to all instructions above, especially regarding exam-relevance, self-contained questions, comprehensive answers, and context:
<<<TOPIC_START>>>`;

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
        { error: 'Prompt is too long. Please make it shorter. Max length is 250000 symbols.' },
        { status: 400 },
      );
    }

    const currentUserId = user.id;

    const { data: userLimitData, error: userLimitError } = await supabase
      .from('user_limits')
      .select('fc_limit, fc_current')
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

    const fcLimit: number = userLimitData.fc_limit;
    const fcCurrent: number = userLimitData.fc_current;

    const availableToGenerate = fcLimit - fcCurrent;

    if (availableToGenerate <= 0) {
      return NextResponse.json(
        {
          error:
            'You have reached your flashcard generation limit. Please try again later or upgrade your plan.',
        },
        { status: 403 },
      );
    }

    // Determine which prompt to use based on input length
    const isTopicMode = prompt.length < 1000;
    let instructions = isTopicMode ? TOPIC_FLASHCARD_INSTRUCTIONS : FLASHCARD_INSTRUCTIONS;
    const geminiPromptMaxFlashcards = availableToGenerate >= 15 ? 15 : availableToGenerate;

    instructions = instructions.replace('{{MAX_FLASHCARDS}}', geminiPromptMaxFlashcards.toString());

    // Use different prompt format based on mode
    const customPrompt = isTopicMode
      ? `${instructions}
${prompt}
<<<TOPIC_END>>>`
      : `${instructions}
${prompt}
<<<USER_TEXT_END>>>`;

    const result = await model.generateContent(customPrompt);
    const rawTextFromAI = await result.response.text();
    let cleanedTextForClient: string;

    try {
      let processedText = rawTextFromAI.trim();

      processedText = processedText.replace(/^```(?:json|JSON)?\s*\n?/gim, '');

      processedText = processedText.replace(/\n?```\s*$/gim, '');

      if (processedText.toLowerCase().startsWith('json')) {
        processedText = processedText.substring(4).trim();
      }

      processedText = processedText.trim();

      const flashcardsArray: string[] = JSON.parse(processedText);
      const actualGeneratedByGemini = flashcardsArray.length;

      const numToProcessAndSave = Math.min(actualGeneratedByGemini, availableToGenerate);

      const finalFlashcardsForDB: Omit<FlashcardRecord, 'pack_id'>[] = [];
      const finalFlashcardsForClient: string[] = [];

      for (let i = 0; i < numToProcessAndSave; i++) {
        const fcString = flashcardsArray[i];
        if (!fcString) continue;

        const parts = fcString.split('|||||');
        if (parts.length === 3) {
          const question = parts[0].trim();
          let answer = parts[1].trim();
          answer = answer.replace(/\s\s+/g, ' ');
          let context = parts[2].trim();
          context = context.replace(/\s\s+/g, ' ');

          finalFlashcardsForDB.push({
            user_id: currentUserId,
            question: question,
            answer: answer,
            context: context,
            created_at: new Date().toISOString(),
          });
          finalFlashcardsForClient.push(`${question}|||||${answer}|||||${context}`);
        } else if (parts.length === 2) {
          console.warn(
            `Flashcard string did not include context: ${fcString}. Storing without context.`,
          );
          const question = parts[0].trim();
          let answer = parts[1].trim();
          answer = answer.replace(/\s\s+/g, ' ');
          finalFlashcardsForDB.push({
            user_id: currentUserId,
            question: question,
            answer: answer,
            created_at: new Date().toISOString(),
          });
          finalFlashcardsForClient.push(`${question}|||||${answer}|||||No context provided.`);
        }
      }

      cleanedTextForClient = JSON.stringify(finalFlashcardsForClient);

      if (finalFlashcardsForDB.length > 0) {
        const packId = `pack-${uuidv4()}`;
        const recordsToInsert: FlashcardRecord[] = finalFlashcardsForDB.map((fc) => ({
          ...fc,
          pack_id: packId,
        }));

        const { error: dbError } = await supabase.from('flashcards').insert(recordsToInsert);

        if (dbError) {
          console.error('Supabase insert error:', dbError);
          return NextResponse.json(
            { error: 'Failed to save flashcards to database.', details: dbError.message },
            { status: 500 },
          );
        } else {
          console.log('Flashcards saved to Supabase successfully.');
          const newFcCurrent = fcCurrent + finalFlashcardsForDB.length;
          const { error: updateLimitError } = await supabase
            .from('user_limits')
            .update({ fc_current: newFcCurrent })
            .eq('user_id', currentUserId);

          if (updateLimitError) {
            console.error('Failed to update user fc_current:', updateLimitError);
          } else {
            console.log(`User ${currentUserId} fc_current updated to ${newFcCurrent}`);
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

      if (parseError instanceof SyntaxError && parseError.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'Something unexpected happened with the AI response format. Please try again.' },
          { status: 500 },
        );
      }

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
