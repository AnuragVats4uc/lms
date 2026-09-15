import { BookOpen, CalendarDays, Clock3, ShieldCheck } from "lucide-react";
import type { SessionCourse } from "@repo/types";

export const createSessionCourseStats = ({
  rows,
  total,
}: {
  rows: SessionCourse[];
  total: number;
}) => [
  {
    icon: <BookOpen color="#059669" size={20} />,
    label: "Total Assignments",
    value: total,
  },
  {
    icon: <ShieldCheck color="#059669" size={20} />,
    label: "Active Assignments",
    value: rows.filter((row) => row.status === "ACTIVE").length,
  },
  {
    icon: <CalendarDays color="#2563EB" size={20} />,
    label: "Published",
    value: rows.filter((row) => row.isPublished).length,
  },
  {
    icon: <Clock3 color="#64748B" size={20} />,
    label: "Archived",
    value: rows.filter((row) => row.status === "ARCHIVED").length,
  },
];
