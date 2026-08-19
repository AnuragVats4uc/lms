export const RESOURCE_TYPE_IDS = {
  DOCUMENT: 1,
  VIDEO: 2,
  EXAM: 3,
} as const;

export const RESOURCE_TYPE_CODES = {
  DOCUMENT: 'DOCUMENT',
  VIDEO: 'VIDEO',
  EXAM: 'EXAM',
} as const;

export type ResourceTypeId =
  (typeof RESOURCE_TYPE_IDS)[keyof typeof RESOURCE_TYPE_IDS];

export type ResourceTypeCode =
  (typeof RESOURCE_TYPE_CODES)[keyof typeof RESOURCE_TYPE_CODES];

export const RESOURCE_TYPE_ID_VALUES = Object.values(RESOURCE_TYPE_IDS);
