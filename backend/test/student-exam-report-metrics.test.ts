import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  aggregateReportPerformance,
  attainableMaximumScore,
  classifyReportAnswer,
  summarizeReportAnswers,
} from '../src/modules/exam/reporting/exam-report-metrics';

void test('does not classify a cleared saved answer as incorrect', () => {
  const cleared = {
    textAnswer: '   ',
    numericAnswer: null,
    selectedOptions: [],
    isCorrect: false,
  };

  assert.equal(classifyReportAnswer(cleared), 'UNATTEMPTED');
  assert.deepEqual(summarizeReportAnswers(2, [cleared, null]), {
    total: 2,
    answered: 0,
    attempted: 0,
    unanswered: 2,
    unattempted: 2,
    correct: 0,
    incorrect: 0,
    accuracy: 0,
  });
});

void test('calculates accuracy from attempted questions only', () => {
  const summary = summarizeReportAnswers(4, [
    {
      textAnswer: null,
      numericAnswer: null,
      selectedOptions: [{ id: 1 }],
      isCorrect: true,
    },
    {
      textAnswer: 'wrong',
      numericAnswer: null,
      selectedOptions: [],
      isCorrect: false,
    },
  ]);

  assert.equal(summary.correct, 1);
  assert.equal(summary.incorrect, 1);
  assert.equal(summary.unattempted, 2);
  assert.equal(summary.accuracy, 50);
});

void test('uses the attainable maximum when a section limits attempts', () => {
  assert.equal(attainableMaximumScore([5, 4, 3, 2], 2), 9);
  assert.equal(attainableMaximumScore([5, 4, 3, 2], null), 14);
});

void test('aggregates topic performance and keeps unanswered questions separate', () => {
  const result = aggregateReportPerformance([
    {
      groupKey: 'topic:1',
      groupLabel: 'Percentages',
      marksAwarded: 5,
      maximumMarks: 5,
      timeSpentSeconds: 30,
      answer: {
        textAnswer: 'answer',
        numericAnswer: null,
        selectedOptions: [],
        isCorrect: true,
      },
    },
    {
      groupKey: 'topic:1',
      groupLabel: 'Percentages',
      marksAwarded: 0,
      maximumMarks: 5,
      timeSpentSeconds: 5,
      answer: null,
    },
  ]);

  assert.deepEqual(result[0], {
    key: 'topic:1',
    label: 'Percentages',
    marksAwarded: 5,
    maximumMarks: 10,
    percentage: 50,
    timeSpentSeconds: 35,
    total: 2,
    answered: 1,
    attempted: 1,
    unanswered: 1,
    unattempted: 1,
    correct: 1,
    incorrect: 0,
    accuracy: 100,
  });
});
