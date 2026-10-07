import type { RegistrationFormState } from "./types";

export const INITIAL_REGISTRATION_FORM: RegistrationFormState = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  educationOptionUuid: "",
  digitalLibraryLocationUuid: "",
  customAnswers: {},
  selectedSessionCourseUuids: [],
};

export const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
] as const;
