"use client";

import { OrganizationsPage } from "@/features/admin/organizations/page/OrganizationsPage";
import { RoleGuard } from "@/features/guards/RoleGuard";

export default function Page() {
  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <OrganizationsPage />
    </RoleGuard>
  );
}
