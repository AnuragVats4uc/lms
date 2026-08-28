export type ReportAnswerLike = {
  textAnswer: string | null;
  numericAnswer: unknown | null;
  selectedOptions: unknown[];
  isCorrect?: boolean | null;
};

export type ReportAnswerState = 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED';
export type ExamReportResultStatus = 'PASSED' | 'FAILED' | 'NOT_CONFIGURED';

export type ReportPerformanceItem = {
  groupKey: string;
  groupLabel: string;
  metadata?: Record<string, string | number | null>;
  marksAwarded: number;
  maximumMarks: number;
  timeSpentSeconds: number;
  answer: ReportAnswerLike | null;
};

export type ReportOpportunityItem = {
  answer: ReportAnswerLike | null;
  marksAwarded: number;
  maximumMarks: number;
};

export function reportAnswerHasValue(answer: ReportAnswerLike | null) {
  if (!answer) return false;
  return (
    answer.selectedOptions.length > 0 ||
    answer.numericAnswer !== null ||
    Boolean(answer.textAnswer?.trim())
  );
}

export function classifyReportAnswer(
  answer: ReportAnswerLike | null,
): ReportAnswerState {
  if (!reportAnswerHasValue(answer)) return 'UNATTEMPTED';
  return answer?.isCorrect === true ? 'CORRECT' : 'INCORRECT';
}

export function examReportResultStatus(
  percentage: number,
  passingPercentage: number | null,
): ExamReportResultStatus {
  if (passingPercentage === null) return 'NOT_CONFIGURED';
  return percentage >= passingPercentage ? 'PASSED' : 'FAILED';
}

export function summarizeReportAnswers(
  totalQuestions: number,
  answers: Array<ReportAnswerLike | null>,
) {
  const states = answers.map(classifyReportAnswer);
  const correct = states.filter((state) => state === 'CORRECT').length;
  const incorrect = states.filter((state) => state === 'INCORRECT').length;
  const attempted = correct + incorrect;
  const completionRate = totalQuestions
    ? Math.round((attempted / totalQuestions) * 10_000) / 100
    : 0;
  return {
    total: totalQuestions,
    answered: attempted,
    attempted,
    unanswered: Math.max(0, totalQuestions - attempted),
    unattempted: Math.max(0, totalQuestions - attempted),
    correct,
    incorrect,
    accuracy: attempted ? Math.round((correct / attempted) * 10_000) / 100 : 0,
    completionRate,
  };
}

export function attainableMaximumScore(
  marks: number[],
  questionsToAttempt?: number | null,
) {
  const normalized = marks.map((value) => Math.max(0, Number(value) || 0));
  const limit = questionsToAttempt
    ? Math.min(questionsToAttempt, normalized.length)
    : normalized.length;
  return normalized
    .sort((left, right) => right - left)
    .slice(0, limit)
    .reduce((total, value) => total + value, 0);
}

export function attainableMaximumScoreByGroup(
  items: Array<{
    groupKey: string;
    marks: number;
    questionsToAttempt?: number | null;
  }>,
) {
  const groups = new Map<
    string,
    { marks: number[]; questionsToAttempt?: number | null }
  >();

  for (const item of items) {
    const group = groups.get(item.groupKey) ?? {
      marks: [],
      questionsToAttempt: item.questionsToAttempt,
    };
    group.marks.push(item.marks);
    groups.set(item.groupKey, group);
  }

  return new Map(
    [...groups.entries()].map(([groupKey, group]) => [
      groupKey,
      attainableMaximumScore(group.marks, group.questionsToAttempt),
    ]),
  );
}

export function aggregateReportPerformance(items: ReportPerformanceItem[]) {
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      metadata?: Record<string, string | number | null>;
      marksAwarded: number;
      maximumMarks: number;
      timeSpentSeconds: number;
      answers: Array<ReportAnswerLike | null>;
    }
  >();

  for (const item of items) {
    const group = groups.get(item.groupKey) ?? {
      key: item.groupKey,
      label: item.groupLabel,
      metadata: item.metadata,
      marksAwarded: 0,
      maximumMarks: 0,
      timeSpentSeconds: 0,
      answers: [],
    };
    group.marksAwarded += item.marksAwarded;
    group.maximumMarks += item.maximumMarks;
    group.timeSpentSeconds += item.timeSpentSeconds;
    group.answers.push(item.answer);
    groups.set(item.groupKey, group);
  }

  return [...groups.values()].map((group) => {
    const summary = summarizeReportAnswers(group.answers.length, group.answers);
    return {
      key: group.key,
      label: group.label,
      ...group.metadata,
      marksAwarded: group.marksAwarded,
      maximumMarks: group.maximumMarks,
      percentage: group.maximumMarks
        ? Math.round((group.marksAwarded / group.maximumMarks) * 10_000) / 100
        : 0,
      timeSpentSeconds: group.timeSpentSeconds,
      averageTimePerQuestion: group.answers.length
        ? Math.round((group.timeSpentSeconds / group.answers.length) * 100) /
          100
        : 0,
      averageTimePerAttemptedQuestion: summary.attempted
        ? Math.round((group.timeSpentSeconds / summary.attempted) * 100) / 100
        : 0,
      ...summary,
    };
  });
}

export function calculateReportOpportunity(
  items: ReportOpportunityItem[],
  score: number,
  maximumScore: number,
  passingPercentage: number | null,
) {
  const round = (value: number) => Math.round(value * 100) / 100;
  const incorrect = items.filter(
    (item) => classifyReportAnswer(item.answer) === 'INCORRECT',
  );
  const unanswered = items.filter(
    (item) => classifyReportAnswer(item.answer) === 'UNATTEMPTED',
  );
  const passingScore =
    passingPercentage === null
      ? null
      : round((maximumScore * passingPercentage) / 100);

  return {
    incorrectQuestionMarks: round(
      incorrect.reduce((total, item) => total + item.maximumMarks, 0),
    ),
    unansweredQuestionMarks: round(
      unanswered.reduce((total, item) => total + item.maximumMarks, 0),
    ),
    negativeMarksDeducted: round(
      items.reduce(
        (total, item) => total + Math.max(0, -item.marksAwarded),
        0,
      ),
    ),
    passingScore,
    marksToPass:
      passingScore === null ? null : round(Math.max(0, passingScore - score)),
  };
}
