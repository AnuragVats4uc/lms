"use client";

import { organizationsApi } from "@repo/api";

import { DomainListPage } from "../components/DomainListPage";

import { Plus, Upload, Download, RefreshCw } from "lucide-react";

export function OrganizationsPage() {
  return (
    <DomainListPage
      title="Organizations"
      description="Tenant organizations from the backend Organizations module."
      queryKey={["admin", "organizations", 1, 10]}
      queryFn={() => organizationsApi.findAll({ page: 1, limit: 10 })}
      emptyLabel="No organizations found."
      buttonGroup={[
        {
          label: "Add Organization",
          icon: <Plus size={16} color="#fff" />,
          gradient: true,
          onClick: () => console.log("Add Organization"),
        },
        {
          label: "Import",
          icon: <Upload size={16} />,
          variant: "outlined",
          onClick: () => console.log("Import"),
        },
        {
          label: "Export",
          icon: <Download size={16} />,
          variant: "outlined",
          onClick: () => console.log("Export"),
        },
        // {
        //   label: "Refresh",
        //   icon: <RefreshCw size={16} />,
        //   variant: "outlined",
        //   onClick: () => console.log("Refresh"),
        // },
      ]}
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
