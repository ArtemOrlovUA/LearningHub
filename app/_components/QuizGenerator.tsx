'use client';

import { useState, DragEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { User } from '@supabase/supabase-js';

interface QuizGeneratorProps {
  user: User | null | undefined;
  q_limit: number | undefined;
  q_current: number | undefined;
  limitsLoading: boolean;
  limitsError: Error | null;
  refetchLimits: (() => Promise<void>) | undefined;
}

export function QuizGenerator({
  user,
  q_limit,
  q_current,
  limitsLoading,
  limitsError,
  refetchLimits,
}: QuizGeneratorProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [quizName, setQuizName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizGenerated, setQuizGenerated] = useState(false);
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

  const handleGenerateQuiz = async () => {
    if (!prompt.trim()) {
      setError('Please enter some text or drop a PDF to generate a quiz.');
      return;
    }
    if (!user || !user.id) {
      setError('User not found. Please log in again.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setQuizName('');
    setQuizGenerated(false);

    try {
      const response = await fetch('/api/gemini/quiz', {
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
      const quizData: string[] = JSON.parse(data.text);

      if (quizData.length > 0) {
        setQuizName(quizData[0]);
        setQuizGenerated(true);
      }

      if (refetchLimits) {
        await refetchLimits();
      }
    } catch (err: unknown) {
      console.error('Failed to generate quiz:', err);
      if (err instanceof Error) {
        setError('Failed to generate quiz. Please try again.');
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

  const handleGoToMyQuizzes = () => {
    router.push('/my-quizzes');
  };

  return (
    <>
      <h1 className="text-center mb-8 text-4xl font-bold text-white">Generate Quiz</h1>
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
          placeholder="Enter text or drop a PDF file here to create a quiz..."
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
        onClick={handleGenerateQuiz}
        disabled={
          isLoading ||
          !!limitsError ||
          (q_current !== undefined &&
            q_limit !== undefined &&
            q_current >= q_limit &&
            !isLoading) ||
          limitsLoading
        }
        className="block w-full py-3 px-5 text-lg font-semibold bg-white text-black rounded-lg transition-colors duration-200 ease-in-out hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed">
        {isLoading ? 'Generating...' : 'Generate Quiz'}
      </button>

      {error && (
        <div className="mt-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {quizGenerated && quizName && (
        <div className="mt-10 text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">Quiz Generated Successfully!</h2>
            <p className="text-lg">Quiz: &ldquo;{quizName}&rdquo;</p>
            <p className="text-sm mt-2">Your quiz has been saved and is ready for practice.</p>
          </div>
          <button
            onClick={handleGoToMyQuizzes}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out">
            Go to My Quizzes
          </button>
        </div>
      )}
    </>
  );
}
