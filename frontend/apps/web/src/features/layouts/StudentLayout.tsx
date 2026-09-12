"use client";

import WorkspaceLayout  from "./WorkspaceLayout";
import { studentNavigation } from "./navigation";

export const StudentLayout = ({
  children,
}: {
  children: React.ReactNode;
})  =>{
  return (
    <WorkspaceLayout
      navigation={studentNavigation}
      title="Student"
      workspace="student"
    >
      {children}
    </WorkspaceLayout>
  );
}
