// app/_components/Flashcard.tsx
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
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        margin: '1rem 0',
        padding: '1.25rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        transition: 'box-shadow 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.06)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)')}>
      <div
        style={{
          fontWeight: '600',
          marginBottom: '0.75rem',
          fontSize: '1.1rem',
          color: '#1a202c',
        }}>
        {question}
      </div>
      <button
        onClick={toggleAnswer}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
          color: '#2b6cb0',
          backgroundColor: 'transparent',
          border: '1px solid #2b6cb0',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2b6cb0';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#2b6cb0';
        }}>
        {isAnswerVisible ? 'Hide Answer' : 'Show Answer'}
      </button>
      {isAnswerVisible && (
        <div
          style={{
            marginTop: '0.75rem',
            color: '#4a5568',
            fontSize: '1rem',
            lineHeight: '1.6',
          }}>
          {answer}
        </div>
      )}
    </div>
  );
}
