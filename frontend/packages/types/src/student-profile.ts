import type { StudentStatus } from "./user";

export interface StudentProfilePreferences {
  id: number;
  uuid: string;
  studentId: number;
  timezone: string;
  language: string;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  examReminders: boolean;
  resourceUpdates: boolean;
  announcementNotifications: boolean;
  securityAlerts: boolean;
  examReminderOffsetsMinutes: number[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentSelfProfile {
  account: {
    id: number;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string | null;
    isVerified: boolean;
    lastLoginAt: string | null;
    verification: {
      account: "VERIFIED" | "UNVERIFIED";
      emailChangeAvailable: false;
      phoneChangeAvailable: false;
      note: string;
    };
  };
  student: {
    id: number;
    uuid: string;
    organizationId: number | null;
    studentCode: string;
    admissionNumber: string | null;
    rollNumber: string | null;
    status: StudentStatus;
    organization: {
      id: number;
      uuid: string;
      name: string;
      code: string;
    } | null;
  };
  profile: {
    firstName: string;
    lastName: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    alternatePhone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    avatar: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    updatedAt: string | null;
  };
  academic: {
    education: { uuid: string; name: string } | null;
    digitalLibraryLocation: { uuid: string; name: string } | null;
    enrollments: Array<{
      id: number;
      status: string;
      session: {
        id: number;
        uuid: string;
        name: string;
        code: string | null;
        status: string;
        startDate: string;
        endDate: string;
      };
      courses: Array<{
        enrollmentId: number;
        sessionCourseId: number;
        uuid: string;
        name: string;
        course: {
          id: number;
          uuid: string;
          code: string;
          name: string;
        };
      }>;
    }>;
  };
  preferences: StudentProfilePreferences;
  customRegistrationAnswers: Array<{
    fieldKey: string;
    label: string;
    fieldType: string | null;
    mapsTo: string | null;
    value: string | null;
    updatedAt: string;
  }>;
  profileCompleteness: {
    percentage: number;
    completedFields: number;
    totalFields: number;
    missingFields: string[];
  };
  fieldAccess: {
    studentEditable: string[];
    instituteManaged: string[];
  };
}

export interface UpdateMyStudentProfileRequest {
  firstName?: string;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  avatar?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export type UpdateMyStudentPreferencesRequest = Partial<
  Pick<
    StudentProfilePreferences,
    | "timezone"
    | "language"
    | "inAppNotifications"
    | "emailNotifications"
    | "examReminders"
    | "resourceUpdates"
    | "announcementNotifications"
    | "securityAlerts"
    | "examReminderOffsetsMinutes"
  >
>;

export interface ChangeMyStudentPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeMyStudentPasswordResponse {
  changed: true;
  reauthenticationRequired: true;
  revokedSessions: number;
  message: string;
}
