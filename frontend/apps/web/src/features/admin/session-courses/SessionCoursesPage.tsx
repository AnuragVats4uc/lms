"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Clock3, FileText, ShieldCheck } from "lucide-react";
import { coursesApi, sessionCoursesApi } from "@repo/api";
import type {
  Course,
  CourseStatus,
  CreateSessionCourseRequest,
  SessionCourse,
  SessionCourseStatus,
  UpdateSessionCourseRequest,
} from "@repo/types";
import {
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudBadge, CrudDetailField, CrudDetailSection, CrudSelect } from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import { Text, XStack, YStack } from "@repo/ui";

type SessionCourseForm = {
  courseId: string;
  description: string;
  displayName: string;
  isPublished: boolean;
  sortOrder: string;
  status: SessionCourseStatus;
};

const initialForm: SessionCourseForm = {
  courseId: "",
  description: "",
  displayName: "",
  isPublished: false,
  sortOrder: "0",
  status: "DRAFT",
};
const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

function toCreate(form: SessionCourseForm): CreateSessionCourseRequest {
  const payload: CreateSessionCourseRequest = {
    courseId: Number(form.courseId),
    sortOrder: Number(form.sortOrder),
    status: form.status,
  };
  if (form.displayName.trim()) payload.displayName = form.displayName.trim();
  if (form.description.trim()) payload.description = form.description.trim();
  return payload;
}
function toUpdate(form: SessionCourseForm): UpdateSessionCourseRequest {
  return {
    description: form.description.trim() || undefined,
    displayName: form.displayName.trim() || undefined,
    isPublished: form.isPublished,
    sortOrder: Number(form.sortOrder),
    status: form.status,
  };
}
function validate(form: SessionCourseForm) {
  if (!Number(form.courseId)) return "Select a course.";
  if (!Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < 0)
    return "Sort order must be a non-negative whole number.";
  return null;
}

function Form({
  error,
  form,
  onChange,
  courses,
}: ResourceFormContext<SessionCourseForm> & { courses: Course[] }) {
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? (
        <Text color="#B42318" fontSize="$caption">
          {error}
        </Text>
      ) : null}
      <label className="lms-form-field">
        <span>Course</span>
        <select
          autoFocus
          onChange={(event) => onChange("courseId", event.currentTarget.value)}
          required
          value={form.courseId}
        >
          <option value="">Select course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
      </label>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <label className="lms-form-field">
          <span>Display name</span>
          <input
            onChange={(event) =>
              onChange("displayName", event.currentTarget.value)
            }
            placeholder="JEE Foundation - Morning"
            value={form.displayName}
          />
        </label>
        <label className="lms-form-field">
          <span>Sort order</span>
          <input
            min={0}
            onChange={(event) =>
              onChange("sortOrder", event.currentTarget.value)
            }
            type="number"
            value={form.sortOrder}
          />
        </label>
      </XStack>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <label className="lms-form-field">
          <span>Status</span>
          <select
            onChange={(event) =>
              onChange(
                "status",
                event.currentTarget.value as SessionCourseStatus,
              )
            }
            value={form.status}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="lms-form-checkbox">
          <input
            checked={form.isPublished}
            onChange={(event) =>
              onChange("isPublished", event.currentTarget.checked)
            }
            type="checkbox"
          />
          <span>Published in session</span>
        </label>
      </XStack>
      <label className="lms-form-field lms-form-field-wide">
        <span>Description</span>
        <textarea
          onChange={(event) =>
            onChange("description", event.currentTarget.value)
          }
          rows={4}
          value={form.description}
        />
      </label>
    </YStack>
  );
}

function statusTone(status: SessionCourseStatus) {
  return status === "ACTIVE"
    ? ("success" as const)
    : status === "INACTIVE"
      ? ("danger" as const)
      : status === "ARCHIVED"
        ? ("neutral" as const)
        : ("warning" as const);
}
const columns: DataTableColumn<SessionCourse>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.displayName ?? row.course.name}
        secondary={row.course.code}
      />
    ),
    header: "Course",
    id: "course",
    sticky: true,
    width: 280,
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
        primary={row.isPublished ? "Published" : "Draft"}
        secondary={"Order " + row.sortOrder}
      />
    ),
    header: "Visibility",
    id: "visibility",
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
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={String(row.sessionId)} />,
    header: "Session ID",
    id: "sessionId",
    width: 110,
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
];

