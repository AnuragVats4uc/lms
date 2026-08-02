"use client";

import { coursesApi } from "@repo/api";
import type {
  Course,
  CourseStatus,
  CreateCourseRequest,
  UpdateCourseRequest,
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

type CourseForm = {
  code: string;
  description: string;
  durationInDays: string;
  name: string;
  status: CourseStatus;
  thumbnail: string;
};

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

function validate(form: CourseForm) {
  if (form.name.trim().length < 3)
    return "Course name must be at least 3 characters.";
  if (!form.code.trim()) return "Course code is required.";
  if (
    form.durationInDays &&
    (!Number.isInteger(Number(form.durationInDays)) ||
      Number(form.durationInDays) < 1)
  )
    return "Duration must be a positive whole number.";
  return null;
}

function Form({ error, form, onChange }: ResourceFormContext<CourseForm>) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? (
        <Text color="#B42318" fontSize="$caption">
          {error}
        </Text>
      ) : null}
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <label className="lms-form-field">
          <span>Name</span>
          <input
            autoFocus
            minLength={3}
            onChange={(event) => onChange("name", event.currentTarget.value)}
            placeholder="JEE Foundation"
            required
            value={form.name}
          />
        </label>
        <label className="lms-form-field">
          <span>Code</span>
          <input
            maxLength={30}
            onChange={(event) =>
              onChange("code", event.currentTarget.value.toUpperCase())
            }
            placeholder="JEE-FDN"
            required
            value={form.code}
          />
        </label>
      </XStack>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <label className="lms-form-field">
          <span>Duration (days)</span>
          <input
            min={1}
            onChange={(event) =>
              onChange("durationInDays", event.currentTarget.value)
            }
            placeholder="365"
            type="number"
            value={form.durationInDays}
          />
        </label>
        <label className="lms-form-field">
          <span>Status</span>
          <select
            onChange={(event) =>
              onChange("status", event.currentTarget.value as CourseStatus)
            }
            value={form.status}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </XStack>
      <label className="lms-form-field">
        <span>Thumbnail URL</span>
        <input
          onChange={(event) => onChange("thumbnail", event.currentTarget.value)}
          placeholder="https://cdn.example.com/course.png"
          type="url"
          value={form.thumbnail}
        />
      </label>
      <label className="lms-form-field lms-form-field-wide">
        <span>Description</span>
        <textarea
          onChange={(event) =>
            onChange("description", event.currentTarget.value)
          }
          placeholder="Course description."
          rows={4}
          value={form.description}
        />
      </label>
    </YStack>
  );
}

function statusTone(status: CourseStatus) {
  return status === "ACTIVE"
    ? ("green" as const)
    : status === "ARCHIVED" || status === "INACTIVE"
      ? ("gray" as const)
      : ("orange" as const);
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
      <DataTableBadgeCell label={row.status} tone={statusTone(row.status)} />
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
    cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
    header: "Updated",
    id: "updatedAt",
    sortable: true,
    width: 150,
  },
];

function details(course: Course) {
  return (
    <YStack gap="$2">
      <Text color="#52627A" fontSize="$caption">
        Code: {course.code}
      </Text>
      <Text color="#52627A" fontSize="$caption">
        Status: {course.status}
      </Text>
      <Text color="#52627A" fontSize="$caption">
        Created: {new Date(course.createdAt).toLocaleString()}
      </Text>
      <Text color="#52627A" fontSize="$caption">
        Description: {course.description ?? "—"}
      </Text>
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
      getDisplayName={(course) => course.name}
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
      validate={validate}
    />
  );
}

export default CoursesPage;
