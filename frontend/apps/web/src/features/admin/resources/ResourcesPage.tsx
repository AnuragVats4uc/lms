"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { foldersApi, resourcesApi, sessionCoursesApi } from "@repo/api";
import {
  CalendarDays,
  Clock3,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  ShieldCheck,
  Video,
} from "lucide-react";
import type {
  CreateResourceRequest,
  FolderTreeNode,
  Resource,
  ResourceStatus,
  ResourceType,
  UpdateResourceRequest,
} from "@repo/types";
import { resourceSchema, type ResourceFormValues } from "@repo/validation";
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
  CrudFormSelect,
  CrudSelect,
} from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import {
  FormCheckbox,
  FormInput,
  FormTextArea,
  Text,
  XStack,
  YStack,
} from "@repo/ui";

type ResourceForm = ResourceFormValues;

type FolderOption = { id: number; label: string };

const initialForm: ResourceForm = {
  description: "",
  documentUrl: "",
  durationInSeconds: "",
  examId: "",
  fileSize: "",
  isDownloadable: true,
  isPublished: false,
  mimeType: "",
  sortOrder: "0",
  status: "DRAFT",
  thumbnail: "",
  title: "",
  type: "DOCUMENT",
  videoUrl: "",
};

const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
];
const typeOptions = [
  { label: "All", value: "ALL" },
  { label: "Documents", value: "DOCUMENT" },
  { label: "Videos", value: "VIDEO" },
  { label: "Exams", value: "EXAM" },
];
const publishedOptions = [
  { label: "All", value: "ALL" },
  { label: "Published", value: "true" },
  { label: "Unpublished", value: "false" },
];

function flattenFolders(
  nodes: FolderTreeNode[],
  parentPath = "",
): FolderOption[] {
  return nodes.flatMap((node) => {
    const path = parentPath ? parentPath + " / " + node.name : node.name;
    return [
      { id: node.id, label: path },
      ...flattenFolders(node.children, path),
    ];
  });
}

function toPayload(form: ResourceForm): CreateResourceRequest {
  const payload: CreateResourceRequest = {
    isDownloadable: form.isDownloadable,
    isPublished: form.isPublished,
    sortOrder: Number(form.sortOrder),
    status: form.status,
    title: form.title.trim(),
    type: form.type,
  };
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.thumbnail.trim()) payload.thumbnail = form.thumbnail.trim();
  if (form.mimeType.trim()) payload.mimeType = form.mimeType.trim();
  if (form.fileSize.trim()) payload.fileSize = form.fileSize.trim();
  if (form.durationInSeconds.trim())
    payload.durationInSeconds = Number(form.durationInSeconds);
  if (form.type === "DOCUMENT") payload.documentUrl = form.documentUrl.trim();
  if (form.type === "VIDEO") payload.videoUrl = form.videoUrl.trim();
  if (form.type === "EXAM") payload.examId = Number(form.examId);
  return payload;
}

