"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  organizationsApi,
  registrationApi,
  sessionCoursesApi,
  sessionsApi,
  studentsApi,
} from "@repo/api";
import { useAuthSession } from "@repo/auth";
import type {
  CreateStudentRequest,
  Student,
  StudentStatus,
  UpdateStudentRequest,
} from "@repo/types";
import { type StudentFormValues, studentSchema } from "@repo/validation";
import {
  BookOpen,
  BarChart3,
  CalendarDays,
  Eye,
  EyeOff,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
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
import { Text, YStack } from "@repo/ui";

type StudentForm = StudentFormValues;

const initialForm: StudentForm = {
  admissionNumber: "",
  dateOfBirth: "",
  digitalLibraryLocationUuid: "",
  educationOptionUuid: "",
  email: "",
  firstName: "",
  gender: "",
  lastName: "",
  organizationId: "",
  password: "",
  phone: "",
  rollNumber: "",
  sessionCourseIds: [],
  sessionId: "",
  studentCode: "",
};

function toCreate(form: StudentForm): CreateStudentRequest {
  const payload: CreateStudentRequest = {
    dateOfBirth: form.dateOfBirth,
    digitalLibraryLocationUuid: form.digitalLibraryLocationUuid,
    educationOptionUuid: form.educationOptionUuid,
    email: form.email.trim().toLowerCase(),
    firstName: form.firstName.trim(),
    gender: form.gender,
    password: form.password,
    phone: form.phone.trim(),
    sessionCourseIds: form.sessionCourseIds.map(Number),
    sessionId: Number(form.sessionId),
  };

  if (form.admissionNumber.trim()) {
    payload.admissionNumber = form.admissionNumber.trim();
  }
  if (form.lastName.trim()) payload.lastName = form.lastName.trim();
  if (form.organizationId) payload.organizationId = Number(form.organizationId);
  if (form.rollNumber.trim()) payload.rollNumber = form.rollNumber.trim();
  if (form.studentCode.trim()) payload.studentCode = form.studentCode.trim();

  return payload;
}

function toUpdate(form: StudentForm): UpdateStudentRequest {
  const payload: UpdateStudentRequest = {
    dateOfBirth: form.dateOfBirth || undefined,
    email: form.email.trim().toLowerCase(),
    firstName: form.firstName.trim(),
    gender: form.gender || undefined,
    phone: form.phone.trim() || undefined,
  };

  if (form.admissionNumber.trim()) {
    payload.admissionNumber = form.admissionNumber.trim();
  }
  if (form.lastName.trim()) payload.lastName = form.lastName.trim();
  if (form.organizationId) payload.organizationId = Number(form.organizationId);
  if (form.password) payload.password = form.password;
  if (form.rollNumber.trim()) payload.rollNumber = form.rollNumber.trim();
  if (form.studentCode.trim()) payload.studentCode = form.studentCode.trim();

  return payload;
}

function validate(form: StudentForm, isEdit = false) {
  if (isEdit) {
    if (form.firstName.trim().length < 2) {
      return "First name must be at least 2 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(form.email.trim())) {
      return "Enter a valid email address.";
    }
    if (form.phone && !/^[+\d()\s-]{7,20}$/u.test(form.phone)) {
      return "Enter a valid phone number.";
    }
    if (form.password && form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    return null;
  }

  if (!form.organizationId) return "Select an organization.";
  const result = studentSchema.safeParse(form);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "Please correct the form.";
  }
  return null;
}

function StudentFormFields({
  error,
  form,
  isEdit,
  isSuperAdmin,
  onChange,
  organizations,
}: ResourceFormContext<StudentForm> & {
  isSuperAdmin: boolean;
  organizations: { id: number; name: string }[];
}) {
  const organizationId = form.organizationId ? Number(form.organizationId) : 0;
  const sessionId = form.sessionId ? Number(form.sessionId) : 0;

  const sessionsQuery = useQuery({
    enabled: organizationId > 0 && !isEdit,
    queryFn: () => sessionsApi.findAll(organizationId, { limit: 100, page: 1 }),
    queryKey: ["admin", "student-form-sessions", organizationId],
    staleTime: 60_000,
  });
  const sessionCoursesQuery = useQuery({
    enabled: sessionId > 0 && !isEdit,
    queryFn: () =>
      sessionCoursesApi.findAll(sessionId, {
        limit: 100,
        status: "ACTIVE",
      }),
    queryKey: ["admin", "student-form-session-courses", sessionId],
    staleTime: 60_000,
  });
  const educationOptionsQuery = useQuery({
    enabled: organizationId > 0 && !isEdit,
    queryFn: () =>
      registrationApi.listEducationOptions(organizationId, {
        isActive: true,
        limit: 100,
      }),
    queryKey: ["admin", "student-form-education-options", organizationId],
    staleTime: 60_000,
  });
  const digitalLibraryLocationsQuery = useQuery({
    enabled: organizationId > 0 && !isEdit,
    queryFn: () =>
      registrationApi.listDigitalLibraryLocations(organizationId, {
        isActive: true,
        limit: 100,
      }),
    queryKey: ["admin", "student-form-library-locations", organizationId],
    staleTime: 60_000,
  });

  const sessions = sessionsQuery.data?.items ?? [];
  const sessionCourses = (sessionCoursesQuery.data?.items ?? []).filter(
    (item) =>
      item.isActive &&
      item.isPublished &&
      item.status === "ACTIVE" &&
      item.course.isActive &&
      item.course.status === "ACTIVE",
  );

  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? (
        <Text color="#B42318" fontSize="$caption">
          {error}
        </Text>
      ) : null}
      <div className="lms-organization-form-grid">
        {isSuperAdmin ? (
          <SelectField
            label="Organization"
            onChange={(value) => {
              onChange("organizationId", value);
              onChange("sessionId", "");
              onChange("sessionCourseIds", []);
              onChange("educationOptionUuid", "");
              onChange("digitalLibraryLocationUuid", "");
            }}
            options={organizations.map((organization) => ({
              label: organization.name,
              value: String(organization.id),
            }))}
            value={form.organizationId}
          />
        ) : null}
        {!isEdit ? (
          <>
            <SelectField
              label="Session"
              onChange={(value) => {
                onChange("sessionId", value);
                onChange("sessionCourseIds", []);
              }}
              options={sessions.map((session) => ({
                label: session.name,
                value: String(session.id),
              }))}
              value={form.sessionId}
            />
            <SelectField
              label="Education"
              onChange={(value) => onChange("educationOptionUuid", value)}
              options={(educationOptionsQuery.data?.items ?? []).map(
                (option) => ({
                  label: option.name,
                  value: option.uuid,
                }),
              )}
              value={form.educationOptionUuid}
            />
            <SelectField
              label="Digital Library Location"
              onChange={(value) =>
                onChange("digitalLibraryLocationUuid", value)
              }
              options={(digitalLibraryLocationsQuery.data?.items ?? []).map(
                (location) => ({
                  label: location.name,
                  value: location.uuid,
                }),
              )}
              value={form.digitalLibraryLocationUuid}
            />
          </>
        ) : null}
        <TextField
          autoFocus
          label="First name"
          onChange={(value) => onChange("firstName", value)}
          value={form.firstName}
        />
        <TextField
          label="Last name"
          onChange={(value) => onChange("lastName", value)}
          value={form.lastName}
        />
        <SelectField
          label="Gender"
          onChange={(value) => onChange("gender", value)}
          options={[
            { label: "Female", value: "Female" },
            { label: "Male", value: "Male" },
            { label: "Other", value: "Other" },
          ]}
          value={form.gender}
        />
        <TextField
          label="Date of birth"
          onChange={(value) => onChange("dateOfBirth", value)}
          type="date"
          value={form.dateOfBirth}
        />
        <TextField
          label="Mobile number"
          onChange={(value) => onChange("phone", value)}
          value={form.phone}
        />
        <TextField
          label="Email"
          onChange={(value) => onChange("email", value)}
          type="email"
          value={form.email}
        />
        <TextField
          label="Student code"
          onChange={(value) => onChange("studentCode", value)}
          value={form.studentCode}
        />
        <TextField
          label="Admission number"
          onChange={(value) => onChange("admissionNumber", value)}
          value={form.admissionNumber}
        />
        <TextField
          label="Roll number"
          onChange={(value) => onChange("rollNumber", value)}
          value={form.rollNumber}
        />
        <PasswordField
          label={isEdit ? "New password (optional)" : "Password"}
          onChange={(value) => onChange("password", value)}
          value={form.password}
        />
        {!isEdit ? (
          <CoursePicker
            courses={sessionCourses.map((sessionCourse) => ({
              code: sessionCourse.course.code,
              label: sessionCourse.displayName ?? sessionCourse.course.name,
              value: String(sessionCourse.id),
            }))}
            selected={form.sessionCourseIds}
            onChange={(value) => onChange("sessionCourseIds", value)}
          />
        ) : null}
      </div>
    </YStack>
  );
}

