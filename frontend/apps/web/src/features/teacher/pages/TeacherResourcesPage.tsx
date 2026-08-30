"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { teacherApi } from "@repo/api";
import type { TeacherDashboardRecentResource } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";
import {
  DataTable,
  DataTableBadgeCell,
  DataTableDateCell,
  DataTableTextCell,
  DataTableWebsiteCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudPageHeader, CrudToolbar } from "@/features/admin/components/crud";
import {
  isManagedResourceDocument,
  openManagedResourceDocument,
} from "@/features/resources/openManagedResourceDocument";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
];

const publishedOptions = [
  { label: "All visibility", value: "" },
  { label: "Published", value: "true" },
  { label: "Unpublished", value: "false" },
];

export function TeacherResourcesPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [sessionCourseId, setSessionCourseId] = useState("");
  const [resourceTypeId, setResourceTypeId] = useState("");
  const [status, setStatus] = useState("");
  const [published, setPublished] = useState("");

  const coursesQuery = useQuery({
    queryFn: () => teacherApi.findCourses({ limit: 100, page: 1 }),
    queryKey: ["teacher-resource-course-options"],
    staleTime: 60_000,
  });
  const resourceTypesQuery = useQuery({
    queryFn: teacherApi.findResourceTypes,
    queryKey: ["teacher-resource-types"],
    staleTime: 300_000,
  });
  const resourcesQuery = useQuery({
    queryFn: () =>
      teacherApi.findResources({
        limit,
        page,
        published: published ? published === "true" : undefined,
        resourceTypeId: resourceTypeId ? Number(resourceTypeId) : undefined,
        search: search || undefined,
        sessionCourseId: sessionCourseId ? Number(sessionCourseId) : undefined,
        status: status || undefined,
      }),
    queryKey: [
      "teacher-resources",
      page,
      limit,
      search,
      sessionCourseId,
      resourceTypeId,
      status,
      published,
    ],
    staleTime: 60_000,
  });

  const columns = useMemo<DataTableColumn<TeacherDashboardRecentResource>[]>(
    () => createResourceColumns(),
    [],
  );
  const data = resourcesQuery.data;
  const courseOptions = [
    { label: "All courses", value: "" },
    ...(coursesQuery.data?.items.map((course) => ({
      label: course.title,
      value: String(course.sessionCourseId),
    })) ?? []),
  ];
  const typeOptions = [
    { label: "All types", value: "" },
    ...(resourceTypesQuery.data?.map((type) => ({
      label: type.name,
      value: String(type.id),
    })) ?? []),
  ];

  return (
    <PageContainer>
      <CrudPageHeader
        canCreate={false}
        createLabel=""
        description="Browse resources that belong to your assigned session courses."
        isFetching={resourcesQuery.isFetching}
        onCreate={() => undefined}
        onRefresh={() => void resourcesQuery.refetch()}
        title="Resources"
      />
      <CrudToolbar
        entityLabel="Resources"
        filters={[
          { id: "course", label: "Course", options: courseOptions },
          { id: "type", label: "Type", options: typeOptions },
          { id: "status", label: "Status", options: statusOptions },
          { id: "published", label: "Visibility", options: publishedOptions },
        ]}
        loading={resourcesQuery.isFetching}
        onClear={() => {
          setSearch("");
          setSessionCourseId("");
          setResourceTypeId("");
          setStatus("");
          setPublished("");
          setPage(1);
        }}
        onFilterChange={(id, value) => {
          if (id === "course") setSessionCourseId(value);
          if (id === "type") setResourceTypeId(value);
          if (id === "status") setStatus(value);
          if (id === "published") setPublished(value);
          setPage(1);
        }}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search resources..."
        searchValue={search}
        values={{
          course: sessionCourseId,
          published,
          status,
          type: resourceTypeId,
        }}
      />
      <DataTable<TeacherDashboardRecentResource>
        actions={[
          {
            icon: <ExternalLink aria-hidden="true" size={15} />,
            id: "open",
            label: "Open",
            onAction: (resource) => {
              const document = {
                ...resource,
                folderId: resource.folder.id,
              };
              if (
                resource.documentUrl &&
                isManagedResourceDocument(document)
              ) {
                void openManagedResourceDocument(document);
                return;
              }
              const href = resource.documentUrl ?? resource.videoUrl;
              if (href) window.open(href, "_blank", "noopener,noreferrer");
            },
          },
        ]}
        columns={columns}
        data={data?.items ?? []}
        emptyState={{
          description:
            search || sessionCourseId || resourceTypeId || status || published
              ? "No resources match the current filters."
              : "No resources are available for your assigned courses.",
          icon: <FileText aria-hidden="true" size={28} />,
          title:
            search || sessionCourseId || resourceTypeId || status || published
              ? "No matching resources"
              : "No resources found",
        }}
        error={
          resourcesQuery.isError
            ? {
                description:
                  resourcesQuery.error instanceof Error
                    ? resourcesQuery.error.message
                    : "The resource list could not be loaded.",
                onRetry: () => void resourcesQuery.refetch(),
                title: "Unable to load resources",
              }
            : null
        }
        getRowId={(resource) => resource.id}
        loading={resourcesQuery.isLoading}
        onPageChange={setPage}
        onPageSizeChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
        pagination={{
          entityLabel: "resources",
          mode: "server",
          page,
          pageSize: limit,
          pageSizeOptions: [10, 25, 50],
          total: data?.meta.total ?? 0,
          totalPages: data?.meta.totalPages ?? 0,
        }}
        renderToolbar={() => null}
        searchable={false}
        stickyFirstColumn
        stickyHeader
      />
    </PageContainer>
  );
}

function createResourceColumns(): DataTableColumn<TeacherDashboardRecentResource>[] {
  return [
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.title}
          secondary={row.description ?? row.folder.name}
        />
      ),
      header: "Resource",
      id: "resource",
      sticky: true,
      width: 300,
    },
    {
      cell: ({ row }) => (
        <DataTableBadgeCell
          label={row.resourceType.name}
          tone={row.resourceType.code === "EXAM" ? "purple" : "green"}
        />
      ),
      header: "Type",
      id: "type",
      width: 130,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.sessionCourse.title}
          secondary={
            row.sessionCourse.session?.name ?? row.sessionCourse.courseCode
          }
        />
      ),
      header: "Course",
      id: "course",
      width: 240,
    },
    {
      cell: ({ row }) => <DataTableTextCell primary={row.folder.name} />,
      header: "Folder",
      id: "folder",
      width: 180,
    },
    {
      cell: ({ row }) => (
        <DataTableBadgeCell
          label={row.isPublished ? "Published" : row.status}
          tone={row.isPublished ? "green" : "gray"}
        />
      ),
      header: "Status",
      id: "status",
      width: 130,
    },
    {
      cell: ({ row }) =>
        row.documentUrl ? (
          <DataTableWebsiteCell
            href={row.documentUrl}
            label="Open document"
            onClick={
              isManagedResourceDocument({
                ...row,
                folderId: row.folder.id,
              })
                ? (event) => {
                    event.preventDefault();
                    void openManagedResourceDocument({
                      ...row,
                      folderId: row.folder.id,
                    });
                  }
                : undefined
            }
          />
        ) : row.videoUrl ? (
          <DataTableWebsiteCell href={row.videoUrl} label="Open video" />
        ) : (
          <DataTableTextCell primary={row.examId ? "Exam resource" : "-"} />
        ),
      header: "Link",
      id: "link",
      width: 160,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
      header: "Updated",
      id: "updatedAt",
      width: 140,
    },
  ];
}
