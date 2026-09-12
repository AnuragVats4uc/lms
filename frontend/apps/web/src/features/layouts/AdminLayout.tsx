"use client";

import WorkspaceLayout from "./WorkspaceLayout";
import { adminNavigation } from "./navigation";

export const AdminLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <WorkspaceLayout
      navigation={adminNavigation}
      title="Admin"
      workspace="admin"
    >
      {children}
    </WorkspaceLayout>
  );
}
