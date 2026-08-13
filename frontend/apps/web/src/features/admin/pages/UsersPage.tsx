"use client";

import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationsApi, studentsApi } from "@repo/api";
import {
  CalendarDays,
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type {
  CreateStudentRequest,
  Student,
  StudentStatus,
  UpdateStudentRequest,
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
} from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { FormInput, FormSelect, Text, XStack, YStack } from "@repo/ui";

type UserForm = UserFormValues;
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(form.email.trim()))
    return "Enter a valid email address.";
  if (form.phone && !/^[+\d()\s-]{7,20}$/u.test(form.phone))
    return "Enter a valid phone number.";
  if (!isEdit && form.password.length < 8)
    return "Password must be at least 8 characters.";
  return null;
}
function Form({
  error,
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
        <div className="lms-form-field">
          <FormInput autoFocus label="First name" name="firstName" />
        </div>
        <div className="lms-form-field">
          <FormInput label="Last name" name="lastName" />
        </div>
      </XStack>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <div className="lms-form-field">
          <FormInput label="Email" name="email" type="email" />
        </div>
        <div className="lms-form-field">
          <FormInput label="Phone" name="phone" />
        </div>
      </XStack>
      <div className="lms-form-field">
        <FormSelect
          label="Organization"
          name="organizationId"
          options={organizations.map((organization) => ({
            label: organization.name,
            value: String(organization.id),
          }))}
          placeholder="No organization"
        />
      </div>
      <div className="lms-form-field">
        <FormInput
          label={isEdit ? "New password (optional)" : "Password"}
          name="password"
          type="password"
        />
      </div>
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
      <CrudBadge
        tone={
          row.status === "ACTIVE"
            ? "success"
            : row.status === "SUSPENDED"
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
      permissionPrefix="students"
      queryFn={(query) =>
        studentsApi.findAll({
          limit: query.limit,
          page: query.page,
          search: query.search,
          status: query.status as StudentStatus | undefined,
        })
      }
      queryKey={["admin", "users"]}
      remove={(id) => studentsApi.remove(id)}
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
          organizations={organizationsQuery.data?.items ?? []}
        />
      )}
      statusOptions={[
        { label: "All", value: "ALL" },
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
        { label: "Alumni", value: "ALUMNI" },
        { label: "Suspended", value: "SUSPENDED" },
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
      formResolver={zodResolver(userSchema)}
      validate={(form, isEdit) => validate(form, isEdit)}
    />
  );
}
