// app/learn/page.tsx
'use client';

import { useState } from 'react';
import FlashList from '@/app/_components/FlashList';
import LogoutButton from '../_components/LogoutButton';
import { useUser } from '../utils/useUser';

interface FlashcardData {
  id: string | number;
  question: string;
  answer: string;
}

export default function LearnPage() {
  const { user } = useUser();
  const [prompt, setPrompt] = useState('');
  const [isDetailed, setIsDetailed] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateFlashcards = async () => {
    if (!prompt.trim()) {
      setError('Please enter some text to generate flashcards.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setFlashcards([]);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, detailed: isDetailed }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const flashcardStrings: string[] = JSON.parse(data.text);

      const formattedFlashcards = flashcardStrings.map((fcString, index) => {
        const parts = fcString.split('|||||');
        return {
          id: `fc-${Date.now()}-${index}`,
          question: parts[0] || 'No question provided',
          answer: parts[1] || 'No answer provided',
        };
      });
      setFlashcards(formattedFlashcards);
    } catch (err: unknown) {
      console.error('Failed to generate flashcards:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
      <>
        <h1>Welcome</h1>
        <p>Email: {user?.email}</p>
        <LogoutButton />
      </>
      <h1
        style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.5rem', color: '#2D3748' }}>
        Generate Flashcards
      </h1>
      <div style={{ marginBottom: '1.5rem' }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter text to create flashcards from..."
          rows={6}
          style={{
            width: '100%',
            padding: '12px 15px',
            fontSize: '1rem',
            border: '1px solid #CBD5E0',
            borderRadius: '8px',
            boxSizing: 'border-box',
            resize: 'vertical',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.07)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#4A90E2';
            e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#CBD5E0';
            e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.07)';
          }}
        />
      </div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          id="detailed"
          checked={isDetailed}
          onChange={(e) => setIsDetailed(e.target.checked)}
          style={{ marginRight: '0.5rem', width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <label htmlFor="detailed" style={{ fontSize: '1rem', color: '#4A5568', cursor: 'pointer' }}>
          Provide detailed answers
        </label>
      </div>
      <button
        onClick={handleGenerateFlashcards}
        disabled={isLoading}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 20px',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#fff',
          backgroundColor: isLoading ? '#A0AEC0' : '#4A90E2',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = '#357ABD';
        }}
        onMouseLeave={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = '#4A90E2';
        }}>
        {isLoading ? 'Generating...' : 'Generate Flashcards'}
      </button>

      {error && (
        <div
          style={{
            marginTop: '1.5rem',
            color: '#E53E3E',
            backgroundColor: '#FFF5F5',
            border: '1px solid #FC8181',
            padding: '10px',
            borderRadius: '6px',
          }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginTop: '2.5rem' }}>
        <FlashList flashcards={flashcards} />
      </div>
    </div>
  );
}
