"use client";

import WorkspaceLayout  from "./WorkspaceLayout";
import { studentNavigation } from "./navigation";

export function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceLayout
      navigation={studentNavigation}
      title="Student"
    >
      {children}
    </WorkspaceLayout>
  );
}
