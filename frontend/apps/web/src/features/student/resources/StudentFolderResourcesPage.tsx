"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  CircleX,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  Play,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { studentsApi } from "@repo/api";
import {
  RESOURCE_TYPE_IDS,
  type ResourceTypeId,
  type StudentFolderResourceItem,
  type StudentFolderResourcesQuery,
  type StudentResourcesSort,
} from "@repo/types";

import {
  DataTable,
  DataTableDateCell,
  DataTableExpandableText,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  CrudBadge,
  CrudToolbar,
  type CrudBadgeTone,
  type CrudFilterDefinition,
} from "@/features/admin/components/crud";

const ALL = "ALL";
const PAGE_SIZE = 10;
const sortOptions = [
  { label: "Newest first", value: "NEWEST" },
  { label: "Oldest first", value: "OLDEST" },
  { label: "Name A–Z", value: "TITLE_ASC" },
  { label: "Name Z–A", value: "TITLE_DESC" },
];

type Filters = {
  search: string;
  type: typeof ALL | `${ResourceTypeId}`;
  uploadedOn: string;
  sort: StudentResourcesSort;
};

const defaults: Filters = {
  search: "",
  type: ALL,
  uploadedOn: "",
  sort: "NEWEST",
};

export function StudentFolderResourcesPage({
  sessionCourseId,
  folderId,
}: {
  sessionCourseId: number;
  folderId: number;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState(defaults);
  const [page, setPage] = useState(1);
  const params = useMemo<StudentFolderResourcesQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: filters.search || undefined,
      resourceTypeId:
        filters.type === ALL
          ? undefined
          : (Number(filters.type) as ResourceTypeId),
      uploadedOn: filters.uploadedOn || undefined,
      sort: filters.sort,
    }),
    [filters, page],
  );
  const query = useQuery({
    queryKey: ["student-folder-resources", sessionCourseId, folderId, params],
    queryFn: () =>
      studentsApi.findMyFolderResources(sessionCourseId, folderId, params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
  const data = query.data;
  const typeOptions = useMemo(
    () => [
      { label: "All types", value: ALL },
      ...(data?.filters.types ?? []).map((type) => ({
        label: type.name,
        value: String(type.id),
      })),
    ],
    [data?.filters.types],
  );
  const filterDefinitions = useMemo<CrudFilterDefinition[]>(
    () => [
      { id: "type", label: "Type", options: typeOptions },
      { id: "sort", label: "Sort by", options: sortOptions },
    ],
    [typeOptions],
  );
  const columns = useMemo<DataTableColumn<StudentFolderResourceItem>[]>(
    () => [
      {
        cell: ({ row }) => <ResourceNameCell resource={row} />,
        header: "Resource",
        id: "title",
        sticky: true,
        width: 225,
      },
      {
        cell: ({ row }) => (
          <DataTableExpandableText
            color="#52627A"
            fontSize={11}
            lineHeight={15}
          >
            {row.description?.trim() || "No description provided."}
          </DataTableExpandableText>
        ),
        header: "Description",
        id: "description",
        width: 290,
      },
      {
        cell: ({ row }) => <ResourceTypeCell resource={row} />,
        header: "Type",
        id: "type",
        width: 115,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell primary={getResourceDetail(row)} />
        ),
        header: "Details",
        id: "details",
        width: 175,
      },
      {
        cell: ({ row }) => <ResourceStatusCell resource={row} />,
        header: "Progress / Status",
        id: "status",
        width: 165,
      },
      {
        cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
        header: "Added",
        id: "createdAt",
        width: 130,
      },
    ],
    [],
  );

  const reset = () => {
    setFilters(defaults);
    setPage(1);
  };
  const updateFilter = (id: string, value: string) => {
    setPage(1);
    if (id === "type") {
      setFilters((current) => ({
        ...current,
        type: value as Filters["type"],
      }));
      return;
    }
    if (id === "sort") {
      setFilters((current) => ({
        ...current,
        sort: value as StudentResourcesSort,
      }));
    }
  };

  if (query.isError && !data) {
    return (
      <FolderResourceState
        label="This folder is unavailable or is not assigned to you."
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <main className="student-folder-page student-course-folders-page student-folder-resources-list-page">
      <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
        <Link href="/student/my-courses">My Courses</Link>
        <span>/</span>
        {data ? (
          <Link href={`/student/my-courses/${sessionCourseId}`}>
            {data.course.name}
          </Link>
        ) : (
          <span>Course</span>
        )}
        <span>/</span>
        <span>{data?.folder.name ?? "Folder"}</span>
      </nav>

      <header className="student-resource-list-hero">
        <div className="student-resource-list-hero-copy">
          <span className="student-folder-eyebrow">Course resources</span>
          <h1>{data?.folder.name ?? "Loading folder..."}</h1>
          <p>
            {data?.folder.description ??
              data?.course.name ??
              "Videos, documents and exams assigned to this folder."}
          </p>
        </div>

        <div
          className="student-resource-list-summary"
          aria-label="Resource totals"
        >
          <ResourceSummaryItem
            icon={FolderOpen}
            label="Total"
            tone="total"
            value={data?.summary.total ?? 0}
          />
          <ResourceSummaryItem
            icon={Play}
            label="Videos"
            tone="video"
            value={data?.summary.videos ?? 0}
          />
          <ResourceSummaryItem
            icon={FileText}
            label="Documents"
            tone="document"
            value={data?.summary.documents ?? 0}
          />
          <ResourceSummaryItem
            icon={Trophy}
            label="Exams"
            tone="exam"
            value={data?.summary.exams ?? 0}
          />
        </div>
      </header>

      <CrudToolbar
        actions={
          <div className="student-resource-admin-date-filter lms-crud-filter-control lms-crud-select">
            <label
              className="student-resource-admin-date-trigger lms-crud-select-trigger"
              htmlFor="student-resource-added-date"
            >
              <span className="lms-crud-select-label">Added date</span>
              <span className="student-resource-admin-date-value lms-crud-select-value">
                <CalendarDays aria-hidden="true" size={13} />
                <input
                  aria-label="Filter resources by added date"
                  disabled={query.isFetching}
                  id="student-resource-added-date"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      uploadedOn: event.target.value,
                    }));
                    setPage(1);
                  }}
                  type="date"
                  value={filters.uploadedOn}
                />
              </span>
            </label>
          </div>
        }
        entityLabel="Resource"
        filters={filterDefinitions}
        loading={query.isFetching}
        onClear={reset}
        onFilterChange={updateFilter}
        onSearch={(search) => {
          setFilters((current) => ({ ...current, search }));
          setPage(1);
        }}
        searchPlaceholder="Search resources..."
        searchValue={filters.search}
        values={{ type: filters.type, sort: filters.sort }}
      />

      <section
        className="student-resource-admin-table"
        aria-label="Folder resources"
      >
        <DataTable<StudentFolderResourceItem>
          actions={[
            {
              icon: <ArrowRight aria-hidden="true" size={13} />,
              id: "open",
              label: "Open",
              onAction: (resource) => router.push(getResourceHref(resource)),
            },
          ]}
          columns={columns}
          data={data?.items ?? []}
          emptyState={{
            description:
              filters.search ||
              filters.uploadedOn ||
              filters.type !== ALL ||
              filters.sort !== defaults.sort
                ? "Clear or change the current filters to see more resources."
                : "Resources published to this folder will appear here.",
            title: "No resources found",
          }}
          error={
            query.isError
              ? {
                  description: "The resource list could not be refreshed.",
                  onRetry: () => void query.refetch(),
                  retryLabel: "Retry",
                  title: "Unable to load resources",
                }
              : null
          }
          getRowId={(resource) => resource.id}
          loading={query.isLoading}
          onPageChange={setPage}
          onPageSizeChange={() => undefined}
          pagination={{
            entityLabel: "resources",
            mode: "server",
            page,
            pageSize: PAGE_SIZE,
            pageSizeOptions: [PAGE_SIZE],
            total: data?.meta.total ?? 0,
            totalPages: Math.max(1, data?.meta.totalPages ?? 1),
          }}
          renderToolbar={() => null}
          searchable={false}
          stickyFirstColumn
          stickyHeader
        />
      </section>
    </main>
  );
}

