"use client";

import { RoleGuard } from "@/features/guards/RoleGuard";
import { TeacherLayout } from "@/features/layouts/TeacherLayout";

export default function TeacherRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["TEACHER"]}>
      <TeacherLayout>{children}</TeacherLayout>
    </RoleGuard>
  );
}
