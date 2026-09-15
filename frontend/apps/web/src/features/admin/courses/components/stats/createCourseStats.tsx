import { BookOpen, Clock3, FileText, ShieldCheck } from "lucide-react";
import type { Course } from "@repo/types";

export const createCourseStats = ({
  rows,
  total,
}: {
  rows: Course[];
  total: number;
}) => [
  {
    icon: <BookOpen color="#059669" size={20} />,
    label: "Total Courses",
    value: total,
  },
  {
    icon: <ShieldCheck color="#059669" size={20} />,
    label: "Active Courses",
    value: rows.filter((row) => row.status === "ACTIVE").length,
  },
  {
    icon: <FileText color="#C2410C" size={20} />,
    label: "Draft Courses",
    value: rows.filter((row) => row.status === "DRAFT").length,
  },
  {
    icon: <Clock3 color="#64748B" size={20} />,
    label: "Archived Courses",
    value: rows.filter((row) => row.status === "ARCHIVED").length,
  },
];
