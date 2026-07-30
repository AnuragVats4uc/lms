import type { AvailabilityFilter } from "../types";

export const availabilityOptions: Array<{
  label: string;
  value: AvailabilityFilter;
}> = [
  { label: "Website Available", value: "website" },
  { label: "Email Available", value: "email" },
  { label: "Phone Available", value: "phone" },
  { label: "Has Logo", value: "logo" },
  { label: "Has Administrator Assigned", value: "administrator" },
  { label: "Has Active Courses", value: "courses" },
  { label: "Has Active Students", value: "students" },
];
