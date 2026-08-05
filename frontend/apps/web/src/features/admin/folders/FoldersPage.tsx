"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { foldersApi, sessionCoursesApi } from "@repo/api";
import {
  Building2,
  CalendarDays,
  Clock3,
  Folder as FolderIcon,
  FolderTree,
  Palette,
  Plus,
  ShieldCheck,
} from "lucide-react";
import type {
  CreateFolderRequest,
  Folder,
  FolderStatus,
  FolderTreeNode,
  UpdateFolderRequest,
} from "@repo/types";
import { useQuery } from "@tanstack/react-query";
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
import { TreeView, type TreeNodeItem } from "@repo/ui/dashboard";
import { AppCard } from "@repo/ui/primitives";
import { Button, Text, XStack, YStack } from "@repo/ui";

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

function getExpandableFolderIds(nodes: FolderTreeNode[]): number[] {
  return nodes.flatMap((node) => [
    ...(node.children.length ? [node.id] : []),
    ...getExpandableFolderIds(node.children),
  ]);
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
  if (form.color.trim() && !/^#?[0-9a-f]{3,8}$/iu.test(form.color.trim()))
    return "Color must be a valid hex color.";
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
  return status === "ACTIVE" ? ("success" as const) : ("neutral" as const);
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
      <CrudBadge tone={statusTone(row.status)}>{row.status}</CrudBadge>
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
  {
    cell: ({ row }) => <DataTableTextCell primary={row.icon ?? "-"} />,
    header: "Icon",
    id: "icon",
    width: 130,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.color ?? "Default"} />,
    header: "Color",
    id: "color",
    width: 130,
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

export function FoldersPage() {
  const searchParams = useSearchParams();
  const academic = useAcademicSessions();
  const {
    selectedOrganizationId,
    selectedSessionId,
    setSelectedOrganizationId,
    setSelectedSessionId,
  } = academic;
  const requestedOrganizationId = Number(searchParams.get("organizationId")) || null;
  const requestedSessionId = Number(searchParams.get("sessionId")) || null;
  const requestedSessionCourseId = Number(searchParams.get("sessionCourseId")) || null;
  const [selectedSessionCourseId, setSelectedSessionCourseId] = useState<
    number | null
  >(requestedSessionCourseId);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    null,
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
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number> | null>(
    null,
  );
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
  const selectedSessionCourse = sessionCourses.find(
    (item) => item.id === effectiveSessionCourseId,
  );
  const expandedIds = useMemo(
    () =>
      expandedFolderIds ??
      new Set(getExpandableFolderIds(tree)),
    [expandedFolderIds, tree],
  );
  const folderTreeItems = useMemo<TreeNodeItem[]>(() => {
    const toItems = (nodes: FolderTreeNode[]): TreeNodeItem[] =>
      nodes.map((node) => ({
        children: toItems(node.children),
        expanded: expandedIds.has(node.id),
        icon: <FolderIcon aria-hidden="true" color="#64748B" size={15} />,
        id: `folder-${node.id}`,
        label: node.name,
        selected: selectedFolderId === node.id,
      }));
    const folderItems = toItems(tree);
    if (!selectedSessionCourse) return folderItems;
    const sessionItem: TreeNodeItem = {
      children: [
        {
          children: folderItems,
          expanded: true,
          icon: <FolderTree aria-hidden="true" color="#059669" size={15} />,
          id: `session-course-${selectedSessionCourse.id}`,
          label:
            selectedSessionCourse.displayName ??
            selectedSessionCourse.course.name,
        },
      ],
      expanded: true,
      icon: <CalendarDays aria-hidden="true" color="#64748B" size={15} />,
      id: `session-${selectedSessionCourse.sessionId}`,
      label:
        academic.sessions.find(
          (session) => session.id === selectedSessionCourse.sessionId,
        )?.name ?? "Session",
    };
    return [
      {
        children: [sessionItem],
        expanded: true,
        icon: <Building2 aria-hidden="true" color="#64748B" size={15} />,
        id: `organization-${academic.selectedOrganizationId ?? "current"}`,
        label:
          academic.organizations.find(
            (organization) => organization.id === academic.selectedOrganizationId,
          )?.name ?? "Organization",
      },
    ];
  }, [
    academic.organizations,
    academic.selectedOrganizationId,
    academic.sessions,
    expandedIds,
    selectedFolderId,
    selectedSessionCourse,
    tree,
  ]);
  const renderContext = ({ openCreate }: { openCreate: () => void }) => (
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
              setSelectedFolder(null);
              setExpandedFolderIds(null);
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
            setSelectedFolder(null);
            setExpandedFolderIds(null);
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
            setSelectedFolder(null);
            setExpandedFolderIds(null);
          }}
          options={sessionCourses.map((item) => ({
            label: item.displayName ?? item.course.name,
            value: String(item.id),
          }))}
          value={effectiveSessionCourseId ? String(effectiveSessionCourseId) : ""}
        />
      </XStack>
    </YStack>
  );
  const renderTableAside = ({ openCreate }: { openCreate: () => void }) => (
    <AppCard
      className="lms-folder-hierarchy-card"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      style={{ borderRadius: 12, minHeight: 420, width: 280 }}
    >
      <YStack gap="$3">
        <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
          Content Hierarchy
        </Text>
        {folderTreeItems.length ? (
          <TreeView
            items={folderTreeItems}
            onSelect={(id) => {
              if (!id.startsWith("folder-")) return;
              const idNumber = Number(id.replace("folder-", ""));
              setSelectedFolderId(idNumber);
              setSelectedFolder(
                folders.find((folder) => folder.id === idNumber) ?? null,
              );
            }}
            onToggle={(id) => {
              if (!id.startsWith("folder-")) return;
              const idNumber = Number(id.replace("folder-", ""));
              setExpandedFolderIds((current) => {
                const next = new Set(current ?? expandedIds);
                if (next.has(idNumber)) next.delete(idNumber);
                else next.add(idNumber);
                return next;
              });
            }}
          />
        ) : (
          <Text color="#52627A" fontSize="$caption">
            No folders exist for the selected session course.
          </Text>
        )}
        <Button
          aria-label="Add New Folder"
          background="#FFFFFF"
          borderColor="#10B981"
          borderWidth={1}
          height={42}
          mt="$3"
          onPress={openCreate}
          rounded="$3"
          width="100%"
        >
          <Plus aria-hidden="true" color="#059669" size={15} />
          <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
            Add New Folder
          </Button.Text>
        </Button>
      </YStack>
    </AppCard>
  );
  return (
    <CrudManagementPage<
      Folder,
      FolderForm,
      CreateFolderRequest,
      UpdateFolderRequest
    >
      columns={columns}
      onSelectedItemChange={(folder) => {
        setSelectedFolder(folder);
        setSelectedFolderId(folder?.id ?? null);
      }}
      renderContext={renderContext}
      renderTableAside={renderTableAside}
      create={(payload) =>
        effectiveSessionCourseId === null
          ? Promise.reject(new Error("Select a session course first."))
          : foldersApi.create(effectiveSessionCourseId, payload)
      }
      description="Organize session-course content with unlimited nested folders."
      emptyDescription={
        effectiveSessionCourseId === null
          ? "Select a session course to manage folders."
          : "Create the first folder for this session course."
      }
      enabled={effectiveSessionCourseId !== null}
      entityLabel="Folder"
      getStats={({ rows, total }) => [
        { icon: <FolderTree color="#059669" size={20} />, label: "Total Folders", value: total },
        { icon: <ShieldCheck color="#059669" size={20} />, label: "Active Folders", value: rows.filter((row) => row.status === "ACTIVE").length },
        { icon: <FolderTree color="#2563EB" size={20} />, label: "Nested Folders", value: rows.filter((row) => row.parentFolderId !== null).length },
        { icon: <Clock3 color="#64748B" size={20} />, label: "Archived Folders", value: rows.filter((row) => row.status === "ARCHIVED").length },
      ]}
      getDisplayName={(folder) => folder.name}
      getIsActive={(folder) => folder.isActive}
      getRowId={(folder) => folder.id}
      getCreateForm={() => ({
        ...initialForm,
        parentFolderId: selectedFolderId ? String(selectedFolderId) : "",
      })}
      initialForm={initialForm}
      selectedItem={selectedFolder}
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
      setActive={(id, active) =>
        effectiveSessionCourseId === null
          ? Promise.reject(new Error("Select a session course first."))
          : foldersApi.update(effectiveSessionCourseId, id, { isActive: active })
      }
      renderDetails={(folder) => (
        <YStack gap="$3">
          <CrudDetailSection icon={<FolderTree color="#059669" size={15} />} title="Folder hierarchy">
            <CrudDetailField icon={<FolderTree color="#059669" size={15} />} label="Parent folder" value={folder.parentFolderId ?? "Session-course root"} />
            <CrudDetailField icon={<Clock3 color="#059669" size={15} />} label="Sort order" value={folder.sortOrder} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Status" value={<CrudBadge tone={statusTone(folder.status)}>{folder.status}</CrudBadge>} />
          </CrudDetailSection>
          <CrudDetailSection icon={<Palette color="#059669" size={15} />} title="Appearance">
            <CrudDetailField icon={<FolderTree color="#059669" size={15} />} label="Icon" value={folder.icon} />
            <CrudDetailField icon={<Palette color="#059669" size={15} />} label="Color" value={folder.color} />
            <CrudDetailField icon={<ShieldCheck color="#059669" size={15} />} label="Active record" value={folder.isActive ? "Yes" : "No"} />
          </CrudDetailSection>
          <CrudDetailSection icon={<CalendarDays color="#059669" size={15} />} title="Record history">
            <CrudDetailField icon={<CalendarDays color="#059669" size={15} />} label="Created" value={new Date(folder.createdAt).toLocaleString()} />
            <CrudDetailField icon={<Clock3 color="#059669" size={15} />} label="Last updated" value={new Date(folder.updatedAt).toLocaleString()} />
          </CrudDetailSection>
          <Text color="#52627A" fontSize="$caption" style={{ display: "none" }}>
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
