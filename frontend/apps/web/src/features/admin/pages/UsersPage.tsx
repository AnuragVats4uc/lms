"use client";

import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationsApi, rolesApi, usersApi } from "@repo/api";
import { useAuthSession } from "@repo/auth";
import {
  CalendarDays,
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserStatus,
} from "@repo/types";
import { type UserFormValues, userSchema } from "@repo/validation";
import {
  DataTableDateCell,
  DataTableEmailCell,
  DataTablePhoneCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
  CrudFormSelect,
} from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { FormInput, Text, YStack } from "@repo/ui";

type UserForm = UserFormValues;

const initialForm: UserForm = {
  email: "",
  firstName: "",
  lastName: "",
  organizationId: "",
  password: "",
  phone: "",
  roleId: "",
};

function toCreate(form: UserForm): CreateUserRequest {
  const payload: CreateUserRequest = {
    email: form.email.trim().toLowerCase(),
    firstName: form.firstName.trim(),
    password: form.password,
    roleId: Number(form.roleId),
  };
  if (form.lastName.trim()) payload.lastName = form.lastName.trim();
  if (form.organizationId) payload.organizationId = Number(form.organizationId);
  if (form.phone.trim()) payload.phone = form.phone.trim();
  return payload;
}

function toUpdate(form: UserForm): UpdateUserRequest {
  const payload: UpdateUserRequest = {
    email: form.email.trim().toLowerCase(),
    firstName: form.firstName.trim(),
    roleId: Number(form.roleId),
  };
  if (form.lastName.trim()) payload.lastName = form.lastName.trim();
  if (form.organizationId) payload.organizationId = Number(form.organizationId);
  if (form.phone.trim()) payload.phone = form.phone.trim();
  if (form.password) payload.password = form.password;
  return payload;
}

function validate(form: UserForm, isEdit = false) {
  if (form.firstName.trim().length < 2)
    return "First name must be at least 2 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(form.email.trim()))
    return "Enter a valid email address.";
  if (form.phone && !/^[+\d()\s-]{7,20}$/u.test(form.phone))
    return "Enter a valid phone number.";
  if (!form.roleId) return "Select a role.";
  if (!isEdit && form.password.length < 8)
    return "Password must be at least 8 characters.";
  return null;
}

function Form({
  error,
  isEdit,
  isSuperAdmin,
  organizations,
  roles,
}: ResourceFormContext<UserForm> & {
  isSuperAdmin: boolean;
  organizations: { id: number; name: string }[];
  roles: {
    id: number;
    code: string;
    name: string;
    organizationId: number | null;
  }[];
}) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? (
        <Text color="#B42318" fontSize="$caption">
          {error}
        </Text>
      ) : null}
      <div className="lms-organization-form-grid">
        <div className="lms-form-field">
          <FormInput autoFocus label="First name" name="firstName" />
        </div>
        <div className="lms-form-field">
          <FormInput label="Last name" name="lastName" />
        </div>
        <div className="lms-form-field">
          <FormInput label="Email" name="email" type="email" />
        </div>
        <div className="lms-form-field">
          <FormInput label="Phone" name="phone" />
        </div>
        {isSuperAdmin ? (
          <div className="lms-form-field">
            <CrudFormSelect
              label="Organization"
              name="organizationId"
              options={organizations.map((organization) => ({
                label: organization.name,
                value: String(organization.id),
              }))}
              placeholder="Select organization"
            />
          </div>
        ) : null}
        <div className="lms-form-field">
          <CrudFormSelect
            label="Role"
            name="roleId"
            options={roles
              .filter((role) => role.code !== "SUPER_ADMIN")
              .map((role) => ({
                label: `${role.name} (${role.code})`,
                value: String(role.id),
              }))}
            placeholder="Select role"
          />
        </div>
        <div
          className={
            isSuperAdmin
              ? "lms-form-field lms-form-field-wide"
              : "lms-form-field"
          }
        >
          <FormInput
            label={isEdit ? "New password (optional)" : "Password"}
            name="password"
            type="password"
          />
        </div>
      </div>
    </YStack>
  );
}

const columns: DataTableColumn<User>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={[row.firstName, row.lastName].filter(Boolean).join(" ")}
        secondary={row.email}
      />
    ),
    header: "User",
    id: "name",
    sticky: true,
    width: 280,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell primary={row.organization?.name ?? "Unassigned"} />
    ),
    header: "Organization",
    id: "organization",
    width: 180,
  },
  {
    cell: ({ row }) => (
      <CrudBadge
        tone={
          row.status === "ACTIVE"
            ? "success"
            : row.status === "BLOCKED"
              ? "danger"
              : "neutral"
        }
      >
        {row.status}
      </CrudBadge>
    ),
    header: "Status",
    id: "status",
    width: 130,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.roles?.map((role) => role.code).join(", ") || "No roles"}
      />
    ),
    header: "Roles",
    id: "roles",
    width: 220,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
    header: "Updated",
    id: "updatedAt",
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableEmailCell href={row.email} />,
    header: "Email",
    id: "email",
    width: 240,
  },
  {
    cell: ({ row }) => <DataTablePhoneCell value={row.phone} />,
    header: "Phone",
    id: "phone",
    width: 150,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={row.isVerified ? "success" : "warning"}>
        {row.isVerified ? "Verified" : "Unverified"}
      </CrudBadge>
    ),
    header: "Verification",
    id: "isVerified",
    width: 130,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.lastLoginAt} />,
    header: "Last login",
    id: "lastLoginAt",
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
    header: "Created",
    id: "createdAt",
    width: 150,
  },
];

