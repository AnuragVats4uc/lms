import assert from 'node:assert/strict';
import { test } from 'node:test';

import { studentExamAnswerValidationError } from '../src/modules/exam/rules/student-exam-answer.rules';

void test('accepts only one option for a single-choice answer', () => {
  assert.equal(
    studentExamAnswerValidationError('SINGLE_CHOICE', {
      selectedOptionIds: [10],
    }),
    null,
  );
  assert.equal(
    studentExamAnswerValidationError('SINGLE_CHOICE', {
      selectedOptionIds: [10, 11],
    }),
    'Select only one answer option',
  );
  assert.equal(
    studentExamAnswerValidationError('SINGLE_CHOICE', {
      selectedOptionIds: [10],
      textAnswer: 'unexpected',
    }),
    'Single-choice questions only accept an option answer',
  );
});

void test('rejects cross-type numeric and one-word payloads', () => {
  assert.equal(
    studentExamAnswerValidationError('NUMERIC', {
      selectedOptionIds: [],
      textAnswer: '42',
    }),
    'Numeric questions only accept a numeric answer',
  );
  assert.equal(
    studentExamAnswerValidationError('ONE_WORD', {
      selectedOptionIds: [],
      numericAnswer: 42,
    }),
    'One-word questions only accept a text answer',
  );
});

void test('rejects unsupported question types', () => {
  assert.equal(
    studentExamAnswerValidationError('MULTIPLE_CHOICE', {
      selectedOptionIds: [],
    }),
    'This question type is not supported',
  );
});
