"use client";

import { useQuery } from "@tanstack/react-query";
import { organizationsApi, permissionsApi, rolesApi } from "@repo/api";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateRoleRequest, Role, UpdateRoleRequest } from "@repo/types";
import { roleSchema, type RoleFormValues } from "@repo/validation";
import { useAuthSession } from "@repo/auth";
import {
  CalendarDays,
  Clock3,
  KeyRound,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
  CrudFormSelect,
  CrudMultiSelectField,
} from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { FormCheckbox, FormInput, FormTextArea, Text, YStack } from "@repo/ui";

type RoleForm = RoleFormValues;
const initialForm: RoleForm = {
  description: "",
  isActive: true,
  name: "",
  organizationId: "",
  permissionIds: [],
};
function toCreate(form: RoleForm): CreateRoleRequest {
  const permissionIds = form.permissionIds.map(Number);
  return {
    description: form.description.trim() || undefined,
    isActive: form.isActive,
    name: form.name.trim(),
    organizationId: form.organizationId
      ? Number(form.organizationId)
      : undefined,
    permissionIds,
  };
}
function Form({
  error,
  form,
  isSuperAdmin,
  onChange,
  organizations,
  permissions,
}: ResourceFormContext<RoleForm> & {
  isSuperAdmin: boolean;
  organizations: { id: number; name: string }[];
  permissions: { id: number; key: string }[];
}) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? <Text color="#B42318">{error}</Text> : null}
      {isSuperAdmin ? (
        <div className="lms-form-field">
          <CrudFormSelect
            label="Organization"
            name="organizationId"
            options={organizations.map((organization) => ({
              label: organization.name,
              value: String(organization.id),
            }))}
            placeholder="Global role"
          />
        </div>
      ) : null}
      <div className="lms-form-field">
        <FormInput autoFocus label="Name" name="name" />
      </div>
      <div className="lms-form-field">
        <FormTextArea label="Description" name="description" rows={4} />
      </div>
      <CrudMultiSelectField
        label="Permissions"
        onChange={(value) => onChange("permissionIds", value)}
        options={permissions.map((permission) => ({
          label: permission.key,
          value: String(permission.id),
        }))}
        placeholder="Select permissions"
        selectedLabel={(count) => `${count} permissions selected`}
        value={form.permissionIds}
      />
      <FormCheckbox checkboxLabel="Active role" name="isActive" />
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

export function RolesPage() {
  const { currentUser } = useAuthSession();
  const isSuperAdmin = Boolean(currentUser?.roles.includes("SUPER_ADMIN"));
  const organizationsQuery = useQuery({
    enabled: isSuperAdmin,
    queryFn: () => organizationsApi.findAll({ limit: 100, page: 1 }),
    queryKey: ["admin", "role-organizations"],
    staleTime: 60_000,
  });
  const permissionsQuery = useQuery({
    queryFn: () => permissionsApi.findAll({ limit: 100, page: 1 }),
    queryKey: ["admin", "role-permissions"],
    staleTime: 60_000,
  });
  const defaultOrganizationId = currentUser?.organizationId
    ? String(currentUser.organizationId)
    : "";

  return (
    <CrudManagementPage<Role, RoleForm, CreateRoleRequest, UpdateRoleRequest>
      columns={columns}
      create={(payload) => rolesApi.create(payload)}
      description="Manage RBAC roles and their lifecycle."
      entityLabel="Role"
      getStats={({ rows, total }) => [
        {
          icon: <ShieldCheck color="#059669" size={20} />,
          label: "Total Roles",
          value: total,
        },
        {
          icon: <ShieldCheck color="#059669" size={20} />,
          label: "Active Roles",
          value: rows.filter((row) => row.isActive).length,
        },
        {
          icon: <UsersRound color="#2563EB" size={20} />,
          label: "With Permissions",
          value: rows.filter((row) => (row.permissions?.length ?? 0) > 0)
            .length,
        },
        {
          icon: <KeyRound color="#64748B" size={20} />,
          label: "Empty Roles",
          value: rows.filter((row) => (row.permissions?.length ?? 0) === 0)
            .length,
        },
      ]}
      getDisplayName={(role) => role.name}
      getIsActive={(role) => role.isActive}
      getRowId={(role) => role.id}
      initialForm={initialForm}
      getCreateForm={() => ({
        ...initialForm,
        organizationId: defaultOrganizationId,
      })}
      permissionPrefix="roles"
      filterDefinitions={[
        {
          id: "active",
          label: "Status",
          options: [
            { label: "All", value: "ALL" },
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
          ],
        },
      ]}
      queryFn={(query) =>
        rolesApi.findAll({
          isActive:
            query.filters?.active && query.filters.active !== "ALL"
              ? query.filters.active === "true"
              : undefined,
          limit: query.limit,
          organizationId: currentUser?.organizationId ?? undefined,
          page: query.page,
          search: query.search,
        })
      }
      queryKey={["admin", "roles"]}
      renderDetails={(role) => (
        <YStack gap="$3">
          <CrudDetailSection
            icon={<ShieldCheck color="#059669" size={15} />}
            title="Role"
          >
            <CrudDetailField
              icon={<KeyRound color="#059669" size={15} />}
              label="Code"
              value={role.code}
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Scope"
              value={role.organization?.name ?? "Global"}
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Status"
              value={
                <CrudBadge
                  align="start"
                  tone={role.isActive ? "success" : "neutral"}
                >
                  {role.isActive ? "Active" : "Inactive"}
                </CrudBadge>
              }
            />
            <CrudDetailField
              icon={<UsersRound color="#059669" size={15} />}
              label="Permissions"
              value={
                role.permissions
                  ?.map((permission) => permission.key)
                  .join(", ") || "None"
              }
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Description"
              value={role.description}
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<CalendarDays color="#059669" size={15} />}
            title="Record history"
          >
            <CrudDetailField
              icon={<CalendarDays color="#059669" size={15} />}
              label="Created"
              value={new Date(role.createdAt).toLocaleString()}
            />
            <CrudDetailField
              icon={<Clock3 color="#059669" size={15} />}
              label="Last updated"
              value={new Date(role.updatedAt).toLocaleString()}
            />
          </CrudDetailSection>
        </YStack>
      )}
      renderForm={(context) => (
        <Form
          {...context}
          isSuperAdmin={isSuperAdmin}
          organizations={organizationsQuery.data?.items ?? []}
          permissions={permissionsQuery.data?.items ?? []}
        />
      )}
      title="Roles"
      setActive={(id, active) => rolesApi.update(id, { isActive: active })}
      toCreatePayload={toCreate}
      toForm={(role) => ({
        description: role.description ?? "",
        isActive: role.isActive,
        name: role.name,
        organizationId: role.organizationId
          ? String(role.organizationId)
          : defaultOrganizationId,
        permissionIds:
          role.permissions?.map((permission) => String(permission.id)) ?? [],
      })}
      toUpdatePayload={(form) => toCreate(form)}
      update={(id, payload) => rolesApi.update(id, payload)}
      formResolver={zodResolver(roleSchema)}
    />
  );
}
