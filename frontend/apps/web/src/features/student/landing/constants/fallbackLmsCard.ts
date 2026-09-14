import type { StudentLandingCard } from "@repo/types";

import { STUDENT_DASHBOARD_PATH } from "@/features/auth/routes";

export const fallbackLmsCard: StudentLandingCard = {
  id: 0,
  uuid: "00000000-0000-4000-8000-000000000000",
  organizationId: 0,
  type: "SYSTEM_LMS",
  systemKey: "LMS",
  title: "LMS",
  description:
    "Access courses, exams, learning resources and your academic progress.",
  ctaLabel: "Go to LMS",
  destinationUrl: STUDENT_DASHBOARD_PATH,
  imageUrl: null,
  imageAlt: "Illustration of academic dashboard resources and progress",
  openInNewTab: false,
  displayOrder: 0,
  isActive: true,
  createdAt: "",
  updatedAt: "",
  deletedAt: null,
};
