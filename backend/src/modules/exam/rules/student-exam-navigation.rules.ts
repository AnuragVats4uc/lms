export type StudentExamNavigationQuestion = {
  id: number;
  order: number;
  slotAttemptId: number;
  sectionAttemptId: number;
  slotNavigationMode: string;
  sectionNavigationMode: string;
  visitedAt?: Date | null;
  lastViewedAt?: Date | null;
};

export function studentExamNavigationError(
  questions: StudentExamNavigationQuestion[],
  targetQuestionId: number,
) {
  const ordered = [...questions].sort(
    (left, right) => left.order - right.order,
  );
  const target = ordered.find((question) => question.id === targetQuestionId);
  if (!target) return 'Question not found';

  const latest = ordered
    .filter((question) => question.lastViewedAt || question.visitedAt)
    .sort(
      (left, right) => navigationTimestamp(right) - navigationTimestamp(left),
    )[0];
  const current = latest ?? ordered[0];
  if (!current) return null;

  if (current.slotNavigationMode === 'SEQUENTIAL') {
    const error = sequentialScopeError(
      ordered.filter(
        (question) => question.slotAttemptId === current.slotAttemptId,
      ),
      target,
    );
    if (error) return 'This slot requires sequential question navigation';
  }

  if (current.sectionNavigationMode === 'SEQUENTIAL') {
    const error = sequentialScopeError(
      ordered.filter(
        (question) => question.sectionAttemptId === current.sectionAttemptId,
      ),
      target,
    );
    if (error) return 'This section requires sequential question navigation';
  }

  return null;
}

function sequentialScopeError(
  scopeQuestions: StudentExamNavigationQuestion[],
  target: StudentExamNavigationQuestion,
) {
  const firstOrder = Math.min(
    ...scopeQuestions.map((question) => question.order),
  );
  const visitedOrders = scopeQuestions
    .filter((question) => question.visitedAt || question.lastViewedAt)
    .map((question) => question.order);
  const frontier = visitedOrders.length
    ? Math.max(...visitedOrders)
    : firstOrder - 1;
  return target.order < frontier || target.order > frontier + 1;
}

function navigationTimestamp(question: StudentExamNavigationQuestion) {
  return Math.max(
    question.lastViewedAt?.getTime() ?? 0,
    question.visitedAt?.getTime() ?? 0,
  );
}
