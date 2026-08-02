"use client";

import { rolesApi } from "@repo/api";
import type { CreateRoleRequest, Role, UpdateRoleRequest } from "@repo/types";
import { DataTableBadgeCell, DataTableTextCell, type DataTableColumn } from "@/components/DataTable";
import { ResourceManagementPage, type ResourceFormContext } from "../components/ResourceManagementPage";
import { Text, YStack } from "@repo/ui";

type RoleForm = { code: string; description: string; name: string };
const initialForm: RoleForm = { code: "", description: "", name: "" };
function toCreate(form: RoleForm): CreateRoleRequest { return { code: form.code.trim().toUpperCase(), description: form.description.trim() || undefined, name: form.name.trim() }; }
function Form({ error, form, onChange }: ResourceFormContext<RoleForm>) { return <YStack className="lms-organization-form" gap="$3">{error ? <Text color="#B42318">{error}</Text> : null}<label className="lms-form-field"><span>Name</span><input autoFocus minLength={3} onChange={(event) => onChange("name", event.currentTarget.value)} required value={form.name} /></label><label className="lms-form-field"><span>Code</span><input onChange={(event) => onChange("code", event.currentTarget.value.toUpperCase())} required value={form.code} /></label><label className="lms-form-field"><span>Description</span><textarea onChange={(event) => onChange("description", event.currentTarget.value)} rows={4} value={form.description} /></label></YStack>; }
const columns: DataTableColumn<Role>[] = [{ cell: ({ row }) => <DataTableTextCell primary={row.name} secondary={row.code} />, header: "Role", id: "name", sticky: true, width: 280 }, { cell: ({ row }) => <DataTableTextCell primary={String(row.permissions?.length ?? 0)} />, header: "Permissions", id: "permissions", width: 140 }, { cell: ({ row }) => <DataTableBadgeCell label={row.isActive ? "Active" : "Inactive"} tone={row.isActive ? "green" : "gray"} />, header: "Status", id: "status", width: 140 }];

export function RolesPage() {
  return <ResourceManagementPage<Role, RoleForm, CreateRoleRequest, UpdateRoleRequest> columns={columns} create={(payload) => rolesApi.create(payload)} description="Manage RBAC roles and their lifecycle." entityLabel="Role" getDisplayName={(role) => role.name} getRowId={(role) => role.id} initialForm={initialForm} permissionPrefix="roles" queryFn={(query) => rolesApi.findAll({ limit: query.limit, page: query.page, search: query.search })} queryKey={["admin", "roles"]} renderDetails={(role) => <YStack gap="$2"><Text color="#52627A">Code: {role.code}</Text><Text color="#52627A">Permissions: {role.permissions?.map((permission) => permission.key).join(", ") || "None"}</Text></YStack>} renderForm={(context) => <Form {...context} />} title="Roles" toCreatePayload={toCreate} toForm={(role) => ({ code: role.code, description: role.description ?? "", name: role.name })} toUpdatePayload={(form) => toCreate(form)} update={(id, payload) => rolesApi.update(id, payload)} validate={(form) => form.name.trim().length < 3 ? "Role name must be at least 3 characters." : !form.code.trim() ? "Role code is required." : null} />;
}
