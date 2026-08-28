import { QUESTION_TYPE_CODES } from '../constants/question-type.constants';

export type StudentExamAnswerPayload = {
  selectedOptionIds: number[];
  textAnswer?: string | null;
  numericAnswer?: number | null;
};

export function studentExamAnswerValidationError(
  questionTypeCode: string,
  payload: StudentExamAnswerPayload,
) {
  const hasTextAnswer = Boolean(payload.textAnswer?.trim());
  const hasNumericAnswer =
    payload.numericAnswer !== null && payload.numericAnswer !== undefined;

  if (questionTypeCode === QUESTION_TYPE_CODES.SINGLE_CHOICE) {
    if (payload.selectedOptionIds.length > 1) {
      return 'Select only one answer option';
    }
    if (hasTextAnswer || hasNumericAnswer) {
      return 'Single-choice questions only accept an option answer';
    }
    return null;
  }

  if (payload.selectedOptionIds.length) {
    return 'Options are not accepted for this question type';
  }
  if (questionTypeCode === QUESTION_TYPE_CODES.NUMERIC) {
    return hasTextAnswer
      ? 'Numeric questions only accept a numeric answer'
      : null;
  }
  if (questionTypeCode === QUESTION_TYPE_CODES.ONE_WORD) {
    return hasNumericAnswer
      ? 'One-word questions only accept a text answer'
      : null;
  }
  return 'This question type is not supported';
}
