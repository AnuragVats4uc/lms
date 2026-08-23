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