const columns: DataTableColumn<Student>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={[row.firstName, row.lastName].filter(Boolean).join(" ")}
        secondary={row.studentCode}
      />
    ),
    header: "Student",
    id: "student",
    sticky: true,
    width: 260,
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
      <DataTableTextCell
        primary={row.enrollments?.[0]?.session.name ?? "Not enrolled"}
        secondary={row.enrollments?.[0]?.courses
          .map((course) => course.name)
          .join(", ")}
      />
    ),
    header: "Enrollment",
    id: "enrollment",
    width: 260,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={row.status === "ACTIVE" ? "success" : "warning"}>
        {row.status}
      </CrudBadge>
    ),
    header: "Status",
    id: "status",
    width: 130,
  },
  {
    cell: ({ row }) => <DataTableEmailCell href={row.email} />,
    header: "Email",
    id: "email",
    width: 220,
  },
  {
    cell: ({ row }) => <DataTablePhoneCell value={row.phone} />,
    header: "Phone",
    id: "phone",
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
    header: "Created",
    id: "createdAt",
    width: 150,
  },
];

export function StudentsPage() {
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const isSuperAdmin = Boolean(currentUser?.roles.includes("SUPER_ADMIN"));
  const organizationId = currentUser?.organizationId ?? undefined;
  const organizationsQuery = useQuery({
    enabled: isSuperAdmin,
    queryFn: () => organizationsApi.findAll({ limit: 100, page: 1 }),
    queryKey: ["admin", "student-organizations"],
    staleTime: 60_000,
  });
  const organizations = useMemo(
    () => organizationsQuery.data?.items ?? [],
    [organizationsQuery.data],
  );
  const defaultOrganizationId = useMemo(
    () => organizationId ?? organizations[0]?.id,
    [organizationId, organizations],
  );

  return (
    <CrudManagementPage<
      Student,
      StudentForm,
      CreateStudentRequest,
      UpdateStudentRequest
    >
      columns={columns}
      additionalRowActions={[
        {
          icon: BarChart3,
          id: "activity-report",
          label: "Activity report",
          onAction: (student) =>
            router.push(`/admin/students/${student.uuid}/activity`),
        },
      ]}
      create={(payload) => studentsApi.create(payload)}
      createLabel="Register Student"
      description="Register students, assign their organization, session, and courses."
      entityLabel="Student"
      getCreateForm={() => ({
        ...initialForm,
        organizationId: defaultOrganizationId
          ? String(defaultOrganizationId)
          : "",
      })}
      getDisplayName={(student) =>
        [student.firstName, student.lastName].filter(Boolean).join(" ")
      }
      getRowId={(student) => student.id}
      getStats={({ rows, total }) => [
        {
          icon: <UsersRound color="#059669" size={20} />,
          label: "Total Students",
          value: total,
        },
        {
          icon: <GraduationCap color="#2563EB" size={20} />,
          label: "Active Students",
          value: rows.filter((row) => row.status === "ACTIVE").length,
        },
        {
          icon: <BookOpen color="#7C3AED" size={20} />,
          label: "Enrolled",
          value: rows.filter((row) => row.enrollments?.length).length,
        },
        {
          icon: <UserRound color="#64748B" size={20} />,
          label: "Verified",
          value: rows.filter((row) => row.isVerified).length,
        },
      ]}
      initialForm={initialForm}
      permissionPrefix="students"
      queryFn={(query) =>
        studentsApi.findAll({
          limit: query.limit,
          organizationId,
          page: query.page,
          search: query.search,
          status: query.status as StudentStatus | undefined,
        })
      }
      queryKey={["admin", "students", organizationId ?? "all"]}
      remove={(id) => studentsApi.remove(id)}
      renderDetails={(student) => (
        <YStack gap="$3">
          <CrudDetailSection
            icon={<UserRound color="#059669" size={15} />}
            title="Profile"
          >
            <CrudDetailField
              icon={<UserRound color="#059669" size={15} />}
              label="Name"
              value={[student.firstName, student.lastName]
                .filter(Boolean)
                .join(" ")}
            />
            <CrudDetailField
              icon={<Mail color="#059669" size={15} />}
              label="Email"
              value={student.email}
            />
            <CrudDetailField
              icon={<Phone color="#059669" size={15} />}
              label="Mobile"
              value={student.phone}
            />
            <CrudDetailField
              icon={<UserRound color="#059669" size={15} />}
              label="Organization"
              value={student.organization?.name ?? "Unassigned"}
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<BookOpen color="#059669" size={15} />}
            title="Enrollment"
          >
            <CrudDetailField
              icon={<CalendarDays color="#059669" size={15} />}
              label="Session"
              value={student.enrollments?.[0]?.session.name ?? "Not enrolled"}
            />
            <CrudDetailField
              icon={<BookOpen color="#059669" size={15} />}
              label="Courses"
              value={
                student.enrollments?.[0]?.courses
                  .map((course) => course.name)
                  .join(", ") || "No courses assigned"
              }
            />
          </CrudDetailSection>
        </YStack>
      )}
      renderForm={(context) => (
        <StudentFormFields
          {...context}
          isSuperAdmin={isSuperAdmin}
          organizations={organizations}
        />
      )}
      searchPlaceholder="Search students by name, email, code..."
      statusOptions={[
        { label: "All", value: "ALL" },
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
        { label: "Alumni", value: "ALUMNI" },
        { label: "Suspended", value: "SUSPENDED" },
      ]}
      title="Students"
      toCreatePayload={toCreate}
      toForm={(student) => ({
        admissionNumber: student.admissionNumber ?? "",
        dateOfBirth: student.profile?.dateOfBirth
          ? student.profile.dateOfBirth.slice(0, 10)
          : "",
        digitalLibraryLocationUuid: "",
        educationOptionUuid: "",
        email: student.email,
        firstName: student.firstName,
        gender: student.profile?.gender ?? "",
        lastName: student.lastName ?? "",
        organizationId: student.organizationId?.toString() ?? "",
        password: "",
        phone: student.phone ?? "",
        rollNumber: student.rollNumber ?? "",
        sessionCourseIds:
          student.enrollments?.[0]?.courses.map((course) =>
            String(course.id),
          ) ?? [],
        sessionId: student.enrollments?.[0]?.session.id
          ? String(student.enrollments[0].session.id)
          : "",
        studentCode: student.studentCode ?? "",
      })}
      toUpdatePayload={toUpdate}
      update={(id, payload) => studentsApi.update(id, payload)}
      validate={(form, isEdit) => validate(form, isEdit)}
    />
  );
}

