'use client';

import { useState, DragEvent, useEffect, useRef } from 'react';
import FlashList from '@/app/_components/FlashList';
import { useUser } from '../utils/useUser';
import { useUserLimits } from '../utils/useLimits';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

interface FlashcardData {
  id: number;
  question: string;
  answer: string;
}

export default function LearnPage() {
  const { user, loading: authLoading } = useUser();
  const {
    fc_limit,
    fc_current,
    loading: limitsLoading,
    error: limitsError,
    refetchLimits,
  } = useUserLimits();

  const [prompt, setPrompt] = useState('');
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pdfJsApi, setPdfJsApi] = useState<typeof import('pdfjs-dist') | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef<number>(0);

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

  const processPdfFile = async (file: File) => {
    if (!pdfJsApi) {
      setError('PDF library is still loading. Please try again in a moment.');
      return;
    }
    setIsLoading(true);
    setPrompt('Processing PDF...');
    setError(null);

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
  };

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
        body: JSON.stringify({ prompt, userId: user.id }),
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
          id: Date.now() + index,
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
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        await processPdfFile(file);
      } else {
        setError('Invalid file type. Please drop a PDF file.');
      }
    } else {
      setError('No file dropped.');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        await processPdfFile(file);
      } else {
        setError('Invalid file type. Please select a PDF file.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError('No file selected.');
    }
  };

  const handleResetPrompt = () => {
    setPrompt('');
    setError(null);
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <h2 className="text-xl font-semibold text-center text-slate-100">Loading user data...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black pt-20">
        <h2 className="text-xl font-semibold text-center text-slate-100">
          You have been logged out. Redirecting...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 max-w-2xl mx-auto pt-6 pb-12 px-4">
      {limitsLoading ? (
        <div className="mb-8 p-4 text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Limits</h1>
          <p className="text-slate-400">Loading limits...</p>
        </div>
      ) : limitsError ? (
        <div className="mb-8 p-4 border border-red-700 bg-red-900 text-red-300 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-white mb-2">Limits Error</h1>
          <p>Could not load usage limits: {limitsError.message}</p>
          <p>Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      ) : (
        <div className="mb-8 p-4 border border-gray-700 bg-gray-900 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-white mb-2">Limits</h1>
          {fc_limit !== undefined && fc_current !== undefined && (
            <p className="text-slate-300">
              Used: {fc_current} / {fc_limit}
            </p>
          )}
        </div>
      )}

      <>
        <h1 className="text-center mb-8 text-4xl font-bold text-white">Generate Flashcards</h1>
        <h2 className="text-center mb-2 text-[0.8rem] text-slate-400">
          AI can make mistakes, so please verify important information.
        </h2>

        <h2 className="text-center mb-2 text-[0.8rem] text-slate-400">
          Gemini API collects input data to improve its performance.
        </h2>

        <div
          className={`relative mb-2 rounded-lg transition-all duration-200 ease-in-out `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter text or drop a PDF file here to create flashcards..."
            rows={6}
            className={`w-full p-3 text-base bg-gray-800 text-slate-100 rounded-lg box-border resize-vertical shadow-inner transition-all duration-200 ease-in-out placeholder-slate-500 ${
              isDraggingOver
                ? 'opacity-30 border border-gray-600 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50'
                : 'opacity-100 border border-gray-600 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50'
            }`}
            disabled={isLoading}
          />
          {isDraggingOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-100 pointer-events-none rounded-lg">
              <p className="m-0 text-lg font-bold">Drag and drop files here</p>
              <p className="mt-2 text-sm">only PDF-files are supported</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-6">
          <button
            onClick={handleChooseFileClick}
            disabled={isLoading}
            className="w-full text-center py-2 px-4 border border-gray-600 text-slate-300 rounded-md hover:bg-gray-800 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
            Choose PDF File
          </button>
          <button
            onClick={handleResetPrompt}
            disabled={isLoading}
            className="w-full text-center py-2 px-4 border border-red-500 text-red-300 rounded-md hover:bg-red-700 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
            Reset Text
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
          style={{ display: 'none' }}
          disabled={isLoading}
        />

        <button
          onClick={handleGenerateFlashcards}
          disabled={
            isLoading ||
            !!error ||
            !!limitsError ||
            (fc_current !== undefined &&
              fc_limit !== undefined &&
              fc_current >= fc_limit &&
              !isLoading) ||
            limitsLoading
          }
          className="block w-full py-3 px-5 text-lg font-semibold bg-white text-black rounded-lg transition-colors duration-200 ease-in-out hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed">
          {isLoading ? 'Generating...' : 'Generate Flashcards'}
        </button>

        {error && (
          <div className="mt-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}

        <div className="mt-10">
          <FlashList flashcards={flashcards} isShowingInteractionButtons={false} />
        </div>
      </>
    </div>
  );
}
