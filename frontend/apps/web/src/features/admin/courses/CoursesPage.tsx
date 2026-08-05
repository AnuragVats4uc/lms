"use client";

import { coursesApi } from "@repo/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  Image,
  ShieldCheck,
} from "lucide-react";
import type {
  Course,
  CourseStatus,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "@repo/types";
import { courseSchema, type CourseFormValues } from "@repo/validation";
import {
  DataTableDateCell,
  DataTableTextCell,
  DataTableWebsiteCell,
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
import {
  FormInput,
  FormSelect,
  FormTextArea,
  Text,
  XStack,
  YStack,
} from "@repo/ui";

type CourseForm = CourseFormValues;

const initialForm: CourseForm = {
  code: "",
  description: "",
  durationInDays: "",
  name: "",
  status: "DRAFT",
  thumbnail: "",
};
const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

function toPayload(form: CourseForm): CreateCourseRequest {
  const payload: CreateCourseRequest = {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    status: form.status,
  };
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.thumbnail.trim()) payload.thumbnail = form.thumbnail.trim();
  if (form.durationInDays.trim())
    payload.durationInDays = Number(form.durationInDays);
  return payload;
}

function toUpdatePayload(form: CourseForm): UpdateCourseRequest {
  return toPayload(form);
}

function Form({ error }: ResourceFormContext<CourseForm>) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? (
        <Text color="#B42318" fontSize="$caption">
          {error}
        </Text>
      ) : null}
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <div className="lms-form-field">
          <FormInput
            autoFocus
            label="Name"
            name="name"
            placeholder="JEE Foundation"
          />
        </div>
        <div className="lms-form-field">
          <FormInput
            label="Code"
            name="code"
            placeholder="JEE-FDN"
            transform={(value) => value.toUpperCase()}
          />
        </div>
      </XStack>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <div className="lms-form-field">
          <FormInput
            label="Duration (days)"
            name="durationInDays"
            placeholder="365"
            type="number"
          />
        </div>
        <div className="lms-form-field">
          <FormSelect
            label="Status"
            name="status"
            options={[
              { label: "Draft", value: "DRAFT" },
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Archived", value: "ARCHIVED" },
            ]}
          />
        </div>
      </XStack>
      <div className="lms-form-field">
        <FormInput
          label="Thumbnail URL"
          name="thumbnail"
          placeholder="https://cdn.example.com/course.png"
          type="url"
        />
      </div>
      <div className="lms-form-field lms-form-field-wide">
        <FormTextArea
          label="Description"
          name="description"
          placeholder="Course description."
          rows={4}
        />
      </div>
    </YStack>
  );
}

function statusTone(status: CourseStatus) {
  return status === "ACTIVE"
    ? ("success" as const)
    : status === "INACTIVE"
      ? ("danger" as const)
      : status === "ARCHIVED"
        ? ("neutral" as const)
        : ("warning" as const);
}

const columns: DataTableColumn<Course>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell primary={row.name} secondary={row.code} />
    ),
    header: "Course",
    id: "name",
    sortable: true,
    sticky: true,
    width: 260,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={statusTone(row.status)}>{row.status}</CrudBadge>
    ),
    header: "Status",
    id: "status",
    width: 130,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.durationInDays ? row.durationInDays + " days" : "Not set"}
        secondary={row.isActive ? "Active record" : "Inactive record"}
      />
    ),
    header: "Duration",
    id: "duration",
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.description ?? "—"} />,
    header: "Description",
    id: "description",
    width: 280,
  },
  {
    cell: ({ row }) =>
      row.thumbnail ? (
        <DataTableWebsiteCell href={row.thumbnail} label="Open thumbnail" />
      ) : (
        <DataTableTextCell primary="-" />
      ),
    header: "Thumbnail",
    id: "thumbnail",
    width: 150,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={row.isActive ? "success" : "danger"}>
        {row.isActive ? "Active" : "Inactive"}
      </CrudBadge>
    ),
    header: "Lifecycle",
    id: "isActive",
    width: 120,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
    header: "Created",
    id: "createdAt",
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
    header: "Updated",
    id: "updatedAt",
    sortable: true,
    width: 150,
  },
];

