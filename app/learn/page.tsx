'use client';

import { useState, DragEvent, useEffect } from 'react';
import FlashList from '@/app/_components/FlashList';
import LogoutButton from '../_components/LogoutButton';
import { useUser } from '../utils/useUser';
import { useUserLimits } from '../utils/useLimits';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import Link from 'next/link';

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
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

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

  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold text-center">Виконується вихід...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      {!userLoading ? (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome, {user?.user_metadata?.full_name}
          </h1>
          <p className="text-gray-600 mb-3">Email: {user?.email}</p>
          <div className="flex space-x-4">
            <Link
              href="/my-flashcards"
              className="text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded-md border border-blue-600 hover:bg-blue-50 transition-colors">
              View my flashcards
            </Link>
            <LogoutButton setIsLoggingOut={setIsLoggingOut} />
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 text-center">
          <p className="text-gray-500">Loading user data...</p>
        </div>
      )}
      {!limitsLoading ? (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Limits</h1>
          {limitsError && <p className="text-red-500">Error: {limitsError.message}</p>}
          {fc_limit !== undefined && fc_current !== undefined && !limitsError && (
            <p className="text-gray-700">
              Used: {fc_current} / Limit: {fc_limit}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-8 p-4 text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Limits</h1>
          <p className="text-gray-500">Loading limits...</p>
        </div>
      )}

      {isLoggingOut ? (
        <div className="mt-8 p-5 text-center text-gray-700 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Виконується вихід...</h2>
        </div>
      ) : limitsError ? (
        <div className="mt-8 p-5 text-center bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Error Loading Flashcard Generation Feature</h2>
          <p>{limitsError.message}</p>
          <p>Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      ) : (
        <>
          <h1 className="text-center mb-8 text-4xl font-bold text-gray-800">Generate Flashcards</h1>
          <div
            className={`relative mb-6 rounded-lg transition-all duration-200 ease-in-out ${
              isDraggingOver
                ? 'border-2 border-dashed border-blue-500 bg-blue-50'
                : 'border border-transparent'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter text or drop a PDF file here to create flashcards..."
              rows={6}
              className={`w-full p-3 text-base border border-gray-300 rounded-lg box-border resize-vertical shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 ease-in-out ${
                isDraggingOver ? 'opacity-50' : 'opacity-100'
              }`}
              disabled={isLoading}
            />
            {isDraggingOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-800 pointer-events-none rounded-lg">
                <p className="m-0 text-lg font-bold">Drag and drop files here</p>
                <p className="mt-2 text-sm">only PDF-files are supported</p>
              </div>
            )}
          </div>
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="detailed"
              checked={isDetailed}
              onChange={(e) => setIsDetailed(e.target.checked)}
              className="mr-2 h-4 w-4 cursor-pointer text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="detailed" className="text-base text-gray-700 cursor-pointer">
              Provide detailed answers
            </label>
          </div>
          <button
            onClick={handleGenerateFlashcards}
            disabled={isLoading}
            className="block w-full py-3 px-5 text-lg font-semibold text-white rounded-lg transition-colors duration-200 ease-in-out bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isLoading ? 'Generating...' : 'Generate Flashcards'}
          </button>

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
              Error: {error}
            </div>
          )}

          <div className="mt-10">
            <FlashList flashcards={flashcards} />
          </div>
        </>
      )}
    </div>
  );
}
