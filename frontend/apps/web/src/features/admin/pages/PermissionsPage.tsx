"use client";

import { permissionsApi } from "@repo/api";
import type { CreatePermissionRequest, Permission } from "@repo/types";
import { CalendarDays, Clock3, FileText, KeyRound, ShieldCheck } from "lucide-react";
import {
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  CrudDetailField,
  CrudDetailSection,
} from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { Text, YStack } from "@repo/ui";

type PermissionForm = { action: string; description: string; module: string };
const initialForm: PermissionForm = { action: "", description: "", module: "" };
function toCreate(form: PermissionForm): CreatePermissionRequest {
  return {
    action: form.action.trim().toLowerCase(),
    description: form.description.trim() || undefined,
    module: form.module.trim().toLowerCase(),
  };
}
function Form({ error, form, onChange }: ResourceFormContext<PermissionForm>) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? <Text color="#B42318">{error}</Text> : null}
      <label className="lms-form-field">
        <span>Module</span>
        <input
          autoFocus
          onChange={(event) => onChange("module", event.currentTarget.value)}
          required
          value={form.module}
        />
      </label>
      <label className="lms-form-field">
        <span>Action</span>
        <input
          onChange={(event) => onChange("action", event.currentTarget.value)}
          required
          value={form.action}
        />
      </label>
      <label className="lms-form-field">
        <span>Description</span>
        <textarea
          onChange={(event) =>
            onChange("description", event.currentTarget.value)
          }
          rows={4}
          value={form.description}
        />
      </label>
    </YStack>
  );
}
const columns: DataTableColumn<Permission>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.key}
        secondary={row.description ?? "No description"}
      />
    ),
    header: "Permission",
    id: "key",
    sticky: true,
    width: 300,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.module} />,
    header: "Module",
    id: "module",
    width: 160,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.action} />,
    header: "Action",
    id: "action",
    width: 160,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.description ?? "-"} />,
    header: "Description",
    id: "description",
    width: 260,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={new Date(row.updatedAt).toLocaleDateString()} />,
    header: "Updated",
    id: "updatedAt",
    width: 140,
  },
];

export function PermissionsPage() {
  return (
    <CrudManagementPage<
      Permission,
      PermissionForm,
      CreatePermissionRequest,
      never
    >
      columns={columns}
      create={(payload) => permissionsApi.create(payload)}
      description="Manage module-action permission keys enforced by RBAC guards."
      entityLabel="Permission"
      getStats={({ rows, total }) => [
        { icon: <KeyRound color="#059669" size={20} />, label: "Total Permissions", value: total },
        { icon: <ShieldCheck color="#2563EB" size={20} />, label: "Modules", value: new Set(rows.map((row) => row.module)).size },
        { icon: <KeyRound color="#059669" size={20} />, label: "Actions", value: new Set(rows.map((row) => row.action)).size },
        { icon: <FileText color="#64748B" size={20} />, label: "With Description", value: rows.filter((row) => Boolean(row.description)).length },
      ]}
      getDisplayName={(permission) => permission.key}
      getRowId={(permission) => permission.id}
      initialForm={initialForm}
      permissionPrefix="permissions"
      queryFn={(query) =>
        permissionsApi.findAll({
          limit: query.limit,
          page: query.page,
          search: query.search,
        })
      }
      queryKey={["admin", "permissions"]}
      renderDetails={(permission) => (
        <YStack gap="$3">
          <CrudDetailSection icon={<ShieldCheck color="#059669" size={15} />} title="Permission">
            <CrudDetailField icon={<KeyRound color="#059669" size={15} />} label="Key" value={permission.key} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Module" value={permission.module} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Action" value={permission.action} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Description" value={permission.description} />
          </CrudDetailSection>
          <CrudDetailSection icon={<CalendarDays color="#059669" size={15} />} title="Record history">
            <CrudDetailField icon={<CalendarDays color="#059669" size={15} />} label="Created" value={new Date(permission.createdAt).toLocaleString()} />
            <CrudDetailField icon={<Clock3 color="#059669" size={15} />} label="Last updated" value={new Date(permission.updatedAt).toLocaleString()} />
          </CrudDetailSection>
          <Text color="#52627A">Key: {permission.key}</Text>
          <Text color="#52627A" style={{ display: "none" }}>
            Description: {permission.description ?? "—"}
          </Text>
        </YStack>
      )}
      renderForm={(context) => <Form {...context} />}
      title="Permissions"
      toCreatePayload={toCreate}
      toForm={() => initialForm}
      toUpdatePayload={() => {
        throw new Error(
          "Permissions are not editable through the backend API.",
        );
      }}
      validate={(form) =>
        !form.module.trim() || !form.action.trim()
          ? "Module and action are required."
          : !/^[a-z0-9._-]+$/iu.test(form.module.trim()) ||
              !/^[a-z0-9._-]+$/iu.test(form.action.trim())
            ? "Module and action may contain only letters, numbers, dots, hyphens, and underscores."
          : null
      }
    />
  );
}
