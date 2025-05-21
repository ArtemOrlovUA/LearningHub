import { createClient } from '@/app/utils/server';
import { cookies } from 'next/headers';
import FlashList from '@/app/_components/FlashList';
import Link from 'next/link';

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  created_at: string;
  pack_id?: string;
}

interface FlashcardsSectionProps {
  userId: string;
}

export default async function FlashcardsSection({ userId }: FlashcardsSectionProps) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data, error: flashcardsError } = await supabase
    .from('flashcards')
    .select('id, question, answer, created_at, pack_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const flashcards: Flashcard[] | null = data;

  if (flashcardsError) {
    return (
      <p className="text-red-600 text-center mt-8">
        Error loading your flashcards. Please try refreshing the page.
      </p>
    );
  }

  if (flashcards && flashcards.length > 0) {
    return <FlashList flashcards={flashcards} />;
  }

  return (
    <p className="text-center mt-8 text-lg text-slate-300">
      You haven&apos;t created any flashcards yet. <br />
      Go to the{' '}
      <Link href="/learn" className="text-sky-400 hover:text-sky-300 font-medium">
        Learn page
      </Link>{' '}
      to generate some!
    </p>
  );
}
