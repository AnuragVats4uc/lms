import type {
  StudentProfilePreferences,
  StudentSelfProfile,
} from "@repo/types";
import type { PreferenceForm, ProfileForm } from "../types";

export const emptyProfileForm: ProfileForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  alternatePhone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  avatar: "",
  guardianName: "",
  guardianPhone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export const emptyPreferenceForm: PreferenceForm = {
  timezone: "Asia/Kolkata",
  language: "en",
  inAppNotifications: true,
  emailNotifications: false,
  examReminders: true,
  resourceUpdates: true,
  announcementNotifications: true,
  securityAlerts: true,
  examReminderOffsetsMinutes: [1440, 60],
};

export const toProfileForm = (profile: StudentSelfProfile): ProfileForm => {
  return {
    firstName: profile.profile.firstName,
    lastName: profile.profile.lastName ?? "",
    dateOfBirth: profile.profile.dateOfBirth?.slice(0, 10) ?? "",
    gender: profile.profile.gender ?? "",
    alternatePhone: profile.profile.alternatePhone ?? "",
    address: profile.profile.address ?? "",
    city: profile.profile.city ?? "",
    state: profile.profile.state ?? "",
    postalCode: profile.profile.postalCode ?? "",
    avatar: profile.profile.avatar ?? "",
    guardianName: profile.profile.guardianName ?? "",
    guardianPhone: profile.profile.guardianPhone ?? "",
    emergencyContactName: profile.profile.emergencyContactName ?? "",
    emergencyContactPhone: profile.profile.emergencyContactPhone ?? "",
  };
};

export const toPreferenceForm = (
  preferences: StudentProfilePreferences,
): PreferenceForm => {
  return {
    timezone: preferences.timezone,
    language: preferences.language,
    inAppNotifications: preferences.inAppNotifications,
    emailNotifications: preferences.emailNotifications,
    examReminders: preferences.examReminders,
    resourceUpdates: preferences.resourceUpdates,
    announcementNotifications: preferences.announcementNotifications,
    securityAlerts: preferences.securityAlerts,
    examReminderOffsetsMinutes: preferences.examReminderOffsetsMinutes,
  };
};
