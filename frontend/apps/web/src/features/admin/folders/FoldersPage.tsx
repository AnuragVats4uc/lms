"use client";

import { useMemo, useState } from "react";
import { foldersApi, sessionCoursesApi } from "@repo/api";
import type {
  CreateFolderRequest,
  Folder,
  FolderStatus,
  FolderTreeNode,
  UpdateFolderRequest,
} from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import {
  DataTableBadgeCell,
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { OrganizationSelect } from "../organizations/components/filters";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import { Text, XStack, YStack } from "@repo/ui";

type FolderForm = {
  color: string;
  description: string;
  icon: string;
  name: string;
  parentFolderId: string;
  sortOrder: string;
  status: FolderStatus;
};

const initialForm: FolderForm = {
  color: "",
  description: "",
  icon: "",
  name: "",
  parentFolderId: "",
  sortOrder: "0",
  status: "ACTIVE",
};
const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

function flatten(nodes: FolderTreeNode[]): FolderTreeNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}
function toCreate(form: FolderForm): CreateFolderRequest {
  const payload: CreateFolderRequest = {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder),
    status: form.status,
  };
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.icon.trim()) payload.icon = form.icon.trim();
  if (form.color.trim()) payload.color = form.color.trim();
  if (form.parentFolderId) payload.parentFolderId = Number(form.parentFolderId);
  return payload;
}
function toUpdate(form: FolderForm): UpdateFolderRequest {
  return {
    ...toCreate(form),
    parentFolderId: form.parentFolderId ? Number(form.parentFolderId) : null,
  };
}
function validate(form: FolderForm) {
  if (!form.name.trim()) return "Folder name is required.";
  if (!Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < 0)
    return "Sort order must be a non-negative whole number.";
  return null;
}

function Form({
  error,
  form,
  onChange,
  folders,
}: ResourceFormContext<FolderForm> & { folders: Folder[] }) {
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
            onChange={(event) => onChange("name", event.currentTarget.value)}
            placeholder="Physics"
            required
            value={form.name}
          />
        </label>
        <label className="lms-form-field">
          <span>Parent folder</span>
          <select
            onChange={(event) =>
              onChange("parentFolderId", event.currentTarget.value)
            }
            value={form.parentFolderId}
          >
            <option value="">Session-course root</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
      </XStack>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
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
        <label className="lms-form-field">
          <span>Status</span>
          <select
            onChange={(event) =>
              onChange("status", event.currentTarget.value as FolderStatus)
            }
            value={form.status}
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </XStack>
      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <label className="lms-form-field">
          <span>Icon</span>
          <input
            onChange={(event) => onChange("icon", event.currentTarget.value)}
            placeholder="book-open"
            value={form.icon}
          />
        </label>
        <label className="lms-form-field">
          <span>Color</span>
          <input
            onChange={(event) => onChange("color", event.currentTarget.value)}
            placeholder="#2563EB"
            value={form.color}
          />
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

function statusTone(status: FolderStatus) {
  return status === "ACTIVE" ? ("green" as const) : ("gray" as const);
}
const columns: DataTableColumn<Folder>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.name}
        secondary={row.parentFolderId ? "Nested folder" : "Root folder"}
      />
    ),
    header: "Folder",
    id: "name",
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
        primary={String(row.sortOrder)}
        secondary={row.color ?? "Default color"}
      />
    ),
    header: "Order",
    id: "sortOrder",
    width: 130,
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
];

function Tree({
  nodes,
  depth = 0,
}: {
  nodes: FolderTreeNode[];
  depth?: number;
}) {
  return (
    <YStack gap="$2">
      {nodes.map((node) => (
        <YStack key={node.id} gap="$1" style={{ marginLeft: depth * 18 }}>
          <Text color="#0F1D3A" fontSize="$label" fontWeight="$button">
            {node.name}
          </Text>
          {node.children.length ? (
            <Tree depth={depth + 1} nodes={node.children} />
          ) : null}
        </YStack>
      ))}
    </YStack>
  );
}