function ResourceForm({ error }: ResourceFormContext<ResourceForm>) {
  const type = useWatch<ResourceForm, "type">({ name: "type" });
  return (
    <YStack className="lms-organization-form" gap="$3">
      {error ? (
        <Text color="#B42318" fontSize="$caption">
          {error}
        </Text>
      ) : null}
      <XStack className="lms-organization-form-grid" gap="$3">
        <div className="lms-form-field">
          <FormInput
            autoFocus
            label="Title"
            name="title"
            placeholder="Motion Notes"
          />
        </div>
        <div className="lms-form-field">
          <CrudFormSelect
            label="Type"
            name="type"
            options={[
              { label: "Document", value: "DOCUMENT" },
              { label: "Video", value: "VIDEO" },
              { label: "Exam", value: "EXAM" },
            ]}
          />
        </div>
      </XStack>
      {type === "DOCUMENT" ? (
        <XStack className="lms-organization-form-grid" gap="$3">
          <div className="lms-form-field">
            <FormInput
              label="Document URL"
              name="documentUrl"
              placeholder="https://cdn.example.com/notes.pdf"
              type="url"
            />
          </div>
          <div className="lms-form-field">
            <FormInput
              label="MIME type"
              name="mimeType"
              placeholder="application/pdf"
            />
          </div>
        </XStack>
      ) : null}
      {type === "VIDEO" ? (
        <XStack className="lms-organization-form-grid" gap="$3">
          <div className="lms-form-field">
            <FormInput
              label="Video URL"
              name="videoUrl"
              placeholder="https://cdn.example.com/lecture.mp4"
              type="url"
            />
          </div>
          <div className="lms-form-field">
            <FormInput
              label="Duration (seconds)"
              name="durationInSeconds"
              type="number"
            />
          </div>
        </XStack>
      ) : null}
      {type === "EXAM" ? (
        <YStack gap="$2">
          <div className="lms-form-field">
            <FormInput
              label="Exam ID"
              name="examId"
              placeholder="Exam module ID"
              type="number"
            />
          </div>
          <Text color="#9A3412" fontSize="$caption">
            The Exam module is not present in this backend yet. Enter the future
            Exam record ID.
          </Text>
        </YStack>
      ) : null}
      <XStack className="lms-organization-form-grid" gap="$3">
        <div className="lms-form-field">
          <FormInput
            label="File size (bytes)"
            name="fileSize"
            placeholder="204800"
            type="number"
          />
        </div>
        <div className="lms-form-field">
          <FormInput label="Sort order" name="sortOrder" type="number" />
        </div>
      </XStack>
      <XStack className="lms-organization-form-grid" gap="$3">
        <div className="lms-form-field">
          <CrudFormSelect
            label="Status"
            name="status"
            options={[
              { label: "Draft", value: "DRAFT" },
              { label: "Published", value: "PUBLISHED" },
              { label: "Archived", value: "ARCHIVED" },
            ]}
          />
        </div>
        <div className="lms-form-field">
          <FormInput label="Thumbnail URL" name="thumbnail" type="url" />
        </div>
      </XStack>
      <XStack gap="$4" style={{ flexWrap: "wrap" }}>
        <FormCheckbox checkboxLabel="Published" name="isPublished" />
        <FormCheckbox checkboxLabel="Downloadable" name="isDownloadable" />
      </XStack>
      <div className="lms-form-field lms-form-field-wide">
        <FormTextArea label="Description" name="description" rows={4} />
      </div>
    </YStack>
  );
}

function resourceTone(type: ResourceType) {
  return type === "VIDEO"
    ? ("info" as const)
    : type === "EXAM"
      ? ("warning" as const)
      : ("success" as const);
}

function statusTone(status: ResourceStatus) {
  return status === "PUBLISHED"
    ? ("success" as const)
    : status === "ARCHIVED"
      ? ("neutral" as const)
      : ("warning" as const);
}

const columns: DataTableColumn<Resource>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.title}
        secondary={row.description ?? "No description"}
      />
    ),
    header: "Resource",
    id: "title",
    sticky: true,
    width: 280,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={resourceTone(row.type)}>{row.type}</CrudBadge>
    ),
    header: "Type",
    id: "type",
    width: 130,
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
        primary={row.isPublished ? "Published" : "Unpublished"}
        secondary={row.isDownloadable ? "Downloadable" : "View only"}
      />
    ),
    header: "Visibility",
    id: "visibility",
    width: 160,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={
          row.type === "EXAM"
            ? "Exam #" + row.examId
            : row.type === "VIDEO"
              ? (row.durationInSeconds ?? 0) + " seconds"
              : row.fileSize
                ? row.fileSize + " bytes"
                : "File size not set"
        }
      />
    ),
    header: "Content",
    id: "content",
    width: 180,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
    header: "Updated",
    id: "updatedAt",
    width: 150,
  },
  {
    cell: ({ row }) =>
      row.type === "DOCUMENT" && row.documentUrl ? (
        <DataTableWebsiteCell href={row.documentUrl} label="Open document" />
      ) : row.type === "VIDEO" && row.videoUrl ? (
        <DataTableWebsiteCell href={row.videoUrl} label="Open video" />
      ) : (
        <DataTableTextCell
          primary={row.type === "EXAM" ? `Exam #${row.examId ?? "-"}` : "-"}
        />
      ),
    header: "Source",
    id: "source",
    width: 160,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.mimeType ?? "-"} />,
    header: "MIME type",
    id: "mimeType",
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.thumbnail ?? "-"} />,
    header: "Thumbnail",
    id: "thumbnail",
    width: 180,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={String(row.sortOrder)} />,
    header: "Order",
    id: "sortOrder",
    width: 90,
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
];

