import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  aggregateReportPerformance,
  attainableMaximumScore,
  attainableMaximumScoreByGroup,
  calculateReportOpportunity,
  classifyReportAnswer,
  examReportResultStatus,
  summarizeReportAnswers,
} from '../src/modules/exam/reporting/exam-report-metrics';

void test('calculates recoverable marks and the remaining pass gap', () => {
  const result = calculateReportOpportunity(
    [
      {
        answer: {
          textAnswer: 'wrong',
          numericAnswer: null,
          selectedOptions: [],
          isCorrect: false,
        },
        marksAwarded: -0.25,
        maximumMarks: 2,
      },
      { answer: null, marksAwarded: 0, maximumMarks: 3 },
      {
        answer: {
          textAnswer: 'right',
          numericAnswer: null,
          selectedOptions: [],
          isCorrect: true,
        },
        marksAwarded: 5,
        maximumMarks: 5,
      },
    ],
    4.75,
    10,
    60,
  );

  assert.deepEqual(result, {
    incorrectQuestionMarks: 2,
    unansweredQuestionMarks: 3,
    negativeMarksDeducted: 0.25,
    passingScore: 6,
    marksToPass: 1.25,
  });
});

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
    completionRate: 0,
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
  assert.equal(summary.completionRate, 50);
});

void test('classifies pass status only when a threshold is configured', () => {
  assert.equal(examReportResultStatus(89, null), 'NOT_CONFIGURED');
  assert.equal(examReportResultStatus(49.99, 50), 'FAILED');
  assert.equal(examReportResultStatus(50, 50), 'PASSED');
});

void test('uses the attainable maximum when a section limits attempts', () => {
  assert.equal(attainableMaximumScore([5, 4, 3, 2], 2), 9);
  assert.equal(attainableMaximumScore([5, 4, 3, 2], null), 14);
});

void test('sums attainable maximums independently across sections', () => {
  const result = attainableMaximumScoreByGroup([
    { groupKey: 'section:1', marks: 5, questionsToAttempt: 2 },
    { groupKey: 'section:1', marks: 4, questionsToAttempt: 2 },
    { groupKey: 'section:1', marks: 1, questionsToAttempt: 2 },
    { groupKey: 'section:2', marks: 3, questionsToAttempt: 1 },
    { groupKey: 'section:2', marks: 2, questionsToAttempt: 1 },
  ]);

  assert.equal(result.get('section:1'), 9);
  assert.equal(result.get('section:2'), 3);
  assert.equal(
    [...result.values()].reduce((total, value) => total + value),
    12,
  );
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
    averageTimePerQuestion: 17.5,
    averageTimePerAttemptedQuestion: 35,
    total: 2,
    answered: 1,
    attempted: 1,
    unanswered: 1,
    unattempted: 1,
    correct: 1,
    incorrect: 0,
    accuracy: 100,
    completionRate: 50,
  });
});
