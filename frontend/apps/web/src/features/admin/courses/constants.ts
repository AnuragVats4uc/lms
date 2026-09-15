import type { CourseForm } from "./types";

export const initialCourseForm: CourseForm = {
  description: "",
  discount: "",
  durationInDays: "",
  name: "",
  price: "",
  status: "DRAFT",
  thumbnail: "",
};

export const courseStatusOptions = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

export const courseFormStatusOptions = courseStatusOptions.filter(
  ({ value }) => value !== "ALL",
);
