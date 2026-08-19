"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  FolderOpen,
  MoreVertical,
  Play,
  RotateCcw,
  Search,
  Trophy,
  Video,
  type LucideIcon,
} from "lucide-react";
import { studentsApi } from "@repo/api";
import type {
  ResourceStatus,
  ResourceTypeCode,
  ResourceTypeId,
  StudentResourceItem,
  StudentResourcesQuery,
  StudentResourcesSort,
} from "@repo/types";
import { Text, XStack, YStack } from "@repo/ui";
import { AppBadge } from "@repo/ui/primitives";

import {
  DataTable,
  DataTableAvatarCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudSelect } from "@/features/admin/components/crud";

type FilterValues = {
  search: string;
  resourceTypeId: "ALL" | `${ResourceTypeId}`;
  courseId: string;
  subjectId: string;
  uploadedOn: string;
  status: "ALL" | ResourceStatus;
  sort: StudentResourcesSort;
};

const DEFAULT_PAGE_SIZE = 10;
const ALL = "ALL";
const sortOptions = [
  { label: "Newest First", value: "NEWEST" },
  { label: "Oldest First", value: "OLDEST" },
  { label: "Name A–Z", value: "TITLE_ASC" },
  { label: "Name Z–A", value: "TITLE_DESC" },
] as const;

function createDefaultFilters(search = ""): FilterValues {
  return {
    search,
    resourceTypeId: ALL,
    courseId: ALL,
    subjectId: ALL,
    uploadedOn: "",
    status: ALL,
    sort: "NEWEST",
  };
}

