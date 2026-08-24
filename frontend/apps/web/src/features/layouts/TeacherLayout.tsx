"use client";

import WorkspaceLayout from "./WorkspaceLayout";
import { teacherNavigation } from "./navigation";

export function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceLayout
      navigation={teacherNavigation}
      title="Teacher"
      workspace="teacher"
    >
      {children}
    </WorkspaceLayout>
  );
}
