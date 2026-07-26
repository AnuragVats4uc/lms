"use client";

import WorkspaceLayout from "./WorkspaceLayout";
import { adminNavigation } from "./navigation";

export function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceLayout
      navigation={adminNavigation}
      title="Admin"
    >
      {children}
    </WorkspaceLayout>
  );
}
