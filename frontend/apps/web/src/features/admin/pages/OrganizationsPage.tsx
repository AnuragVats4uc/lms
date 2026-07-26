"use client";

import { organizationsApi } from "@repo/api";

import { DomainListPage } from "../components/DomainListPage";

export function OrganizationsPage() {
  return (
    <DomainListPage
      title="Organizations"
      description="Tenant organizations from the backend Organizations module."
      queryKey={["admin", "organizations", 1, 10]}
      queryFn={() =>
        organizationsApi.findAll({ page: 1, limit: 10 })
      }
      emptyLabel="No organizations found."
      fields={[
        { label: "Name", render: (item) => item.name },
        { label: "Code", render: (item) => item.code },
        { label: "Status", render: (item) => item.status },
        {
          label: "Active",
          render: (item) => (item.isActive ? "Yes" : "No"),
        },
        {
          label: "Email",
          render: (item) => item.email ?? "-",
        },
      ]}
    />
  );
}