export function SessionCoursesPage() {
  const academic = useAcademicSessions();
  const coursesQuery = useQuery({
    queryFn: () =>
      coursesApi.findAll({
        limit: 100,
        page: 1,
        status: "ACTIVE" as CourseStatus,
      }),
    queryKey: ["admin", "session-course-courses"],
    staleTime: 60_000,
  });
  const selectedSession = academic.sessions.find(
    (session) => session.id === academic.selectedSessionId,
  );
  const context = (
    <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
      {academic.organizations.length ? (
        <CrudSelect
          ariaLabel="Select organization"
          label="Organization"
          onChange={(value) => {
            academic.setSelectedOrganizationId(Number(value));
            academic.setSelectedSessionId(null);
          }}
          options={academic.organizations.map((organization) => ({
            label: organization.name,
            value: String(organization.id),
          }))}
          value={
            academic.selectedOrganizationId
              ? String(academic.selectedOrganizationId)
              : ""
          }
        />
      ) : null}
      <CrudSelect
        ariaLabel="Select session"
        label="Session"
        onChange={(value) => academic.setSelectedSessionId(Number(value))}
        options={academic.sessions.map((session) => ({
          label: session.name,
          value: String(session.id),
        }))}
        value={
          academic.selectedSessionId ? String(academic.selectedSessionId) : ""
        }
      />
    </XStack>
  );
  return (
    <CrudManagementPage<
      SessionCourse,
      SessionCourseForm,
      CreateSessionCourseRequest,
      UpdateSessionCourseRequest
    >
      columns={columns}
      context={context}
      create={(payload) =>
        academic.selectedSessionId === null
          ? Promise.reject(new Error("Select a session first."))
          : sessionCoursesApi.create(academic.selectedSessionId, payload)
      }
      description="Assign reusable courses to a session and control their session-specific publishing state."
      emptyDescription={
        selectedSession
          ? "Assign the first course to " + selectedSession.name + "."
          : "Select a session to view its courses."
      }
      enabled={academic.selectedSessionId !== null}
      entityLabel="Session Course"
      getStats={({ rows, total }) => [
        { icon: <BookOpen color="#059669" size={20} />, label: "Total Assignments", value: total },
        { icon: <ShieldCheck color="#059669" size={20} />, label: "Active Assignments", value: rows.filter((row) => row.status === "ACTIVE").length },
        { icon: <CalendarDays color="#2563EB" size={20} />, label: "Published", value: rows.filter((row) => row.isPublished).length },
        { icon: <Clock3 color="#64748B" size={20} />, label: "Archived", value: rows.filter((row) => row.status === "ARCHIVED").length },
      ]}
      getDisplayName={(item) => item.displayName ?? item.course.name}
      getIsActive={(item) => item.isActive}
      getRowId={(item) => item.id}
      initialForm={initialForm}
      permissionPrefix="session-course"
      queryFn={(query) =>
        academic.selectedSessionId === null
          ? Promise.reject(new Error("Select a session first."))
          : sessionCoursesApi.findAll(academic.selectedSessionId, {
              limit: query.limit,
              page: query.page,
              search: query.search,
              status: query.status as SessionCourseStatus | undefined,
            })
      }
      queryKey={["admin", "session-courses", academic.selectedSessionId]}
      renderDetails={(item) => (
        <YStack gap="$3">
          <CrudDetailSection icon={<BookOpen color="#059669" size={15} />} title="Assignment">
            <CrudDetailField icon={<BookOpen color="#059669" size={15} />} label="Course" value={`${item.course.name} (${item.course.code})`} />
            <CrudDetailField icon={<CalendarDays color="#059669" size={15} />} label="Session ID" value={item.sessionId} />
            <CrudDetailField icon={<Clock3 color="#059669" size={15} />} label="Sort order" value={item.sortOrder} />
          </CrudDetailSection>
          <CrudDetailSection icon={<ShieldCheck color="#059669" size={15} />} title="Publishing">
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Status" value={<CrudBadge align="start" tone={statusTone(item.status)}>{item.status}</CrudBadge>} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Published" value={item.isPublished ? "Yes" : "No"} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Active record" value={item.isActive ? "Yes" : "No"} />
          </CrudDetailSection>
          <CrudDetailSection icon={<FileText color="#059669" size={15} />} title="Description">
            <CrudDetailField icon={<FileText color="#059669" size={15} />} label="Description" value={item.description} />
          </CrudDetailSection>
      <Text color="#52627A" fontSize="$caption" style={{ display: "none" }}>
            Description: {item.description ?? "—"}
          </Text>
        </YStack>
      )}
      renderForm={(formContext) => (
        <Form {...formContext} courses={coursesQuery.data?.items ?? []} />
      )}
      remove={(id) =>
        academic.selectedSessionId === null
          ? Promise.reject(new Error("Select a session first."))
          : sessionCoursesApi.remove(academic.selectedSessionId, id)
      }
      setActive={(id, active) =>
        academic.selectedSessionId === null
          ? Promise.reject(new Error("Select a session first."))
          : sessionCoursesApi.update(academic.selectedSessionId, id, { isActive: active })
      }
      statusOptions={statusOptions}
      title="Session Courses"
      toCreatePayload={toCreate}
      toForm={(item) => ({
        courseId: String(item.courseId),
        description: item.description ?? "",
        displayName: item.displayName ?? "",
        isPublished: item.isPublished,
        sortOrder: String(item.sortOrder),
        status: item.status,
      })}
      toUpdatePayload={toUpdate}
      update={(id, payload) =>
        academic.selectedSessionId === null
          ? Promise.reject(new Error("Select a session first."))
          : sessionCoursesApi.update(academic.selectedSessionId, id, payload)
      }
      validate={validate}
    />
  );
}

export default SessionCoursesPage;