function details(resource: Resource) {
  return (
    <YStack gap="$3">
      <CrudDetailSection
        icon={<FolderOpen color="#059669" size={15} />}
        title="Resource"
      >
        <CrudDetailField
          icon={<FileText color="#059669" size={15} />}
          label="Type"
          value={
            <CrudBadge tone={resourceTone(resource.type)}>
              {resource.type}
            </CrudBadge>
          }
        />
        <CrudDetailField
          icon={<ShieldCheck color="#059669" size={15} />}
          label="Status"
          value={
            <CrudBadge tone={statusTone(resource.status)}>
              {resource.status}
            </CrudBadge>
          }
        />
        <CrudDetailField
          icon={<FolderOpen color="#059669" size={15} />}
          label="Folder ID"
          value={resource.folderId}
        />
        <CrudDetailField
          icon={<Clock3 color="#059669" size={15} />}
          label="Sort order"
          value={resource.sortOrder}
        />
      </CrudDetailSection>
      <CrudDetailSection
        icon={<Video color="#059669" size={15} />}
        title="Access and source"
      >
        <CrudDetailField
          icon={<ShieldCheck color="#059669" size={15} />}
          label="Published"
          value={resource.isPublished ? "Yes" : "No"}
        />
        <CrudDetailField
          icon={<ShieldCheck color="#059669" size={15} />}
          label="Downloadable"
          value={resource.isDownloadable ? "Yes" : "No"}
        />
        <CrudDetailField
          icon={<ShieldCheck color="#059669" size={15} />}
          label="Active record"
          value={resource.isActive ? "Yes" : "No"}
        />
        <CrudDetailField
          icon={<FileText color="#059669" size={15} />}
          label="MIME type"
          value={resource.mimeType}
        />
        <CrudDetailField
          icon={<ImageIcon color="#059669" size={15} />}
          label="Thumbnail"
          value={resource.thumbnail}
        />
        <CrudDetailField
          icon={<Clock3 color="#059669" size={15} />}
          label="File size"
          value={resource.fileSize ? `${resource.fileSize} bytes` : "Not set"}
        />
        <CrudDetailField
          icon={<Video color="#059669" size={15} />}
          label="Duration"
          value={
            resource.durationInSeconds !== null
              ? `${resource.durationInSeconds} seconds`
              : "Not set"
          }
        />
      </CrudDetailSection>
      <CrudDetailSection
        icon={<CalendarDays color="#059669" size={15} />}
        title="Record history"
      >
        <CrudDetailField
          icon={<CalendarDays color="#059669" size={15} />}
          label="Created"
          value={new Date(resource.createdAt).toLocaleString()}
        />
        <CrudDetailField
          icon={<Clock3 color="#059669" size={15} />}
          label="Last updated"
          value={new Date(resource.updatedAt).toLocaleString()}
        />
      </CrudDetailSection>
      <Text color="#52627A" fontSize="$caption" style={{ display: "none" }}>
        Description: {resource.description ?? "—"}
      </Text>
    </YStack>
  );
}