function TextField({
  autoFocus,
  label,
  onChange,
  type = "text",
  value,
}: {
  autoFocus?: boolean;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="lms-form-field">
      <span>{label}</span>
      <input
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="lms-form-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PasswordField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="lms-form-field">
      <span>{label}</span>
      <div className="lms-password-field">
        <input
          onChange={(event) => onChange(event.target.value)}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <Icon size={16} />
        </button>
      </div>
    </label>
  );
}

function CoursePicker({
  courses,
  onChange,
  selected,
}: {
  courses: Array<{ code: string; label: string; value: string }>;
  onChange: (value: string[]) => void;
  selected: string[];
}) {
  const selectedSet = new Set(selected);

  return (
    <div className="lms-form-field lms-form-field-wide">
      <span>Courses</span>
      <div className="lms-student-course-picker">
        {courses.length ? (
          courses.map((course) => {
            const checked = selectedSet.has(course.value);
            return (
              <label key={course.value}>
                <input
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked
                        ? selected.filter((value) => value !== course.value)
                        : [...selected, course.value],
                    )
                  }
                  type="checkbox"
                />
                <span>
                  <strong>{course.label}</strong>
                  <small>{course.code}</small>
                </span>
              </label>
            );
          })
        ) : (
          <p>Select a session with active published courses.</p>
        )}
      </div>
    </div>
  );
}
