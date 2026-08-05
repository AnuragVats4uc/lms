"use client";

import { permissionsApi } from "@repo/api";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreatePermissionRequest, Permission } from "@repo/types";
import { permissionSchema, type PermissionFormValues } from "@repo/validation";
import {
  CalendarDays,
  Clock3,
  FileText,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import {
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudDetailField, CrudDetailSection } from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { FormInput, FormTextArea, Text, YStack } from "@repo/ui";

type PermissionForm = PermissionFormValues;
const initialForm: PermissionForm = { action: "", description: "", module: "" };
function toCreate(form: PermissionForm): CreatePermissionRequest {
  return {
    action: form.action.trim().toLowerCase(),
    description: form.description.trim() || undefined,
    module: form.module.trim().toLowerCase(),
  };
}
function Form({ error }: ResourceFormContext<PermissionForm>) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? <Text color="#B42318">{error}</Text> : null}
      <div className="lms-form-field">
        <FormInput autoFocus label="Module" name="module" />
      </div>
      <div className="lms-form-field">
        <FormInput label="Action" name="action" />
      </div>
      <div className="lms-form-field">
        <FormTextArea label="Description" name="description" rows={4} />
      </div>
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
    cell: ({ row }) => (
      <DataTableTextCell
        primary={new Date(row.updatedAt).toLocaleDateString()}
      />
    ),
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
        {
          icon: <KeyRound color="#059669" size={20} />,
          label: "Total Permissions",
          value: total,
        },
        {
          icon: <ShieldCheck color="#2563EB" size={20} />,
          label: "Modules",
          value: new Set(rows.map((row) => row.module)).size,
        },
        {
          icon: <KeyRound color="#059669" size={20} />,
          label: "Actions",
          value: new Set(rows.map((row) => row.action)).size,
        },
        {
          icon: <FileText color="#64748B" size={20} />,
          label: "With Description",
          value: rows.filter((row) => Boolean(row.description)).length,
        },
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
          <CrudDetailSection
            icon={<ShieldCheck color="#059669" size={15} />}
            title="Permission"
          >
            <CrudDetailField
              icon={<KeyRound color="#059669" size={15} />}
              label="Key"
              value={permission.key}
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Module"
              value={permission.module}
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Action"
              value={permission.action}
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Description"
              value={permission.description}
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<CalendarDays color="#059669" size={15} />}
            title="Record history"
          >
            <CrudDetailField
              icon={<CalendarDays color="#059669" size={15} />}
              label="Created"
              value={new Date(permission.createdAt).toLocaleString()}
            />
            <CrudDetailField
              icon={<Clock3 color="#059669" size={15} />}
              label="Last updated"
              value={new Date(permission.updatedAt).toLocaleString()}
            />
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
      formResolver={zodResolver(permissionSchema)}
    />
  );
}