export function ResourcesPage() {
  const searchParams = useSearchParams();
  const academic = useAcademicSessions();
  const {
    selectedOrganizationId,
    selectedSessionId,
    setSelectedOrganizationId,
    setSelectedSessionId,
  } = academic;
  const requestedOrganizationId =
    Number(searchParams.get("organizationId")) || null;
  const requestedSessionId = Number(searchParams.get("sessionId")) || null;
  const requestedSessionCourseId =
    Number(searchParams.get("sessionCourseId")) || null;
  const requestedFolderId = Number(searchParams.get("folderId")) || null;
  const [selectedSessionCourseId, setSelectedSessionCourseId] = useState<
    number | null
  >(requestedSessionCourseId);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    requestedFolderId,
  );

  useEffect(() => {
    if (
      requestedOrganizationId !== null &&
      selectedOrganizationId !== requestedOrganizationId
    ) {
      setSelectedOrganizationId(requestedOrganizationId);
    }
    if (
      requestedSessionId !== null &&
      selectedSessionId !== requestedSessionId
    ) {
      setSelectedSessionId(requestedSessionId);
    }
  }, [
    requestedOrganizationId,
    requestedSessionId,
    selectedOrganizationId,
    selectedSessionId,
    setSelectedOrganizationId,
    setSelectedSessionId,
  ]);
  const sessionCoursesQuery = useQuery({
    enabled: academic.selectedSessionId !== null,
    queryFn: () =>
      sessionCoursesApi.findAll(academic.selectedSessionId as number, {
        limit: 100,
        page: 1,
      }),
    queryKey: ["admin", "resource-session-courses", academic.selectedSessionId],
    staleTime: 60_000,
  });
  const sessionCourses = sessionCoursesQuery.data?.items ?? [];
  const effectiveSessionCourseId =
    selectedSessionCourseId ?? sessionCourses[0]?.id ?? null;
  const folderTreeQuery = useQuery({
    enabled: effectiveSessionCourseId !== null,
    queryFn: () => foldersApi.findTree(effectiveSessionCourseId as number),
    queryKey: ["admin", "resource-folder-tree", effectiveSessionCourseId],
    staleTime: 60_000,
  });
  const folderOptions = useMemo(
    () => flattenFolders(folderTreeQuery.data ?? []),
    [folderTreeQuery.data],
  );
  const effectiveFolderId =
    selectedFolderId ??
    folderOptions.find((folder) => folder.label.endsWith("Motion"))?.id ??
    folderOptions[0]?.id ??
    null;
  const selectedFolder = folderOptions.find(
    (folder) => folder.id === effectiveFolderId,
  );
  const context = (
    <YStack gap="$3">
      <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
        {academic.organizations.length ? (
          <CrudSelect
            ariaLabel="Select organization"
            label="Organization"
            onChange={(value) => {
              academic.setSelectedOrganizationId(Number(value));
              academic.setSelectedSessionId(null);
              setSelectedSessionCourseId(null);
              setSelectedFolderId(null);
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
          onChange={(value) => {
            academic.setSelectedSessionId(Number(value));
            setSelectedSessionCourseId(null);
            setSelectedFolderId(null);
          }}
          options={academic.sessions.map((session) => ({
            label: session.name,
            value: String(session.id),
          }))}
          value={
            academic.selectedSessionId ? String(academic.selectedSessionId) : ""
          }
        />
        <CrudSelect
          ariaLabel="Select session course"
          label="Session course"
          onChange={(value) => {
            setSelectedSessionCourseId(Number(value));
            setSelectedFolderId(null);
          }}
          options={sessionCourses.map((item) => ({
            label: item.displayName ?? item.course.name,
            value: String(item.id),
          }))}
          value={
            effectiveSessionCourseId ? String(effectiveSessionCourseId) : ""
          }
        />
        <CrudSelect
          ariaLabel="Select folder"
          label="Folder"
          onChange={(value) => setSelectedFolderId(Number(value))}
          options={folderOptions.map((folder) => ({
            label: folder.label,
            value: String(folder.id),
          }))}
          value={effectiveFolderId ? String(effectiveFolderId) : ""}
        />
      </XStack>
      {selectedFolder ? (
        <Text color="#52627A" fontSize="$caption">
          Managing resources in {selectedFolder.label}.
        </Text>
      ) : null}
    </YStack>
  );
  return (
    <CrudManagementPage<
      Resource,
      ResourceForm,
      CreateResourceRequest,
      UpdateResourceRequest
    >
      columns={columns}
      context={context}
      create={(payload) =>
        effectiveFolderId === null
          ? Promise.reject(new Error("Select a folder first."))
          : resourcesApi.create(effectiveFolderId, payload)
      }
      description="Manage documents, videos, and exams stored inside course folders."
      emptyDescription={
        effectiveFolderId === null
          ? "Select a folder to view its resources."
          : "Create the first learning resource in this folder."
      }
      enabled={effectiveFolderId !== null}
      entityLabel="Resource"
      getStats={({ rows, total }) => [
        {
          icon: <FolderOpen color="#059669" size={20} />,
          label: "Total Resources",
          value: total,
        },
        {
          icon: <FileText color="#059669" size={20} />,
          label: "Documents",
          value: rows.filter((row) => row.type === "DOCUMENT").length,
        },
        {
          icon: <Video color="#2563EB" size={20} />,
          label: "Videos",
          value: rows.filter((row) => row.type === "VIDEO").length,
        },
        {
          icon: <ShieldCheck color="#059669" size={20} />,
          label: "Published",
          value: rows.filter((row) => row.isPublished).length,
        },
      ]}
      getDisplayName={(resource) => resource.title}
      getIsActive={(resource) => resource.isActive}
      getRowId={(resource) => resource.id}
      initialForm={initialForm}
      permissionPrefix="resource"
      publishedOptions={publishedOptions}
      queryFn={(query) =>
        effectiveFolderId === null
          ? Promise.reject(new Error("Select a folder first."))
          : resourcesApi.findAll(effectiveFolderId, {
              limit: query.limit,
              page: query.page,
              published: query.published,
              search: query.search,
              status: query.status as ResourceStatus | undefined,
              type: query.type as ResourceType | undefined,
            })
      }
      queryKey={["admin", "resources", effectiveFolderId]}
      remove={(id) =>
        effectiveFolderId === null
          ? Promise.reject(new Error("Select a folder first."))
          : resourcesApi.remove(effectiveFolderId, id)
      }
      setActive={(id, active) =>
        effectiveFolderId === null
          ? Promise.reject(new Error("Select a folder first."))
          : resourcesApi.update(effectiveFolderId, id, { isActive: active })
      }
      renderDetails={details}
      renderForm={(formContext) => <ResourceForm {...formContext} />}
      statusOptions={statusOptions}
      title="Resources"
      toCreatePayload={toPayload}
      toForm={(resource) => ({
        description: resource.description ?? "",
        documentUrl: resource.documentUrl ?? "",
        durationInSeconds: resource.durationInSeconds?.toString() ?? "",
        examId: resource.examId?.toString() ?? "",
        fileSize: resource.fileSize ?? "",
        isDownloadable: resource.isDownloadable,
        isPublished: resource.isPublished,
        mimeType: resource.mimeType ?? "",
        sortOrder: String(resource.sortOrder),
        status: resource.status,
        thumbnail: resource.thumbnail ?? "",
        title: resource.title,
        type: resource.type,
        videoUrl: resource.videoUrl ?? "",
      })}
      toUpdatePayload={toPayload}
      typeOptions={typeOptions}
      update={(id, payload) =>
        effectiveFolderId === null
          ? Promise.reject(new Error("Select a folder first."))
          : resourcesApi.update(effectiveFolderId, id, payload)
      }
      formResolver={zodResolver(resourceSchema)}
    />
  );
}

export default ResourcesPage;
