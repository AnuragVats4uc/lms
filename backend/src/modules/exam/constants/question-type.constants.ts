export const QUESTION_TYPE_IDS = {
  SINGLE_CHOICE: 1,
  NUMERIC: 2,
  ONE_WORD: 3,
} as const;

export const QUESTION_TYPE_CODES = {
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  NUMERIC: 'NUMERIC',
  ONE_WORD: 'ONE_WORD',
} as const;

export type QuestionTypeCode =
  (typeof QUESTION_TYPE_CODES)[keyof typeof QUESTION_TYPE_CODES];
