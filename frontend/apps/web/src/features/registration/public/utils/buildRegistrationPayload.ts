import type { RegistrationFormState } from "../types";

export const buildRegistrationPayload = (form: RegistrationFormState) => {
  const [firstName, ...lastNameParts] = form.fullName.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" ") || undefined,
    gender: form.gender,
    dateOfBirth: form.dateOfBirth,
    phone: form.phone.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    educationOptionUuid: form.educationOptionUuid,
    digitalLibraryLocationUuid: form.digitalLibraryLocationUuid,
    customAnswers: form.customAnswers,
    selectedSessionCourseUuids: form.selectedSessionCourseUuids,
  };
};
