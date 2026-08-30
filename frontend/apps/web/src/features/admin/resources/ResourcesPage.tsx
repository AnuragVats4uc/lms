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
  ResourceTypeCode,
  ResourceTypeId,
} from "@repo/types";
import { RESOURCE_TYPE_IDS } from "@repo/types";
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
  isManagedResourceDocument,
  openManagedResourceDocument,
} from "@/features/resources/openManagedResourceDocument";
import {
  AppInput,
  FormCheckbox,
  FormControllerField,
  FormInput,
  FormTextArea,
  Text,
  XStack,
  YStack,
} from "@repo/ui";

type ResourceForm = ResourceFormValues;
type ResourceMutationPayload = CreateResourceRequest & {
  documentFile?: File | null;
};

type FolderOption = { id: number; label: string };

const initialForm: ResourceForm = {
  description: "",
  documentFile: null,
  documentSource: "URL",
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
  resourceTypeId: "1",
  videoUrl: "",
};

const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
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

function toPayload(form: ResourceForm): ResourceMutationPayload {
  const payload: ResourceMutationPayload = {
    isDownloadable: form.isDownloadable,
    isPublished: form.isPublished,
    sortOrder: Number(form.sortOrder),
    status: form.status,
    title: form.title.trim(),
    resourceTypeId: Number(form.resourceTypeId) as ResourceTypeId,
  };
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.thumbnail.trim()) payload.thumbnail = form.thumbnail.trim();
  if (form.mimeType.trim()) payload.mimeType = form.mimeType.trim();
  if (form.fileSize.trim()) payload.fileSize = form.fileSize.trim();
  if (form.durationInSeconds.trim())
    payload.durationInSeconds = Number(form.durationInSeconds);
  if (form.resourceTypeId === "1" && form.documentSource === "URL") {
    payload.documentUrl = form.documentUrl.trim();
  }
  if (form.resourceTypeId === "1" && form.documentSource === "UPLOAD") {
    payload.documentFile = form.documentFile;
  }
  if (form.resourceTypeId === "2") payload.videoUrl = form.videoUrl.trim();
  if (form.resourceTypeId === "3") payload.examId = Number(form.examId);
  return payload;
}

function toJsonPayload(
  payload: ResourceMutationPayload,
  removeDocumentUrl = false,
) {
  const request = { ...payload };
  delete request.documentFile;
  if (removeDocumentUrl) delete request.documentUrl;
  return request;
}

interface ResourceFormProps extends ResourceFormContext<ResourceForm> {
  fixedTypeId?: ResourceTypeId;
  resourceTypes: ResourceType[];
}