export function FoldersPage() {
  const academic = useAcademicSessions();
  const [selectedSessionCourseId, setSelectedSessionCourseId] = useState<
    number | null
  >(null);
  const sessionCoursesQuery = useQuery({
    enabled: academic.selectedSessionId !== null,
    queryFn: () =>
      sessionCoursesApi.findAll(academic.selectedSessionId as number, {
        limit: 100,
        page: 1,
      }),
    queryKey: ["admin", "folder-session-courses", academic.selectedSessionId],
    staleTime: 60_000,
  });
  const sessionCourses = useMemo(
    () => sessionCoursesQuery.data?.items ?? [],
    [sessionCoursesQuery.data?.items],
  );
  const effectiveSessionCourseId =
    selectedSessionCourseId ?? sessionCourses[0]?.id ?? null;
  const folderTreeQuery = useQuery({
    enabled: effectiveSessionCourseId !== null,
    queryFn: () => foldersApi.findTree(effectiveSessionCourseId as number),
    queryKey: ["admin", "folder-tree", effectiveSessionCourseId],
    staleTime: 30_000,
  });
  const tree = useMemo(
    () => folderTreeQuery.data ?? [],
    [folderTreeQuery.data],
  );
  const folders = useMemo(() => flatten(tree), [tree]);
  const context = (
    <YStack gap="$3">
      <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
        {academic.organizations.length ? (
          <OrganizationSelect
            ariaLabel="Select organization"
            label="Organization"
            onChange={(value) => {
              academic.setSelectedOrganizationId(Number(value));
              academic.setSelectedSessionId(null);
              setSelectedSessionCourseId(null);
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
        <OrganizationSelect
          ariaLabel="Select session"
          label="Session"
          onChange={(value) => {
            academic.setSelectedSessionId(Number(value));
            setSelectedSessionCourseId(null);
          }}
          options={academic.sessions.map((session) => ({
            label: session.name,
            value: String(session.id),
          }))}
          value={
            academic.selectedSessionId ? String(academic.selectedSessionId) : ""
          }
        />
        <OrganizationSelect
          ariaLabel="Select session course"
          label="Session course"
          onChange={(value) => setSelectedSessionCourseId(Number(value))}
          options={sessionCourses.map((item) => ({
            label: item.displayName ?? item.course.name,
            value: String(item.id),
          }))}
          value={selectedSessionCourseId ? String(selectedSessionCourseId) : ""}
        />
      </XStack>
      <YStack
        gap="$2"
        p="$4"
        style={{
          backgroundColor: "#F8FBFD",
          borderColor: "#E1E7F0",
          borderRadius: 12,
          borderWidth: 1,
        }}
      >
        <Text color="#0F1D3A" fontSize="$label" fontWeight="$button">
          Folder tree
        </Text>
        {tree.length ? (
          <Tree nodes={tree} />
        ) : (
          <Text color="#52627A" fontSize="$caption">
            No folders exist for the selected session course.
          </Text>
        )}
      </YStack>
    </YStack>
  );
  return (
    <CrudManagementPage<
      Folder,
      FolderForm,
      CreateFolderRequest,
      UpdateFolderRequest
    >
      columns={columns}
      context={context}
      create={(payload) =>
        selectedSessionCourseId === null
          ? Promise.reject(new Error("Select a session course first."))
          : foldersApi.create(selectedSessionCourseId, payload)
      }
      description="Organize session-course content with unlimited nested folders."
      emptyDescription={
        selectedSessionCourseId === null
          ? "Select a session course to manage folders."
          : "Create the first folder for this session course."
      }
      enabled={effectiveSessionCourseId !== null}
      entityLabel="Folder"
      getDisplayName={(folder) => folder.name}
      getRowId={(folder) => folder.id}
      initialForm={initialForm}
      permissionPrefix="folder"
      queryFn={(query) =>
        effectiveSessionCourseId === null
          ? Promise.reject(new Error("Select a session course first."))
          : foldersApi.findAll(effectiveSessionCourseId, {
              limit: query.limit,
              page: query.page,
              search: query.search,
              status: query.status as FolderStatus | undefined,
            })
      }
      queryKey={["admin", "folders", effectiveSessionCourseId]}
      remove={(id) =>
        effectiveSessionCourseId === null
          ? Promise.reject(new Error("Select a session course first."))
          : foldersApi.remove(effectiveSessionCourseId, id)
      }
      renderDetails={(folder) => (
        <YStack gap="$2">
          <Text color="#52627A" fontSize="$caption">
            Parent:{" "}
            {folder.parentFolderId ? "Nested folder" : "Session-course root"}
          </Text>
          <Text color="#52627A" fontSize="$caption">
            Status: {folder.status}
          </Text>
          <Text color="#52627A" fontSize="$caption">
            Description: {folder.description ?? "—"}
          </Text>
        </YStack>
      )}
      renderForm={(formContext) => (
        <Form
          {...formContext}
          folders={folders.filter(
            (folder) =>
              !formContext.isEdit ||
              folder.id !== Number(formContext.form.parentFolderId),
          )}
        />
      )}
      statusOptions={statusOptions}
      title="Folders"
      toCreatePayload={toCreate}
      toForm={(folder) => ({
        color: folder.color ?? "",
        description: folder.description ?? "",
        icon: folder.icon ?? "",
        name: folder.name,
        parentFolderId: folder.parentFolderId?.toString() ?? "",
        sortOrder: String(folder.sortOrder),
        status: folder.status,
      })}
      toUpdatePayload={toUpdate}
      update={(id, payload) =>
        effectiveSessionCourseId === null
          ? Promise.reject(new Error("Select a session course first."))
          : foldersApi.update(effectiveSessionCourseId, id, payload)
      }
      validate={validate}
    />
  );
}

export default FoldersPage;
