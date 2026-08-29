export const registrationProfileMapTargets = [
  'alternatePhone',
  'address',
  'city',
  'state',
  'postalCode',
  'guardianName',
  'guardianPhone',
  'emergencyContactName',
  'emergencyContactPhone',
] as const;

export type RegistrationProfileMapTarget =
  (typeof registrationProfileMapTargets)[number];

export interface RegistrationAnswerField {
  id: number;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  mapsTo: string | null;
  options: Array<{ optionKey: string }>;
}

export interface NormalizedRegistrationAnswer {
  fieldId: number;
  fieldKey: string;
  mapsTo: RegistrationProfileMapTarget | null;
  value: string;
}

export type RegistrationProfilePatch = Partial<
  Record<RegistrationProfileMapTarget, string>
>;

const MAX_ANSWER_LENGTH = 5_000;

export class RegistrationAnswerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistrationAnswerValidationError';
  }
}

export function normalizeRegistrationAnswers(
  fields: RegistrationAnswerField[],
  rawAnswers: Record<string, unknown> | undefined,
): NormalizedRegistrationAnswer[] {
  const answers = rawAnswers ?? {};
  const fieldsByKey = new Map(fields.map((field) => [field.fieldKey, field]));

  for (const key of Object.keys(answers)) {
    if (!fieldsByKey.has(key)) {
      throw new RegistrationAnswerValidationError(
        `Unknown registration field: ${key}`,
      );
    }
  }

  return fields.flatMap((field) => {
    const rawValue = answers[field.fieldKey];

    if (rawValue !== undefined && typeof rawValue !== 'string') {
      throw new RegistrationAnswerValidationError(
        `${field.fieldKey} must be a text value`,
      );
    }

    const value = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (field.isRequired && !value) {
      throw new RegistrationAnswerValidationError(
        `${field.fieldKey} is required`,
      );
    }
    if (!value) {
      return [];
    }
    if (value.length > MAX_ANSWER_LENGTH) {
      throw new RegistrationAnswerValidationError(
        `${field.fieldKey} must not exceed ${MAX_ANSWER_LENGTH} characters`,
      );
    }

    if (
      (field.fieldType === 'SELECT' || field.fieldType === 'RADIO') &&
      !field.options.some((option) => option.optionKey === value)
    ) {
      throw new RegistrationAnswerValidationError(
        `${field.fieldKey} contains an invalid option`,
      );
    }

    return [
      {
        fieldId: field.id,
        fieldKey: field.fieldKey,
        mapsTo: isRegistrationProfileMapTarget(field.mapsTo)
          ? field.mapsTo
          : null,
        value,
      },
    ];
  });
}

export function buildRegistrationProfilePatch(
  answers: NormalizedRegistrationAnswer[],
): RegistrationProfilePatch {
  return answers.reduce<RegistrationProfilePatch>((patch, answer) => {
    if (answer.mapsTo) {
      patch[answer.mapsTo] = answer.value;
    }
    return patch;
  }, {});
}

export function isRegistrationProfileMapTarget(
  value: string | null | undefined,
): value is RegistrationProfileMapTarget {
  return registrationProfileMapTargets.includes(
    value as RegistrationProfileMapTarget,
  );
}