function ResourceForm({
  error,
  fixedTypeId,
  resourceTypes,
}: ResourceFormProps) {
  const resourceTypeId = useWatch<ResourceForm, "resourceTypeId">({
    name: "resourceTypeId",
  });
  const documentSource = useWatch<ResourceForm, "documentSource">({
    name: "documentSource",
  });
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
          {fixedTypeId ? (
            <Text color="#52627A" fontSize="$caption">
              Type:{" "}
              {resourceTypes.find(({ id }) => id === fixedTypeId)?.name ??
                "Resource"}
            </Text>
          ) : (
            <CrudFormSelect
              label="Type"
              name="resourceTypeId"
              options={resourceTypes.map((type) => ({
                label: type.name,
                value: String(type.id),
              }))}
            />
          )}
        </div>
      </XStack>
      {resourceTypeId === "1" ? (
        <XStack className="lms-organization-form-grid" gap="$3">
          <div className="lms-form-field">
            <CrudFormSelect
              label="Document source"
              name="documentSource"
              options={[
                { label: "External URL", value: "URL" },
                { label: "Upload file", value: "UPLOAD" },
              ]}
            />
          </div>
          <div className="lms-form-field">
            {documentSource === "UPLOAD" ? (
              <FormControllerField<ResourceForm, "documentFile">
                label="Document file"
                name="documentFile"
              >
                {({ field, fieldState, errorId, inputId }) => (
                  <AppInput
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    aria-describedby={fieldState.error ? errorId : undefined}
                    aria-invalid={fieldState.invalid}
                    id={inputId}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      const input = event.target as HTMLInputElement;
                      field.onChange(input.files?.[0] ?? null);
                    }}
                    type="file"
                  />
                )}
              </FormControllerField>
            ) : (
              <FormInput
                label="Document URL"
                name="documentUrl"
                placeholder="https://cdn.example.com/notes.pdf"
                type="url"
              />
            )}
          </div>
        </XStack>
      ) : null}
      {resourceTypeId === "2" ? (
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
      {resourceTypeId === "3" ? (
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

function resourceTone(type: ResourceTypeCode) {
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
      <CrudBadge tone={resourceTone(row.resourceType.code)}>
        {row.resourceType.name}
      </CrudBadge>
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
          row.resourceTypeId === RESOURCE_TYPE_IDS.EXAM
            ? "Exam #" + row.examId
            : row.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO
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
      row.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT && row.documentUrl ? (
        <DataTableWebsiteCell
          href={row.documentUrl}
          label="Open document"
          onClick={
            isManagedResourceDocument(row)
              ? (event) => {
                  event.preventDefault();
                  void openManagedResourceDocument(row);
                }
              : undefined
          }
        />
      ) : row.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO && row.videoUrl ? (
        <DataTableWebsiteCell href={row.videoUrl} label="Open video" />
      ) : (
        <DataTableTextCell
          primary={
            row.resourceTypeId === RESOURCE_TYPE_IDS.EXAM
              ? `Exam #${row.examId ?? "-"}`
              : "-"
          }
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
            <CrudBadge tone={resourceTone(resource.resourceType.code)}>
              {resource.resourceType.name}
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

export interface ResourcesPageProps {
  resourceTypeId?: ResourceTypeId;
}

export function ResourcesPage({ resourceTypeId }: ResourcesPageProps = {}) {
  const searchParams = useSearchParams();
  const resourceTypesQuery = useQuery({
    queryFn: () => resourcesApi.findTypes(),
    queryKey: ["admin", "resource-types"],
    staleTime: 5 * 60_000,
  });
  const resourceTypes = resourceTypesQuery.data ?? [];
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
  const resourceInitialForm = useMemo(
    () => ({
      ...initialForm,
      resourceTypeId: String(
        resourceTypeId ?? RESOURCE_TYPE_IDS.DOCUMENT,
      ) as ResourceForm["resourceTypeId"],
    }),
    [resourceTypeId],
  );
  const resourceInitialFilters = useMemo<Record<string, string>>(() => {
    const filters: Record<string, string> = {};
    if (resourceTypeId) filters.type = String(resourceTypeId);
    return filters;
  }, [resourceTypeId]);

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
      ResourceMutationPayload,
      ResourceMutationPayload
    >
      columns={columns}
      context={context}
      create={(payload) => {
        if (effectiveFolderId === null) {
          return Promise.reject(new Error("Select a folder first."));
        }
        if (payload.documentFile) {
          const formData = new FormData();
          formData.append("file", payload.documentFile);
          formData.append("title", payload.title);
          if (payload.description) {
            formData.append("description", payload.description);
          }
          formData.append("sortOrder", String(payload.sortOrder ?? 0));
          formData.append("status", payload.status ?? "DRAFT");
          formData.append("isPublished", String(payload.isPublished ?? false));
          formData.append(
            "isDownloadable",
            String(payload.isDownloadable ?? true),
          );
          return resourcesApi.uploadDocument(effectiveFolderId, formData);
        }
        return resourcesApi.create(effectiveFolderId, toJsonPayload(payload));
      }}
      description={
        resourceTypeId === RESOURCE_TYPE_IDS.EXAM
          ? "Manage exam resources linked to the selected course folder."
          : "Manage documents, videos, and exams stored inside course folders."
      }
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
          value: rows.filter(
            (row) => row.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT,
          ).length,
        },
        {
          icon: <Video color="#2563EB" size={20} />,
          label: "Videos",
          value: rows.filter(
            (row) => row.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO,
          ).length,
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
      initialFilters={resourceInitialFilters}
      initialForm={resourceInitialForm}
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
              resourceTypeId: query.type
                ? (Number(query.type) as ResourceTypeId)
                : undefined,
            })
      }
      queryKey={[
        "admin",
        "resources",
        resourceTypeId ?? "all",
        effectiveFolderId,
      ]}
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
      renderForm={(formContext) => (
        <ResourceForm
          {...formContext}
          fixedTypeId={resourceTypeId}
          resourceTypes={resourceTypes}
        />
      )}
      statusOptions={statusOptions}
      title={resourceTypeId === RESOURCE_TYPE_IDS.EXAM ? "Exams" : "Resources"}
      toCreatePayload={toPayload}
      toForm={(resource) => ({
        description: resource.description ?? "",
        documentFile: null,
        documentSource: "URL",
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
        resourceTypeId: String(
          resource.resourceTypeId,
        ) as ResourceForm["resourceTypeId"],
        videoUrl: resource.videoUrl ?? "",
      })}
      toUpdatePayload={toPayload}
      typeOptions={
        resourceTypeId
          ? undefined
          : [
              { label: "All", value: "ALL" },
              ...resourceTypes.map((type) => ({
                label: type.name,
                value: String(type.id),
              })),
            ]
      }
      update={(id, payload) => {
        if (effectiveFolderId === null) {
          return Promise.reject(new Error("Select a folder first."));
        }
        if (payload.documentFile) {
          const formData = new FormData();
          formData.append("file", payload.documentFile);
          return resourcesApi
            .replaceDocument(effectiveFolderId, id, formData)
            .then(() => {
              return resourcesApi.update(
                effectiveFolderId,
                id,
                toJsonPayload(payload, true),
              );
            });
        }
        return resourcesApi.update(
          effectiveFolderId,
          id,
          toJsonPayload(payload),
        );
      }}
      formResolver={zodResolver(resourceSchema)}
    />
  );
}

export default ResourcesPage;