export function UsersPage() {
  const { currentUser } = useAuthSession();
  const isSuperAdmin = Boolean(currentUser?.roles.includes("SUPER_ADMIN"));
  const organizationId = currentUser?.organizationId ?? undefined;
  const organizationsQuery = useQuery({
    enabled: isSuperAdmin,
    queryFn: () => organizationsApi.findAll({ limit: 100, page: 1 }),
    queryKey: ["admin", "user-organizations"],
    staleTime: 60_000,
  });
  const rolesQuery = useQuery({
    queryFn: () =>
      rolesApi.findAll({
        limit: 100,
        organizationId,
        page: 1,
      }),
    queryKey: ["admin", "user-roles", organizationId ?? "all"],
    staleTime: 60_000,
  });

  return (
    <CrudManagementPage<User, UserForm, CreateUserRequest, UpdateUserRequest>
      columns={columns}
      create={(payload) => usersApi.create(payload)}
      description="Manage organization user accounts, role assignment, and access status."
      entityLabel="User"
      getStats={({ rows, total }) => [
        {
          icon: <UserRound color="#059669" size={20} />,
          label: "Total Users",
          value: total,
        },
        {
          icon: <ShieldCheck color="#059669" size={20} />,
          label: "Active Users",
          value: rows.filter((row) => row.status === "ACTIVE").length,
        },
        {
          icon: <ShieldCheck color="#2563EB" size={20} />,
          label: "Verified Users",
          value: rows.filter((row) => row.isVerified).length,
        },
        {
          icon: <UserRound color="#64748B" size={20} />,
          label: "Assigned Organization",
          value: rows.filter((row) => row.organizationId !== null).length,
        },
      ]}
      getDisplayName={(user) =>
        [user.firstName, user.lastName].filter(Boolean).join(" ")
      }
      getRowId={(user) => user.id}
      initialForm={initialForm}
      getCreateForm={() => ({
        ...initialForm,
        organizationId: organizationId ? String(organizationId) : "",
      })}
      permissionPrefix="users"
      queryFn={(query) =>
        usersApi.findAll({
          limit: query.limit,
          organizationId,
          page: query.page,
          search: query.search,
          status: query.status as UserStatus | undefined,
        })
      }
      queryKey={["admin", "users", organizationId ?? "all"]}
      remove={(id) => usersApi.remove(id)}
      renderDetails={(user) => (
        <YStack gap="$3">
          <CrudDetailSection
            icon={<UserRound color="#059669" size={15} />}
            title="Profile"
          >
            <CrudDetailField
              icon={<UserRound color="#059669" size={15} />}
              label="Name"
              value={[user.firstName, user.lastName].filter(Boolean).join(" ")}
            />
            <CrudDetailField
              icon={<Mail color="#059669" size={15} />}
              label="Email"
              value={user.email}
            />
            <CrudDetailField
              icon={<Phone color="#059669" size={15} />}
              label="Phone"
              value={user.phone}
            />
            <CrudDetailField
              icon={<UserRound color="#059669" size={15} />}
              label="Organization"
              value={user.organization?.name ?? "Unassigned"}
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<ShieldCheck color="#059669" size={15} />}
            title="Access"
          >
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Status"
              value={user.status}
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Verified"
              value={user.isVerified ? "Yes" : "No"}
            />
            <CrudDetailField
              icon={<ShieldCheck color="#059669" size={15} />}
              label="Active record"
              value={user.isActive ? "Yes" : "No"}
            />
            <CrudDetailField
              icon={<UserRound color="#059669" size={15} />}
              label="Roles"
              value={
                user.roles?.map((role) => role.code).join(", ") || "No roles"
              }
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<CalendarDays color="#059669" size={15} />}
            title="Activity"
          >
            <CrudDetailField
              icon={<Clock3 color="#059669" size={15} />}
              label="Last login"
              value={
                user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "Never"
              }
            />
            <CrudDetailField
              icon={<CalendarDays color="#059669" size={15} />}
              label="Created"
              value={new Date(user.createdAt).toLocaleString()}
            />
            <CrudDetailField
              icon={<Clock3 color="#059669" size={15} />}
              label="Last updated"
              value={new Date(user.updatedAt).toLocaleString()}
            />
          </CrudDetailSection>
        </YStack>
      )}
      renderForm={(context) => (
        <Form
          {...context}
          isEdit={context.isEdit}
          isSuperAdmin={isSuperAdmin}
          organizations={organizationsQuery.data?.items ?? []}
          roles={rolesQuery.data?.items ?? []}
        />
      )}
      statusOptions={[
        { label: "All", value: "ALL" },
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
        { label: "Blocked", value: "BLOCKED" },
      ]}
      title="Users"
      toCreatePayload={toCreate}
      toForm={(user) => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName ?? "",
        organizationId: user.organizationId?.toString() ?? "",
        password: "",
        phone: user.phone ?? "",
        roleId: user.roles?.[0]?.id ? String(user.roles[0].id) : "",
      })}
      toUpdatePayload={toUpdate}
      update={(id, payload) => usersApi.update(id, payload)}
      formResolver={zodResolver(userSchema)}
      validate={(form, isEdit) => validate(form, isEdit)}
    />
  );
}
