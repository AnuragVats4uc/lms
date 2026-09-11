import type { PublicRegistrationPage } from "@repo/types";

import type { RegistrationFormState } from "../types";

export const validateRegistrationForm = (
  page: PublicRegistrationPage,
  form: RegistrationFormState,
) => {
  if (form.fullName.trim().length < 2) return "Student name is required.";
  if (!form.gender) return "Gender is required.";
  if (!form.email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Enter a valid email address.";
  }
  if (!form.phone.trim()) return "Mobile number is required.";
  if (!/^[+\d()\s-]{7,20}$/.test(form.phone.trim())) {
    return "Enter a valid mobile number.";
  }
  if (!form.dateOfBirth) return "Date of birth is required.";
  if (new Date(form.dateOfBirth).getTime() > Date.now()) {
    return "Date of birth cannot be in the future.";
  }
  if (form.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (form.password.length > 72) {
    return "Password must be 72 characters or fewer.";
  }
  if (form.password !== form.confirmPassword) {
    return "Password and confirm password must match.";
  }
  if (!form.educationOptionUuid) return "Education is required.";
  if (!form.digitalLibraryLocationUuid) {
    return "Digital Library Location is required.";
  }
  for (const field of page.fields) {
    if (field.isRequired && !form.customAnswers[field.fieldKey]) {
      return `${field.label} is required.`;
    }
  }
  if (!form.selectedSessionCourseUuids.length) {
    return "Select at least one course.";
  }
  return null;
};
