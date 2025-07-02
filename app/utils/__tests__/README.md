# Quiz Slice Unit Tests

This directory contains comprehensive unit tests for the `quizSlice` Redux reducer.

## Test Coverage

The test suite covers all three actions and various edge cases:

### Actions Tested:

- **startQuiz**: Initializes quiz state with questions
- **answerQuestion**: Handles user answers and score calculation
- **resetQuiz**: Resets state to initial values

### Test Categories:

1. **Initial State**: Verifies default state
2. **State Transitions**: Tests all reducer actions
3. **Edge Cases**: Single question quizzes, empty answers, whitespace handling
4. **State Immutability**: Ensures Redux state immutability principles
5. **Score Calculation**: Correct and incorrect answer handling
6. **Case Sensitivity**: Answer comparison logic

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```
