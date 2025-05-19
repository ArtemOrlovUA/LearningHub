'use client';

import { useState } from 'react';

interface FlashcardProps {
  question: string;
  answer: string;
}

export default function Flashcard({ question, answer }: FlashcardProps) {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const toggleAnswer = () => {
    setIsAnswerVisible(!isAnswerVisible);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg my-4 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out">
      <div className="font-semibold mb-3 text-lg text-gray-800">{question}</div>
      <button
        onClick={toggleAnswer}
        className="py-2 px-4 text-sm text-blue-600 bg-transparent border border-blue-600 rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-blue-600 hover:text-white">
        {isAnswerVisible ? 'Hide Answer' : 'Show Answer'}
      </button>
      {isAnswerVisible && (
        <div className="mt-3 text-gray-600 text-base leading-relaxed">{answer}</div>
      )}
    </div>
  );
}
