"use client";

import { useQuery } from "@tanstack/react-query";
import { organizationsApi, studentsApi } from "@repo/api";
import type {
  CreateStudentRequest,
  Student,
  UpdateStudentRequest,
  UserStatus,
} from "@repo/types";
import {
  DataTableBadgeCell,
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { Text, XStack, YStack } from "@repo/ui";

type UserForm = {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  password: string;
  phone: string;
};
const initialForm: UserForm = {
  email: "",
  firstName: "",
  lastName: "",
  organizationId: "",
  password: "",
  phone: "",
};
function toCreate(form: UserForm): CreateStudentRequest {
  const payload: CreateStudentRequest = {
    email: form.email.trim().toLowerCase(),
    firstName: form.firstName.trim(),
    password: form.password,
  };
  if (form.lastName.trim()) payload.lastName = form.lastName.trim();
  if (form.organizationId) payload.organizationId = Number(form.organizationId);
  if (form.phone.trim()) payload.phone = form.phone.trim();
  return payload;
}
function toUpdate(form: UserForm): UpdateStudentRequest {
  const payload: UpdateStudentRequest = {
    email: form.email.trim().toLowerCase(),
    firstName: form.firstName.trim(),
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
  if (!form.email.includes("@")) return "Enter a valid email address.";
  if (!isEdit && form.password.length < 8)
    return "Password must be at least 8 characters.";
  return null;
}
function Form({
  error,
  form,
  onChange,
  organizations,
  isEdit,
}: ResourceFormContext<UserForm> & {
  organizations: { id: number; name: string }[];
}) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? (
        <Text color="#B42318" fontSize="$caption">
          {error}
        </Text>
      ) : null}
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <label className="lms-form-field">
          <span>First name</span>
          <input
            autoFocus
            onChange={(event) =>
              onChange("firstName", event.currentTarget.value)
            }
            required
            value={form.firstName}
          />
        </label>
        <label className="lms-form-field">
          <span>Last name</span>
          <input
            onChange={(event) =>
              onChange("lastName", event.currentTarget.value)
            }
            value={form.lastName}
          />
        </label>
      </XStack>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <label className="lms-form-field">
          <span>Email</span>
          <input
            onChange={(event) => onChange("email", event.currentTarget.value)}
            required
            type="email"
            value={form.email}
          />
        </label>
        <label className="lms-form-field">
          <span>Phone</span>
          <input
            onChange={(event) => onChange("phone", event.currentTarget.value)}
            value={form.phone}
          />
        </label>
      </XStack>
      <label className="lms-form-field">
        <span>Organization</span>
        <select
          onChange={(event) =>
            onChange("organizationId", event.currentTarget.value)
          }
          value={form.organizationId}
        >
          <option value="">No organization</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>
      <label className="lms-form-field">
        <span>{isEdit ? "New password (optional)" : "Password"}</span>
        <input
          minLength={8}
          onChange={(event) => onChange("password", event.currentTarget.value)}
          required={!isEdit}
          type="password"
          value={form.password}
        />
      </label>
    </YStack>
  );
}
const columns: DataTableColumn<Student>[] = [
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
      <DataTableBadgeCell
        label={row.status}
        tone={row.status === "ACTIVE" ? "green" : "gray"}
      />
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
];

export function UsersPage() {
  const organizationsQuery = useQuery({
    queryFn: () => organizationsApi.findAll({ limit: 100, page: 1 }),
    queryKey: ["admin", "user-organizations"],
    staleTime: 60_000,
  });
  return (
    <CrudManagementPage<
      Student,
      UserForm,
      CreateStudentRequest,
      UpdateStudentRequest
    >
      columns={columns}
      create={(payload) => studentsApi.create(payload)}
      description="Manage student and user records, organization membership, and account status."
      entityLabel="User"
      getDisplayName={(user) =>
        [user.firstName, user.lastName].filter(Boolean).join(" ")
      }
      getRowId={(user) => user.id}
      initialForm={initialForm}
      permissionPrefix="students"
      queryFn={(query) =>
        studentsApi.findAll({
          limit: query.limit,
          page: query.page,
          search: query.search,
          status: query.status as UserStatus | undefined,
        })
      }
      queryKey={["admin", "users"]}
      remove={(id) => studentsApi.remove(id)}
      renderDetails={(user) => (
        <YStack gap="$2">
          <Text color="#52627A" fontSize="$caption">
            Email: {user.email}
          </Text>
          <Text color="#52627A" fontSize="$caption">
            Status: {user.status}
          </Text>
          <Text color="#52627A" fontSize="$caption">
            Verified: {user.isVerified ? "Yes" : "No"}
          </Text>
        </YStack>
      )}
      renderForm={(context) => (
        <Form
          {...context}
          isEdit={context.isEdit}
          organizations={organizationsQuery.data?.items ?? []}
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
      })}
      toUpdatePayload={toUpdate}
      update={(id, payload) => studentsApi.update(id, payload)}
      validate={(form, isEdit) => validate(form, isEdit)}
    />
  );
}
