"use client";

import { ProtectedRoute } from "@repo/auth";

import { RoleGuard } from "@/features/guards/RoleGuard";
import { StudentLayout } from "@/features/layouts/StudentLayout";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["STUDENT"]}>
        <StudentLayout>{children}</StudentLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
};

export default Layout;
