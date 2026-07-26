"use client";

import { permissionsApi } from "@repo/api";

import { DomainListPage } from "../components/DomainListPage";

export function PermissionsPage() {
  return (
    <DomainListPage
      title="Permissions"
      description="Module-action permission keys enforced by RBAC guards."
      queryKey={["admin", "permissions", 1, 10]}
      queryFn={() =>
        permissionsApi.findAll({ page: 1, limit: 10 })
      }
      emptyLabel="No permissions found."
      fields={[
        { label: "Key", render: (item) => item.key },
        { label: "Module", render: (item) => item.module },
        { label: "Action", render: (item) => item.action },
        {
          label: "Description",
          render: (item) => item.description ?? "-",
        },
      ]}
    />
  );
}