function ResourceSummaryItem({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof Play;
  label: string;
  tone: string;
  value: number;
}) {
  return (
    <div className={`student-resource-list-summary-item ${tone}`}>
      <Icon aria-hidden="true" size={18} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function ResourceNameCell({
  resource,
}: {
  resource: StudentFolderResourceItem;
}) {
  const isVideo = resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO;
  const isDocument = resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT;
  const Icon = isVideo ? Play : isDocument ? FileText : Trophy;
  const tone = isVideo ? "video" : isDocument ? "document" : "exam";
  const colors = getResourceIconColors(tone);

  return (
    <div
      className="student-resource-admin-name"
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
        gap: 9,
        minWidth: 0,
        width: "100%",
      }}
    >
      <span
        className={`student-resource-admin-icon ${tone}`}
        style={{
          alignItems: "center",
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: 7,
          color: colors.color,
          display: "inline-flex",
          flex: "0 0 30px",
          height: 30,
          justifyContent: "center",
          width: 30,
        }}
      >
        <Icon aria-hidden="true" size={15} />
      </span>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <DataTableTextCell primary={resource.title} />
      </div>
    </div>
  );
}

function ResourceTypeCell({
  resource,
}: {
  resource: StudentFolderResourceItem;
}) {
  const isVideo = resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO;
  const isDocument = resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT;
  const Icon = isVideo ? Play : isDocument ? FileText : Trophy;

  return (
    <CrudBadge tone={getResourceTypeTone(resource)}>
      <span
        style={{
          alignItems: "center",
          display: "inline-flex",
          gap: 4,
          whiteSpace: "nowrap",
        }}
      >
        <Icon aria-hidden="true" size={11} strokeWidth={2.2} />
        {getResourceTypeLabel(resource)}
      </span>
    </CrudBadge>
  );
}

