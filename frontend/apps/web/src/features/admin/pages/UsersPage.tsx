"use client";

import { studentsApi } from "@repo/api";

import { DomainListPage } from "../components/DomainListPage";

export function UsersPage() {
  return (
    <DomainListPage
      title="Users"
      description="Current user records exposed by the Students backend module."
      queryKey={["admin", "users", 1, 10]}
      queryFn={() =>
        studentsApi.findAll({ page: 1, limit: 10 })
      }
      emptyLabel="No users found."
      fields={[
        {
          label: "Name",
          render: (item) =>
            [item.firstName, item.lastName]
              .filter(Boolean)
              .join(" "),
        },
        { label: "Email", render: (item) => item.email },
        {
          label: "Organization",
          render: (item) =>
            item.organization?.name ??
            item.organizationId ??
            "-",
        },
        { label: "Status", render: (item) => item.status },
        {
          label: "Roles",
          render: (item) =>
            item.roles?.map((role) => role.code).join(", ") ||
            "-",
        },
      ]}
    />
  );
}
