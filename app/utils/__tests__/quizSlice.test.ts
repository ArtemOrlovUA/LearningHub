import { describe, expect, test, beforeEach } from '@jest/globals';
import quizReducer, { startQuiz, answerQuestion, resetQuiz } from '../quizSlice';

// Mock data for testing
const mockQuestions = [
  {
    question: 'What is 2 + 2?',
    answer: 'A) 4',
    quiz_name: 'Math Quiz',
  },
  {
    question: 'What is the capital of France?',
    answer: 'B) Paris',
    quiz_name: 'Geography Quiz',
  },
  {
    question: 'Who wrote Romeo and Juliet?',
    answer: 'C) Shakespeare',
    quiz_name: 'Literature Quiz',
  },
];

const initialState = {
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  isQuizOver: false,
  userAnswers: [],
};

describe('quizSlice', () => {
  describe('initial state', () => {
    test('should return the initial state when called with undefined', () => {
      const result = quizReducer(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });
  });

  describe('startQuiz action', () => {
    test('should initialize quiz with provided questions', () => {
      const action = startQuiz(mockQuestions);
      const result = quizReducer(initialState, action);

      expect(result).toEqual({
        questions: mockQuestions,
        currentQuestionIndex: 0,
        score: 0,
        isQuizOver: false,
        userAnswers: [],
      });
    });

    test('should reset all state when starting a new quiz', () => {
      const previousState = {
        questions: [mockQuestions[0]],
        currentQuestionIndex: 2,
        score: 3,
        isQuizOver: true,
        userAnswers: [
          {
            questionIndex: 0,
            userAnswer: 'A) 4',
            correctAnswer: 'A) 4',
            isCorrect: true,
          },
        ],
      };

      const action = startQuiz(mockQuestions);
      const result = quizReducer(previousState, action);

      expect(result).toEqual({
        questions: mockQuestions,
        currentQuestionIndex: 0,
        score: 0,
        isQuizOver: false,
        userAnswers: [],
      });
    });

    test('should handle empty questions array', () => {
      const action = startQuiz([]);
      const result = quizReducer(initialState, action);

      expect(result).toEqual({
        questions: [],
        currentQuestionIndex: 0,
        score: 0,
        isQuizOver: false,
        userAnswers: [],
      });
    });
  });

  describe('answerQuestion action', () => {
    let stateWithQuestions: ReturnType<typeof quizReducer>;

    beforeEach(() => {
      stateWithQuestions = quizReducer(initialState, startQuiz(mockQuestions));
    });

    test('should record correct answer and increment score', () => {
      const action = answerQuestion({ answer: 'A) 4' });
      const result = quizReducer(stateWithQuestions, action);

      expect(result.score).toBe(1);
      expect(result.currentQuestionIndex).toBe(1);
      expect(result.isQuizOver).toBe(false);
      expect(result.userAnswers).toHaveLength(1);
      expect(result.userAnswers[0]).toEqual({
        questionIndex: 0,
        userAnswer: 'A) 4',
        correctAnswer: 'A) 4',
        isCorrect: true,
      });
    });

    test('should record incorrect answer without incrementing score', () => {
      const action = answerQuestion({ answer: 'B) 5' });
      const result = quizReducer(stateWithQuestions, action);

      expect(result.score).toBe(0);
      expect(result.currentQuestionIndex).toBe(1);
      expect(result.isQuizOver).toBe(false);
      expect(result.userAnswers).toHaveLength(1);
      expect(result.userAnswers[0]).toEqual({
        questionIndex: 0,
        userAnswer: 'B) 5',
        correctAnswer: 'A) 4',
        isCorrect: false,
      });
    });

    test('should handle case-insensitive answer comparison', () => {
      const action = answerQuestion({ answer: 'a) 4' }); // lowercase
      const result = quizReducer(stateWithQuestions, action);

      expect(result.score).toBe(1);
      expect(result.userAnswers[0].isCorrect).toBe(true);
    });

    test('should advance to next question on middle questions', () => {
      // Answer first question
      let state = quizReducer(stateWithQuestions, answerQuestion({ answer: 'A) 4' }));
      expect(state.currentQuestionIndex).toBe(1);
      expect(state.isQuizOver).toBe(false);

      // Answer second question
      state = quizReducer(state, answerQuestion({ answer: 'B) Paris' }));
      expect(state.currentQuestionIndex).toBe(2);
      expect(state.isQuizOver).toBe(false);
    });

    test('should end quiz on last question', () => {
      // Progress to last question
      let state = quizReducer(stateWithQuestions, answerQuestion({ answer: 'A) 4' }));
      state = quizReducer(state, answerQuestion({ answer: 'B) Paris' }));

      // Answer last question
      state = quizReducer(state, answerQuestion({ answer: 'C) Shakespeare' }));

      expect(state.currentQuestionIndex).toBe(2); // Should stay at last index
      expect(state.isQuizOver).toBe(true);
      expect(state.userAnswers).toHaveLength(3);
    });

    test('should accumulate multiple correct answers', () => {
      let state = stateWithQuestions;

      // Answer all questions correctly
      state = quizReducer(state, answerQuestion({ answer: 'A) 4' }));
      state = quizReducer(state, answerQuestion({ answer: 'B) Paris' }));
      state = quizReducer(state, answerQuestion({ answer: 'C) Shakespeare' }));

      expect(state.score).toBe(3);
      expect(state.userAnswers.every((answer) => answer.isCorrect)).toBe(true);
    });

    test('should handle mixed correct and incorrect answers', () => {
      let state = stateWithQuestions;

      // Mix of correct and incorrect answers
      state = quizReducer(state, answerQuestion({ answer: 'A) 4' })); // correct
      state = quizReducer(state, answerQuestion({ answer: 'A) London' })); // incorrect
      state = quizReducer(state, answerQuestion({ answer: 'C) Shakespeare' })); // correct

      expect(state.score).toBe(2);
      expect(state.userAnswers[0].isCorrect).toBe(true);
      expect(state.userAnswers[1].isCorrect).toBe(false);
      expect(state.userAnswers[2].isCorrect).toBe(true);
    });

    test('should store user answers in correct order', () => {
      let state = stateWithQuestions;

      state = quizReducer(state, answerQuestion({ answer: 'A) 4' }));
      state = quizReducer(state, answerQuestion({ answer: 'Wrong Answer' }));
      state = quizReducer(state, answerQuestion({ answer: 'C) Shakespeare' }));

      expect(state.userAnswers).toHaveLength(3);
      expect(state.userAnswers[0].questionIndex).toBe(0);
      expect(state.userAnswers[1].questionIndex).toBe(1);
      expect(state.userAnswers[2].questionIndex).toBe(2);
    });
  });

  describe('resetQuiz action', () => {
    test('should reset to initial state from any state', () => {
      // Create a state with data
      let state = quizReducer(initialState, startQuiz(mockQuestions));
      state = quizReducer(state, answerQuestion({ answer: 'A) 4' }));
      state = quizReducer(state, answerQuestion({ answer: 'B) Paris' }));

      // Reset quiz
      const result = quizReducer(state, resetQuiz());

      expect(result).toEqual(initialState);
    });

    test('should reset from quiz over state', () => {
      // Complete a full quiz
      let state = quizReducer(initialState, startQuiz(mockQuestions));
      state = quizReducer(state, answerQuestion({ answer: 'A) 4' }));
      state = quizReducer(state, answerQuestion({ answer: 'B) Paris' }));
      state = quizReducer(state, answerQuestion({ answer: 'C) Shakespeare' }));

      expect(state.isQuizOver).toBe(true);

      // Reset quiz
      const result = quizReducer(state, resetQuiz());

      expect(result).toEqual(initialState);
    });
  });

  describe('edge cases', () => {
    test('should handle single question quiz', () => {
      const singleQuestion = [mockQuestions[0]];
      let state = quizReducer(initialState, startQuiz(singleQuestion));

      // Answer the single question
      state = quizReducer(state, answerQuestion({ answer: 'A) 4' }));

      expect(state.currentQuestionIndex).toBe(0);
      expect(state.isQuizOver).toBe(true);
      expect(state.score).toBe(1);
      expect(state.userAnswers).toHaveLength(1);
    });

    test('should handle answering with whitespace differences', () => {
      const stateWithQuestions = quizReducer(initialState, startQuiz(mockQuestions));

      const action = answerQuestion({ answer: '  A) 4  ' });
      const result = quizReducer(stateWithQuestions, action);

      expect(result.userAnswers[0].isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });

    test('should handle empty answer string', () => {
      const stateWithQuestions = quizReducer(initialState, startQuiz(mockQuestions));

      const action = answerQuestion({ answer: '' });
      const result = quizReducer(stateWithQuestions, action);

      expect(result.userAnswers[0].isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.userAnswers[0].userAnswer).toBe('');
    });
  });

  describe('state immutability', () => {
    test('should not mutate the original state', () => {
      const originalState = { ...initialState };
      const action = startQuiz(mockQuestions);

      quizReducer(originalState, action);

      expect(originalState).toEqual(initialState);
    });

    test('should create new state objects', () => {
      const state1 = quizReducer(initialState, startQuiz(mockQuestions));
      const state2 = quizReducer(state1, answerQuestion({ answer: 'A) 4' }));

      expect(state1).not.toBe(state2);
      expect(state1.userAnswers).not.toBe(state2.userAnswers);
    });
  });
});
