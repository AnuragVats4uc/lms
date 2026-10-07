export type RegistrationFormState = {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  educationOptionUuid: string;
  digitalLibraryLocationUuid: string;
  customAnswers: Record<string, string>;
  selectedSessionCourseUuids: string[];
};
