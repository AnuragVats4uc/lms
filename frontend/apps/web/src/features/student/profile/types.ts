import type {
  StudentProfilePreferences,
  UpdateMyStudentProfileRequest,
} from "@repo/types";

export type ProfileTab =
  "overview" | "personal" | "academic" | "preferences" | "security";

export type ProfileForm = {
  [Field in keyof UpdateMyStudentProfileRequest]-?: NonNullable<
    UpdateMyStudentProfileRequest[Field]
  >;
};

export type PreferenceForm = Pick<
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
>;

export type ToastState = {
  id: number;
  title: string;
  message: string;
  tone: "success" | "error";
};

export type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
