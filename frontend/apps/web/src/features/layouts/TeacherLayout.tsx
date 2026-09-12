"use client";

import WorkspaceLayout from "./WorkspaceLayout";
import { teacherNavigation } from "./navigation";

export const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <WorkspaceLayout
      navigation={teacherNavigation}
      title="Teacher"
      workspace="teacher"
    >
      {children}
    </WorkspaceLayout>
  );
};
