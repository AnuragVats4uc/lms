"use client";

import { rolesApi } from "@repo/api";
import type { CreateRoleRequest, Role, UpdateRoleRequest } from "@repo/types";
import { CalendarDays, Clock3, KeyRound, ShieldCheck, UsersRound } from "lucide-react";
import {
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
} from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { Text, YStack } from "@repo/ui";

type RoleForm = { code: string; description: string; isActive: boolean; name: string };
const initialForm: RoleForm = { code: "", description: "", isActive: true, name: "" };
function toCreate(form: RoleForm): CreateRoleRequest {
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim() || undefined,
    isActive: form.isActive,
    name: form.name.trim(),
  };
}
function Form({ error, form, onChange }: ResourceFormContext<RoleForm>) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? <Text color="#B42318">{error}</Text> : null}
      <label className="lms-form-field">
        <span>Name</span>
        <input
          autoFocus
          minLength={3}
          onChange={(event) => onChange("name", event.currentTarget.value)}
          required
          value={form.name}
        />
      </label>
      <label className="lms-form-field">
        <span>Code</span>
        <input
          onChange={(event) =>
            onChange("code", event.currentTarget.value.toUpperCase())
          }
          required
          value={form.code}
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
      <label className="lms-form-checkbox">
        <input
          checked={form.isActive}
          onChange={(event) => onChange("isActive", event.currentTarget.checked)}
          type="checkbox"
        />
        <span>Active role</span>
      </label>
    </YStack>
  );
}
const columns: DataTableColumn<Role>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell primary={row.name} secondary={row.code} />
    ),
    header: "Role",
    id: "name",
    sticky: true,
    width: 280,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell primary={String(row.permissions?.length ?? 0)} />
    ),
    header: "Permissions",
    id: "permissions",
    width: 140,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={row.isActive ? "success" : "neutral"}>
        {row.isActive ? "Active" : "Inactive"}
      </CrudBadge>
    ),
    header: "Status",
    id: "status",
    width: 140,
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

export function RolesPage() {
  return (
    <CrudManagementPage<Role, RoleForm, CreateRoleRequest, UpdateRoleRequest>
      columns={columns}
      create={(payload) => rolesApi.create(payload)}
      description="Manage RBAC roles and their lifecycle."
      entityLabel="Role"
      getStats={({ rows, total }) => [
        { icon: <ShieldCheck color="#059669" size={20} />, label: "Total Roles", value: total },
        { icon: <ShieldCheck color="#059669" size={20} />, label: "Active Roles", value: rows.filter((row) => row.isActive).length },
        { icon: <UsersRound color="#2563EB" size={20} />, label: "With Permissions", value: rows.filter((row) => (row.permissions?.length ?? 0) > 0).length },
        { icon: <KeyRound color="#64748B" size={20} />, label: "Empty Roles", value: rows.filter((row) => (row.permissions?.length ?? 0) === 0).length },
      ]}
      getDisplayName={(role) => role.name}
      getIsActive={(role) => role.isActive}
      getRowId={(role) => role.id}
      initialForm={initialForm}
      permissionPrefix="roles"
      filterDefinitions={[{ id: "active", label: "Status", options: [{ label: "All", value: "ALL" }, { label: "Active", value: "true" }, { label: "Inactive", value: "false" }] }]}
      queryFn={(query) =>
        rolesApi.findAll({
          isActive: query.filters?.active && query.filters.active !== "ALL" ? query.filters.active === "true" : undefined,
          limit: query.limit,
          page: query.page,
          search: query.search,
        })
      }
      queryKey={["admin", "roles"]}
      renderDetails={(role) => (
        <YStack gap="$3">
          <CrudDetailSection icon={<ShieldCheck color="#059669" size={15} />} title="Role">
            <CrudDetailField icon={<KeyRound color="#059669" size={15} />} label="Code" value={role.code} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Status" value={<CrudBadge align="start" tone={role.isActive ? "success" : "neutral"}>{role.isActive ? "Active" : "Inactive"}</CrudBadge>} />
            <CrudDetailField icon={<UsersRound color="#059669" size={15} />} label="Permissions" value={role.permissions?.map((permission) => permission.key).join(", ") || "None"} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Description" value={role.description} />
          </CrudDetailSection>
          <CrudDetailSection icon={<CalendarDays color="#059669" size={15} />} title="Record history">
            <CrudDetailField icon={<CalendarDays color="#059669" size={15} />} label="Created" value={new Date(role.createdAt).toLocaleString()} />
            <CrudDetailField icon={<Clock3 color="#059669" size={15} />} label="Last updated" value={new Date(role.updatedAt).toLocaleString()} />
          </CrudDetailSection>
        </YStack>
      )}
      renderForm={(context) => <Form {...context} />}
      title="Roles"
      setActive={(id, active) => rolesApi.update(id, { isActive: active })}
      toCreatePayload={toCreate}
      toForm={(role) => ({
        code: role.code,
        description: role.description ?? "",
        isActive: role.isActive,
        name: role.name,
      })}
      toUpdatePayload={(form) => toCreate(form)}
      update={(id, payload) => rolesApi.update(id, payload)}
      validate={(form) =>
        form.name.trim().length < 3
          ? "Role name must be at least 3 characters."
          : !form.code.trim()
            ? "Role code is required."
            : !/^[A-Z0-9_-]+$/u.test(form.code.trim().toUpperCase())
              ? "Role code may contain only letters, numbers, hyphens, and underscores."
            : null
      }
    />
  );
}
