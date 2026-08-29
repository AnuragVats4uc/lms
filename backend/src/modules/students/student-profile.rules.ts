export interface StudentProfileCompletenessInput {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export function studentProfileCompleteness(
  input: StudentProfileCompletenessInput,
) {
  const fields = [
    ['firstName', input.firstName],
    ['lastName', input.lastName],
    ['dateOfBirth', input.dateOfBirth],
    ['gender', input.gender],
    ['phone', input.phone],
    ['city', input.city],
    ['state', input.state],
    ['postalCode', input.postalCode],
    ['guardianName', input.guardianName],
    ['guardianPhone', input.guardianPhone],
    ['emergencyContactName', input.emergencyContactName],
    ['emergencyContactPhone', input.emergencyContactPhone],
  ] as const;
  const missingFields = fields
    .filter(([, value]) => !hasProfileValue(value))
    .map(([key]) => key);

  return {
    percentage: Math.round(
      ((fields.length - missingFields.length) / fields.length) * 100,
    ),
    completedFields: fields.length - missingFields.length,
    totalFields: fields.length,
    missingFields,
  };
}

export function isSupportedTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function normalizeReminderOffsets(offsets: number[]) {
  return [...new Set(offsets)].sort((left, right) => right - left);
}

function hasProfileValue(value: unknown) {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
}
