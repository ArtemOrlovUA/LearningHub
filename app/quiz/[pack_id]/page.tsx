import { getQuizByPackId } from '@/app/actions/quizActions';
import type { Metadata } from 'next';
import Quiz from '../../_components/Quiz';
import StoreProvider from '@/app/utils/StoreProvider';

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const result = await getQuizByPackId(resolvedParams.pack_id);
  const quizName = result.data?.[0]?.quiz_name || 'Quiz';
  return {
    title: `Quiz: ${quizName}`,
    description: `Take the quiz: ${quizName}`,
  };
}

interface QuizPageProps {
  params: Promise<{
    pack_id: string;
  }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const resolvedParams = await params;
  const { pack_id } = resolvedParams;
  const result = await getQuizByPackId(pack_id);

  if (!result.success || !result.data) {
    return (
      <div className="max-w-3xl mx-auto my-10 px-4 text-white text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-lg mb-6">{result.message}</p>
      </div>
    );
  }

  const quizName = result.data?.[0]?.quiz_name;

  return (
    <div className="max-w-3xl mx-auto my-10 px-4 text-white">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center">{quizName}</h1>
      </header>
      <StoreProvider>
        <Quiz questions={result.data} />
      </StoreProvider>
    </div>
  );
}