export function StudentResourcesPage({
  initialSearch = "",
}: {
  initialSearch?: string;
}) {
  const [draftFilters, setDraftFilters] = useState(() =>
    createDefaultFilters(initialSearch),
  );
  const [appliedFilters, setAppliedFilters] = useState(() =>
    createDefaultFilters(initialSearch),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const resourceQuery = useMemo<StudentResourcesQuery>(
    () => ({
      page,
      limit: pageSize,
      search: appliedFilters.search || undefined,
      resourceTypeId:
        appliedFilters.resourceTypeId === ALL
          ? undefined
          : Number(appliedFilters.resourceTypeId) as ResourceTypeId,
      sessionCourseId:
        appliedFilters.courseId === ALL
          ? undefined
          : Number(appliedFilters.courseId),
      folderId:
        appliedFilters.subjectId === ALL
          ? undefined
          : Number(appliedFilters.subjectId),
      uploadedOn: appliedFilters.uploadedOn || undefined,
      status: appliedFilters.status === ALL ? undefined : appliedFilters.status,
      sort: appliedFilters.sort,
    }),
    [appliedFilters, page, pageSize],
  );
  const resourcesQuery = useQuery({
    queryFn: () => studentsApi.findMyResources(resourceQuery),
    queryKey: ["student-resources", resourceQuery],
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const data = resourcesQuery.data;
  const subjectOptions =
    data?.filters.subjects.filter(
      (subject) =>
        draftFilters.courseId === ALL ||
        subject.sessionCourseId === Number(draftFilters.courseId),
    ) ?? [];
  const columns = useMemo<DataTableColumn<StudentResourceItem>[]>(
    () => createColumns(),
    [],
  );

  const updateFilter = <Key extends keyof FilterValues>(
    key: Key,
    value: FilterValues[Key],
  ) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const resetFilters = () => {
    const reset = createDefaultFilters();
    setDraftFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  return (
    <YStack className="student-resources-page">
      <YStack className="student-resources-heading">
        <Text className="student-resources-title">Resources</Text>
        <Text className="student-resources-subtitle">
          Access all your learning materials in one place
        </Text>
      </YStack>

      <div className="student-resource-summary-grid">
        <SummaryCard
          Icon={FolderOpen}
          label="Total Resources"
          loading={resourcesQuery.isLoading}
          tone="green"
          value={data?.summary.total ?? 0}
          supportingText="Across your enrolled courses"
        />
        <SummaryCard
          Icon={Video}
          label="Videos"
          loading={resourcesQuery.isLoading}
          tone="purple"
          value={data?.summary.videos ?? 0}
          supportingText={percentageLabel(
            data?.summary.videos ?? 0,
            data?.summary.total ?? 0,
          )}
        />
        <SummaryCard
          Icon={FileText}
          label="Documents"
          loading={resourcesQuery.isLoading}
          tone="orange"
          value={data?.summary.documents ?? 0}
          supportingText={percentageLabel(
            data?.summary.documents ?? 0,
            data?.summary.total ?? 0,
          )}
        />
      </div>

      <section
        className="student-resource-filter-panel"
        aria-label="Resource filters"
      >
        {filtersVisible ? (
          <div className="student-resource-filter-grid">
            <FilterField className="is-search" label="Search by Name">
              <div className="student-resource-search-control">
                <Search aria-hidden="true" size={16} strokeWidth={2} />
                <input
                  aria-label="Search by resource name"
                  onChange={(event) =>
                    updateFilter("search", event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyFilters();
                  }}
                  placeholder="Search resource name, topic..."
                  type="search"
                  value={draftFilters.search}
                />
              </div>
            </FilterField>

            <FilterField label="Resource Type">
              <CrudSelect
                ariaLabel="Resource type"
                disabled={resourcesQuery.isLoading}
                onChange={(value) =>
                  updateFilter(
                    "resourceTypeId",
                    value as FilterValues["resourceTypeId"],
                  )
                }
                options={[
                  { label: "All Types", value: ALL },
                  ...(data?.filters.types ?? []).map((type) => ({
                    label: type.name,
                    value: String(type.id),
                  })),
                ]}
                value={draftFilters.resourceTypeId}
                variant="form"
                width="100%"
              />
            </FilterField>

            <FilterField label="Course">
              <CrudSelect
                ariaLabel="Course"
                disabled={resourcesQuery.isLoading}
                onChange={(value) => {
                  setDraftFilters((current) => ({
                    ...current,
                    courseId: value,
                    subjectId: ALL,
                  }));
                }}
                options={[
                  { label: "All Courses", value: ALL },
                  ...(data?.filters.courses ?? []).map((course) => ({
                    label: course.name,
                    value: String(course.id),
                  })),
                ]}
                value={draftFilters.courseId}
                variant="form"
                width="100%"
              />
            </FilterField>

            <FilterField label="Subject">
              <CrudSelect
                ariaLabel="Subject"
                disabled={resourcesQuery.isLoading || !subjectOptions.length}
                onChange={(value) => updateFilter("subjectId", value)}
                options={[
                  { label: "All Subjects", value: ALL },
                  ...subjectOptions.map((subject) => ({
                    label: subject.name,
                    value: String(subject.id),
                  })),
                ]}
                value={draftFilters.subjectId}
                variant="form"
                width="100%"
              />
            </FilterField>

            <FilterField label="Upload Date">
              <div className="student-resource-date-control">
                <CalendarDays aria-hidden="true" size={16} strokeWidth={2} />
                <input
                  aria-label="Upload date"
                  onChange={(event) =>
                    updateFilter("uploadedOn", event.target.value)
                  }
                  type="date"
                  value={draftFilters.uploadedOn}
                />
              </div>
            </FilterField>

            <FilterField label="Status">
              <CrudSelect
                ariaLabel="Status"
                disabled={resourcesQuery.isLoading}
                onChange={(value) =>
                  updateFilter("status", value as FilterValues["status"])
                }
                options={[
                  { label: "All Status", value: ALL },
                  ...(data?.filters.statuses ?? []).map((status) => ({
                    label: formatEnum(status),
                    value: status,
                  })),
                ]}
                value={draftFilters.status}
                variant="form"
                width="100%"
              />
            </FilterField>

            <FilterField label="Sort By">
              <CrudSelect
                ariaLabel="Sort resources"
                onChange={(value) =>
                  updateFilter("sort", value as StudentResourcesSort)
                }
                options={sortOptions}
                value={draftFilters.sort}
                variant="form"
                width="100%"
              />
            </FilterField>

            <div className="student-resource-filter-actions">
              <button
                className="student-resource-apply-button"
                disabled={resourcesQuery.isFetching}
                onClick={applyFilters}
                type="button"
              >
                <span>Apply Filters</span>
                <Filter aria-hidden="true" size={14} strokeWidth={2.2} />
              </button>
              <button
                className="student-resource-reset-button"
                disabled={resourcesQuery.isFetching}
                onClick={resetFilters}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={14} strokeWidth={2.2} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        ) : null}

        <button
          aria-expanded={filtersVisible}
          className="student-resource-filter-toggle"
          onClick={() => setFiltersVisible((current) => !current)}
          type="button"
        >
          <span>{filtersVisible ? "Hide Filters" : "Show Filters"}</span>
          {filtersVisible ? (
            <ChevronUp aria-hidden="true" size={14} />
          ) : (
            <ChevronDown aria-hidden="true" size={14} />
          )}
        </button>
      </section>

      <DataTable<StudentResourceItem>
        columns={columns}
        data={data?.items ?? []}
        emptyState={{
          description: "Try adjusting your filters.",
          title: "No resources found",
        }}
        error={
          resourcesQuery.isError
            ? {
                description: "Your learning resources could not be loaded.",
                onRetry: () => void resourcesQuery.refetch(),
                retryLabel: "Retry",
                title: "Unable to load resources",
              }
            : null
        }
        getRowId={(resource) => resource.id}
        loading={resourcesQuery.isLoading}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        pagination={{
          entityLabel: "resources",
          mode: "server",
          page,
          pageSize,
          pageSizeOptions: [10, 25, 50],
          total: data?.meta.total ?? 0,
          totalPages: data?.meta.totalPages ?? 1,
        }}
        renderToolbar={() => null}
        searchable={false}
        stickyFirstColumn
        stickyHeader
      />
    </YStack>
  );
}

function SummaryCard({
  Icon,
  label,
  loading,
  supportingText,
  tone,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  loading: boolean;
  supportingText: string;
  tone: "green" | "purple" | "orange";
  value: number;
}) {
  return (
    <div className="student-resource-summary-card">
      <div className={`student-resource-summary-icon ${tone}`}>
        <Icon aria-hidden="true" size={22} strokeWidth={2} />
      </div>
      <div className="student-resource-summary-copy">
        <span>{label}</span>
        {loading ? (
          <div className="student-resource-summary-skeleton" />
        ) : (
          <strong>{value.toLocaleString()}</strong>
        )}
        <small>{supportingText}</small>
      </div>
    </div>
  );
}

function FilterField({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`student-resource-filter-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function createColumns(): DataTableColumn<StudentResourceItem>[] {
  return [
    {
      cell: ({ row }) => <ResourceCell resource={row} />,
      header: "Resource",
      id: "resource",
      sticky: true,
      width: 280,
    },
    {
      cell: ({ row }) => (
        <ResourceTypeCell
          label={row.resourceType.name}
          type={row.resourceType.code}
        />
      ),
      header: "Type",
      id: "type",
      width: 100,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.course.name}
          secondary={row.course.sessionName}
        />
      ),
      header: "Course",
      id: "course",
      width: 165,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell primary={row.subject.name || "—"} />
      ),
      header: "Subject",
      id: "subject",
      width: 135,
    },
    {
      cell: ({ row }) =>
        row.uploadedBy ? (
          <DataTableAvatarCell
            imageSrc={row.uploadedBy.avatar ?? undefined}
            label={row.uploadedBy.name}
          />
        ) : (
          <DataTableTextCell primary="—" />
        ),
      header: "Uploaded By",
      id: "uploadedBy",
      width: 120,
    },
    {
      cell: ({ row }) => <UploadDateCell value={row.createdAt} />,
      header: "Upload Date",
      id: "createdAt",
      width: 130,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell primary={formatSizeOrDuration(row)} />
      ),
      header: "Size / Duration",
      id: "sizeOrDuration",
      width: 120,
    },
    {
      cell: ({ row }) => (
        <AppBadge tone={statusTone(row.status)}>
          {formatEnum(row.status)}
        </AppBadge>
      ),
      header: "Status",
      id: "status",
      width: 105,
    },
    {
      align: "center",
      cell: ({ row }) => <ResourceAction resource={row} />,
      header: "Actions",
      id: "actions",
      meta: { stickyEnd: true },
      width: 76,
    },
  ];
}

function ResourceCell({ resource }: { resource: StudentResourceItem }) {
  const resourcePath =
    resource.resourceType.code === "DOCUMENT"
      ? `/student/resources/${resource.id}`
      : resource.resourceType.code === "VIDEO"
        ? `/student/resources/${resource.id}/video`
        : null;

  return (
    <XStack className="student-resource-cell">
      {resource.resourceType.code === "VIDEO" && resource.thumbnail ? (
        <div
          aria-label={`${resource.title} thumbnail`}
          className="student-resource-thumbnail"
          role="img"
          style={{ backgroundImage: `url("${resource.thumbnail}")` }}
        >
          <span>
            <Play aria-hidden="true" fill="currentColor" size={12} />
          </span>
        </div>
      ) : (
        <div
          className={`student-resource-file-icon ${resource.resourceType.code.toLowerCase()}`}
        >
          {resource.resourceType.code === "EXAM" ? (
            <Trophy aria-hidden="true" size={18} />
          ) : (
            <FileText aria-hidden="true" size={18} />
          )}
          <small>{resourceFormat(resource)}</small>
        </div>
      )}
      <YStack className="student-resource-cell-copy">
        {resourcePath ? (
          <Link href={resourcePath}>{resource.title}</Link>
        ) : (
          <strong>{resource.title}</strong>
        )}
        <span>
          {resource.resourceType.name} · {resourceFormat(resource)}
        </span>
      </YStack>
    </XStack>
  );
}

function ResourceTypeCell({
  label,
  type,
}: {
  label: string;
  type: ResourceTypeCode;
}) {
  const Icon = type === "VIDEO" ? Play : type === "EXAM" ? Trophy : FileText;
  return (
    <XStack className={`student-resource-type-cell ${type.toLowerCase()}`}>
      <span className="student-resource-type-icon">
        <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
      </span>
      <span className="student-resource-type-label">{label}</span>
    </XStack>
  );
}

function UploadDateCell({ value }: { value: string }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <DataTableTextCell primary="—" />;

  return (
    <DataTableTextCell
      primary={new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date)}
      secondary={new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date)}
    />
  );
}

function ResourceAction({ resource }: { resource: StudentResourceItem }) {
  const resourcePath =
    resource.resourceType.code === "DOCUMENT"
      ? `/student/resources/${resource.id}`
      : resource.resourceType.code === "VIDEO"
        ? `/student/resources/${resource.id}/video`
        : null;
  if (resourcePath) {
    return (
      <Link
        aria-label={`Open ${resource.title}`}
        className="student-resource-action"
        href={resourcePath}
      >
        <MoreVertical aria-hidden="true" size={18} strokeWidth={2.2} />
      </Link>
    );
  }
  return <span className="student-resource-no-action">—</span>;
}

function formatSizeOrDuration(resource: StudentResourceItem) {
  if (resource.resourceType.code === "VIDEO") {
    return resource.durationInSeconds == null
      ? "—"
      : formatDuration(resource.durationInSeconds);
  }
  if (!resource.fileSize) return "—";
  const bytes = Number(resource.fileSize);
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${Math.round(bytes / 1_024)} KB`;
  return `${bytes} B`;
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function resourceFormat(resource: StudentResourceItem) {
  if (resource.resourceType.code === "VIDEO") return "VIDEO";
  if (resource.resourceType.code === "EXAM") return "EXAM";
  const mime = resource.mimeType?.toLowerCase() ?? "";
  if (mime.includes("presentation")) return "PPT";
  if (mime.includes("word")) return "DOC";
  if (mime.includes("pdf")) return "PDF";
  return "FILE";
}

function percentageLabel(value: number, total: number) {
  if (!total) return "0% of total";
  return `${Math.round((value / total) * 100)}% of total`;
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: ResourceStatus) {
  if (status === "PUBLISHED") return "green" as const;
  if (status === "ARCHIVED") return "gray" as const;
  return "orange" as const;
}

export default StudentResourcesPage;
