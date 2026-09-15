import type { SessionCourseForm } from "./types";

export const initialSessionCourseForm: SessionCourseForm = {
  courseId: "",
  description: "",
  displayName: "",
  isPublished: false,
  sortOrder: "0",
  status: "DRAFT",
};
export const sessionCourseStatusOptions = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];
export const sessionCourseFormStatusOptions = sessionCourseStatusOptions.filter(
  ({ value }) => value !== "ALL",
);