function ResourceStatusCell({
  resource,
}: {
  resource: StudentFolderResourceItem;
}) {
  const status = getResourceStatus(resource);

  return (
    <div className="student-resource-admin-status">
      <CrudBadge align="start" tone={status.tone}>
        <span
          style={{
            alignItems: "center",
            display: "inline-flex",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          {renderStatusBadgeIcon(status.label)}
          {status.label}
        </span>
      </CrudBadge>
      {status.percentage != null ? (
        <span
          aria-label={`${status.percentage}% complete`}
          className="student-resource-admin-progress"
        >
          <i style={{ width: `${status.percentage}%` }} />
        </span>
      ) : null}
    </div>
  );
}

function getResourceIconColors(tone: "video" | "document" | "exam") {
  if (tone === "document") {
    return { background: "#FFF2E7", border: "#FFE2CA", color: "#EA580C" };
  }
  if (tone === "exam") {
    return { background: "#E9F8F1", border: "#D5EFE3", color: "#059669" };
  }
  return { background: "#F0EAFF", border: "#E6DCFF", color: "#7C3AED" };
}

function renderStatusBadgeIcon(label: string) {
  const props = { "aria-hidden": true as const, size: 11, strokeWidth: 2.2 };
  if (label === "Completed" || label === "Available") {
    return <CheckCircle2 {...props} />;
  }
  if (label === "Downloadable") return <Download {...props} />;
  if (label === "Upcoming") return <Clock3 {...props} />;
  if (label === "Closed" || label === "Unavailable") {
    return <CircleX {...props} />;
  }
  return <CircleDashed {...props} />;
}

function getResourceHref(resource: StudentFolderResourceItem) {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) {
    return `/student/resources/${resource.id}/video`;
  }
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
    return `/student/resources/${resource.id}`;
  }
  return `/student/resources/${resource.id}/exam`;
}

function getResourceTypeLabel(resource: StudentFolderResourceItem) {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) return "Video";
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) return "Document";
  return "Exam";
}

function getResourceTypeTone(
  resource: StudentFolderResourceItem,
): CrudBadgeTone {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) return "info";
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) return "warning";
  return "success";
}

function getResourceDetail(resource: StudentFolderResourceItem) {
  if (
    resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO &&
    resource.durationInSeconds
  ) {
    return `${Math.ceil(resource.durationInSeconds / 60)} min`;
  }
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
    const mimeType =
      resource.mimeType?.includes("pdf") === true
        ? "PDF"
        : (resource.mimeType?.split("/").pop()?.toUpperCase() ?? "Document");
    const fileSize = formatFileSize(resource.fileSize);
    return fileSize ? `${mimeType} · ${fileSize}` : mimeType;
  }
  if (resource.exam) {
    return `${resource.exam.questionCount} questions · ${resource.exam.durationMinutes} min`;
  }
  return "Exam";
}

function getResourceStatus(resource: StudentFolderResourceItem): {
  label: string;
  percentage: number | null;
  tone: CrudBadgeTone;
} {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) {
    const percentage = Math.max(
      0,
      Math.min(100, resource.progressPercentage ?? 0),
    );
    if (resource.progressStatus === "COMPLETED") {
      return { label: "Completed", percentage: 100, tone: "success" };
    }
    if (resource.progressStatus === "IN_PROGRESS") {
      return { label: `${percentage}% complete`, percentage, tone: "info" };
    }
    return { label: "Not started", percentage: 0, tone: "neutral" };
  }
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
    return {
      label: resource.isDownloadable ? "Downloadable" : "Available",
      percentage: null,
      tone: resource.isDownloadable ? "info" : "neutral",
    };
  }
  if (resource.progressStatus === "COMPLETED") {
    return { label: "Completed", percentage: null, tone: "success" };
  }

  const availability = resource.exam?.availability ?? "UNAVAILABLE";
  if (availability === "AVAILABLE") {
    return { label: "Available", percentage: null, tone: "success" };
  }
  if (availability === "UPCOMING") {
    return { label: "Upcoming", percentage: null, tone: "warning" };
  }
  if (availability === "CLOSED") {
    return { label: "Closed", percentage: null, tone: "danger" };
  }
  return { label: "Unavailable", percentage: null, tone: "neutral" };
}

function formatFileSize(value: string | null) {
  if (!value) return null;
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1_024)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function FolderResourceState({
  label,
  onRetry,
}: {
  label: string;
  onRetry: () => void;
}) {
  return (
    <div className="student-folder-state" role="alert">
      <RefreshCw aria-hidden="true" size={22} />
      <strong>{label}</strong>
      <button onClick={onRetry} type="button">
        Retry
      </button>
    </div>
  );
}
