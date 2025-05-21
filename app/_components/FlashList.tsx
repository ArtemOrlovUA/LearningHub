import Flashcard from './Flashcard';

interface FlashcardData {
  id: number;
  question: string;
  answer: string;
}

interface FlashListProps {
  flashcards: FlashcardData[];
}

export default function FlashList({ flashcards }: FlashListProps) {
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center text-slate-400 mt-8">
        No flashcards to display. Generate some flashcards to get started!
      </div>
    );
  }

  return (
    <div>
      {flashcards.map((card) => (
        <Flashcard key={card.id} fc_id={card.id} question={card.question} answer={card.answer} />
      ))}
    </div>
  );
}
