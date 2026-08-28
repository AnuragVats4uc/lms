import type {
  StudentExamAttempt,
  StudentExamAttemptQuestion,
} from "@repo/types";

export type QuestionDraft = {
  selectedOptionIds: number[];
  textAnswer: string;
  numericAnswer: string;
  markedForReview: boolean;
};

export type SaveState = "idle" | "saving" | "saved" | "error";

export type AttemptSlot = StudentExamAttempt["slots"][number];
export type AttemptSection = AttemptSlot["sections"][number];

export type SectionQuestion = {
  globalIndex: number;
  question: StudentExamAttemptQuestion;
};

export type SectionGroup = {
  key: string;
  position: number;
  slot: AttemptSlot;
  section: AttemptSection;
  questions: SectionQuestion[];
  locked: boolean;
};

export function draftFromQuestion(
  question: StudentExamAttemptQuestion,
): QuestionDraft {
  return {
    selectedOptionIds: question.state.selectedOptionIds,
    textAnswer: question.state.textAnswer,
    numericAnswer:
      question.state.numericAnswer === null
        ? ""
        : String(question.state.numericAnswer),
    markedForReview: question.state.markedForReview,
  };
}

export function draftHasAnswer(draft: QuestionDraft) {
  return (
    draft.selectedOptionIds.length > 0 ||
    draft.numericAnswer.trim() !== "" ||
    draft.textAnswer.trim() !== ""
  );
}

export function parseNumericDraft(
  value: string,
): { valid: true; value: number | null } | { valid: false; value: null } {
  const normalized = value.trim();
  if (!normalized) return { valid: true, value: null };
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return { valid: false, value: null };
  }
  const decimalPlaces = normalized.split(".")[1]?.length ?? 0;
  const numericValue = Number(normalized);
  if (decimalPlaces > 6 || !Number.isFinite(numericValue)) {
    return { valid: false, value: null };
  }
  return { valid: true, value: numericValue };
}

export function attainableMaximumMarks(
  marks: number[],
  questionsToAttempt?: number | null,
) {
  const normalized = marks.map(Number).filter(Number.isFinite);
  const limit = questionsToAttempt
    ? Math.min(questionsToAttempt, normalized.length)
    : normalized.length;
  return normalized
    .sort((left, right) => right - left)
    .slice(0, limit)
    .reduce((total, value) => total + value, 0);
}
