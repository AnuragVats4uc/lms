"use client";

import { permissionsApi } from "@repo/api";
import type { CreatePermissionRequest, Permission } from "@repo/types";
import { DataTableTextCell, type DataTableColumn } from "@/components/DataTable";
import { ResourceManagementPage, type ResourceFormContext } from "../components/ResourceManagementPage";
import { Text, YStack } from "@repo/ui";

type PermissionForm = { action: string; description: string; module: string };
const initialForm: PermissionForm = { action: "", description: "", module: "" };
function toCreate(form: PermissionForm): CreatePermissionRequest { return { action: form.action.trim().toLowerCase(), description: form.description.trim() || undefined, module: form.module.trim().toLowerCase() }; }
function Form({ error, form, onChange }: ResourceFormContext<PermissionForm>) { return <YStack className="lms-organization-form" gap="$3">{error ? <Text color="#B42318">{error}</Text> : null}<label className="lms-form-field"><span>Module</span><input autoFocus onChange={(event) => onChange("module", event.currentTarget.value)} required value={form.module} /></label><label className="lms-form-field"><span>Action</span><input onChange={(event) => onChange("action", event.currentTarget.value)} required value={form.action} /></label><label className="lms-form-field"><span>Description</span><textarea onChange={(event) => onChange("description", event.currentTarget.value)} rows={4} value={form.description} /></label></YStack>; }
const columns: DataTableColumn<Permission>[] = [{ cell: ({ row }) => <DataTableTextCell primary={row.key} secondary={row.description ?? "No description"} />, header: "Permission", id: "key", sticky: true, width: 300 }, { cell: ({ row }) => <DataTableTextCell primary={row.module} />, header: "Module", id: "module", width: 160 }, { cell: ({ row }) => <DataTableTextCell primary={row.action} />, header: "Action", id: "action", width: 160 }];

export function PermissionsPage() {
  return <ResourceManagementPage<Permission, PermissionForm, CreatePermissionRequest, never> columns={columns} create={(payload) => permissionsApi.create(payload)} description="Manage module-action permission keys enforced by RBAC guards." entityLabel="Permission" getDisplayName={(permission) => permission.key} getRowId={(permission) => permission.id} initialForm={initialForm} permissionPrefix="permissions" queryFn={(query) => permissionsApi.findAll({ limit: query.limit, page: query.page, search: query.search })} queryKey={["admin", "permissions"]} renderDetails={(permission) => <YStack gap="$2"><Text color="#52627A">Key: {permission.key}</Text><Text color="#52627A">Description: {permission.description ?? "—"}</Text></YStack>} renderForm={(context) => <Form {...context} />} title="Permissions" toCreatePayload={toCreate} toForm={() => initialForm} toUpdatePayload={() => { throw new Error("Permissions are not editable through the backend API."); }} validate={(form) => !form.module.trim() || !form.action.trim() ? "Module and action are required." : null} />;
}
