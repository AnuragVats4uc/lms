"use client";

import { ProtectedRoute } from "@repo/auth";

import { RoleGuard } from "@/features/guards/RoleGuard";
import { AdminLayout } from "@/features/layouts/AdminLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <AdminLayout>{children}</AdminLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
