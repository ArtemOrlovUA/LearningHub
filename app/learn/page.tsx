'use client';

import { useState, DragEvent, useEffect } from 'react';
import FlashList from '@/app/_components/FlashList';
import LogoutButton from '../_components/LogoutButton';
import { useUser } from '../utils/useUser';
import { useUserLimits } from '../utils/useLimits';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

interface FlashcardData {
  id: string | number;
  question: string;
  answer: string;
}

export default function LearnPage() {
  const { user, loading: userLoading } = useUser();
  const {
    fc_limit,
    fc_current,
    loading: limitsLoading,
    error: limitsError,
    refetchLimits,
  } = useUserLimits();

  const [prompt, setPrompt] = useState('');
  const [isDetailed, setIsDetailed] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pdfJsApi, setPdfJsApi] = useState<typeof import('pdfjs-dist') | null>(null);

  useEffect(() => {
    const initPdfJs = async () => {
      try {
        const pdfjsLibModule = await import('pdfjs-dist');
        pdfjsLibModule.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        setPdfJsApi(pdfjsLibModule);
      } catch (e) {
        console.error('Failed to load pdfjs-dist:', e);
        setError('PDF functionality could not be loaded. Please refresh the page.');
      }
    };
    initPdfJs();
  }, []);

  const handleGenerateFlashcards = async () => {
    if (!prompt.trim()) {
      setError('Please enter some text or drop a PDF to generate flashcards.');
      return;
    }
    if (!user || !user.id) {
      setError('User not found. Please log in again.');
      setIsLoading(false);
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
        body: JSON.stringify({ prompt, detailed: isDetailed, userId: user.id }),
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

      if (refetchLimits) {
        await refetchLimits();
      }
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

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setError(null);

    if (!pdfJsApi) {
      setError('PDF library is still loading. Please try again in a moment.');
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setIsLoading(true);
        setPrompt('Processing PDF...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await pdfJsApi.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            fullText +=
              textContent.items
                .filter((item): item is TextItem => 'str' in item)
                .map((item: TextItem) => item.str)
                .join(' ') + '\n';
          }
          setPrompt(fullText.trim());
        } catch (pdfError) {
          console.error('Error processing PDF:', pdfError);
          setError("Failed to process PDF. Ensure it's a valid PDF file.");
          setPrompt('');
        } finally {
          setIsLoading(false);
        }
      } else {
        setError('Invalid file type. Please drop a PDF file.');
      }
    } else {
      setError('No file dropped.');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
      {!userLoading ? (
        <div>
          <h1>Welcome</h1>
          <p>Email: {user?.email}</p>
          <LogoutButton />
        </div>
      ) : (
        <div>
          <p>Loading...</p>
        </div>
      )}
      {!limitsLoading ? (
        <div>
          <h1>Limits</h1>
          {limitsError && <p>Error: {limitsError.message}</p>}
          {fc_limit !== undefined && fc_current !== undefined && !limitsError && (
            <p>
              Used: {fc_current} / Limit: {fc_limit}
            </p>
          )}
        </div>
      ) : (
        <div>
          <h1>Limits</h1>
          <p>Loading...</p>
        </div>
      )}

      {limitsError ? (
        <div
          style={{
            marginTop: '2rem',
            color: '#E53E3E',
            backgroundColor: '#FFF5F5',
            border: '1px solid #FC8181',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
          <h2>Error Loading Flashcard Generation Feature</h2>
          <p>{limitsError.message}</p>
          <p>Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      ) : (
        <>
          <h1
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              fontSize: '2.5rem',
              color: '#2D3748',
            }}>
            Generate Flashcards
          </h1>
          <div
            style={{
              position: 'relative',
              marginBottom: '1.5rem',
              border: isDraggingOver ? '2px dashed #4A90E2' : '1px solid transparent',
              borderRadius: '8px',
              backgroundColor: isDraggingOver ? '#f0f8ff' : 'transparent',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter text or drop a PDF file here to create flashcards..."
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
                opacity: isDraggingOver ? 0.5 : 1,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2';
                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#CBD5E0';
                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.07)';
              }}
              disabled={isLoading}
            />
            {isDraggingOver && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#2D3748',
                  pointerEvents: 'none',
                  borderRadius: 'inherit',
                }}>
                <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>
                  Drag and drop files here
                </p>
                <p style={{ margin: '0.5em 0 0 0', fontSize: '0.9em' }}>
                  only PDF-files are supported
                </p>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="detailed"
              checked={isDetailed}
              onChange={(e) => setIsDetailed(e.target.checked)}
              style={{ marginRight: '0.5rem', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label
              htmlFor="detailed"
              style={{ fontSize: '1rem', color: '#4A5568', cursor: 'pointer' }}>
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
        </>
      )}
    </div>
  );
}
