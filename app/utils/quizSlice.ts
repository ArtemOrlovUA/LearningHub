import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuizQuestion {
  question: string;
  answer: string;
  quiz_name: string;
}

interface UserAnswer {
  questionIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  isQuizOver: boolean;
  userAnswers: UserAnswer[];
}

const initialState: QuizState = {
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  isQuizOver: false,
  userAnswers: [],
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    startQuiz: (state, action: PayloadAction<QuizQuestion[]>) => {
      state.questions = action.payload;
      state.currentQuestionIndex = 0;
      state.score = 0;
      state.isQuizOver = false;
      state.userAnswers = [];
    },
    answerQuestion: (state, action: PayloadAction<{ answer: string }>) => {
      const currentQuestion = state.questions[state.currentQuestionIndex];
      const isCorrect =
        currentQuestion.answer.toLowerCase() === action.payload.answer.toLowerCase();

      // Store the user's answer
      state.userAnswers.push({
        questionIndex: state.currentQuestionIndex,
        userAnswer: action.payload.answer,
        correctAnswer: currentQuestion.answer,
        isCorrect,
      });

      if (isCorrect) {
        state.score += 1;
      }

      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      } else {
        state.isQuizOver = true;
      }
    },
    resetQuiz: () => initialState,
  },
});

export const { startQuiz, answerQuestion, resetQuiz } = quizSlice.actions;

export default quizSlice.reducer;
