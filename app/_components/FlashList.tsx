import Flashcard from './Flashcard';

interface FlashcardData {
  id: string | number;
  question: string;
  answer: string;
}

interface FlashListProps {
  flashcards: FlashcardData[];
}

export default function FlashList({ flashcards }: FlashListProps) {
  if (!flashcards || flashcards.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#718096', marginTop: '2rem' }}>
        No flashcards to display.
      </div>
    );
  }

  return (
    <div>
      {flashcards.map((card) => (
        <Flashcard key={card.id} question={card.question} answer={card.answer} />
      ))}
    </div>
  );
}
