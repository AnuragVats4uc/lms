"use client";

import { rolesApi } from "@repo/api";

import { DomainListPage } from "../components/DomainListPage";

export function RolesPage() {
  return (
    <DomainListPage
      title="Roles"
      description="RBAC roles and assigned permission counts."
      queryKey={["admin", "roles", 1, 10]}
      queryFn={() => rolesApi.findAll({ page: 1, limit: 10 })}
      emptyLabel="No roles found."
      fields={[
        { label: "Name", render: (item) => item.name },
        { label: "Code", render: (item) => item.code },
        {
          label: "Permissions",
          render: (item) => item.permissions?.length ?? 0,
        },
        {
          label: "Active",
          render: (item) => (item.isActive ? "Yes" : "No"),
        },
      ]}
    />
  );
}