function details(course: Course) {
  return (
    <YStack gap="$3">
      <CrudDetailSection
        icon={<BookOpen color="#059669" size={15} />}
        title="Course"
      >
        <CrudDetailField
          icon={<BookOpen color="#059669" size={15} />}
          label="Code"
          value={course.code}
        />
        <CrudDetailField
          icon={<ShieldCheck color="#059669" size={15} />}
          label="Status"
          value={
            <CrudBadge align="start" tone={statusTone(course.status)}>
              {course.status}
            </CrudBadge>
          }
        />
        <CrudDetailField
          icon={<Clock3 color="#059669" size={15} />}
          label="Duration"
          value={
            course.durationInDays ? `${course.durationInDays} days` : "Not set"
          }
        />
        <CrudDetailField
          icon={<FileText color="#059669" size={15} />}
          label="Description"
          value={course.description}
        />
      </CrudDetailSection>
      <YStack style={{ display: "none" }}>
        <Text color="#52627A" fontSize="$caption" style={{ display: "none" }}>
          Description: {course.description ?? "—"}
        </Text>
      </YStack>
      <CrudDetailSection
        icon={<Image color="#059669" size={15} />}
        title="Availability"
      >
        <CrudDetailField
          icon={<Image color="#059669" size={15} />}
          label="Thumbnail"
          value={course.thumbnail ?? "Not provided"}
        />
        <CrudDetailField
          icon={<ShieldCheck color="#059669" size={15} />}
          label="Active record"
          value={course.isActive ? "Yes" : "No"}
        />
      </CrudDetailSection>
      <CrudDetailSection
        icon={<CalendarDays color="#059669" size={15} />}
        title="Record history"
      >
        <CrudDetailField
          icon={<CalendarDays color="#059669" size={15} />}
          label="Created"
          value={new Date(course.createdAt).toLocaleString()}
        />
        <CrudDetailField
          icon={<Clock3 color="#059669" size={15} />}
          label="Last updated"
          value={new Date(course.updatedAt).toLocaleString()}
        />
      </CrudDetailSection>
    </YStack>
  );
}

export function CoursesPage() {
  return (
    <CrudManagementPage<
      Course,
      CourseForm,
      CreateCourseRequest,
      UpdateCourseRequest
    >
      columns={columns}
      create={(payload) => coursesApi.create(payload)}
      description="Manage reusable courses that can be assigned to academic sessions."
      emptyDescription="Create the first course to make it available for session assignments."
      entityLabel="Course"
      getStats={({ rows, total }) => [
        {
          icon: <BookOpen color="#059669" size={20} />,
          label: "Total Courses",
          value: total,
        },
        {
          icon: <ShieldCheck color="#059669" size={20} />,
          label: "Active Courses",
          value: rows.filter((row) => row.status === "ACTIVE").length,
        },
        {
          icon: <FileText color="#C2410C" size={20} />,
          label: "Draft Courses",
          value: rows.filter((row) => row.status === "DRAFT").length,
        },
        {
          icon: <Clock3 color="#64748B" size={20} />,
          label: "Archived Courses",
          value: rows.filter((row) => row.status === "ARCHIVED").length,
        },
      ]}
      getDisplayName={(course) => course.name}
      getIsActive={(course) => course.isActive}
      getRowId={(course) => course.id}
      initialForm={initialForm}
      permissionPrefix="course"
      queryFn={(query) =>
        coursesApi.findAll({
          limit: query.limit,
          page: query.page,
          search: query.search,
          status: query.status as CourseStatus | undefined,
        })
      }
      queryKey={["admin", "courses"]}
      renderDetails={details}
      renderForm={(context) => <Form {...context} />}
      remove={(id) => coursesApi.remove(id)}
      setActive={(id, active) => coursesApi.update(id, { isActive: active })}
      statusOptions={statusOptions}
      title="Courses"
      toCreatePayload={toPayload}
      toForm={(course) => ({
        code: course.code,
        description: course.description ?? "",
        durationInDays: course.durationInDays?.toString() ?? "",
        name: course.name,
        status: course.status,
        thumbnail: course.thumbnail ?? "",
      })}
      toUpdatePayload={toUpdatePayload}
      update={(id, payload) => coursesApi.update(id, payload)}
      formResolver={zodResolver(courseSchema)}
    />
  );
}

export default CoursesPage;
