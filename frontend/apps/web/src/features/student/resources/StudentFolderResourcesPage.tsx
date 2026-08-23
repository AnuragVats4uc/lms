"use client";

import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileText,
  FolderOpen,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
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

import { DataTablePagination } from "@/components/DataTable";
import { CrudSelect } from "@/features/admin/components/crud";

const ALL = "ALL";
const PAGE_SIZE = 12;
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
  const [draft, setDraft] = useState(defaults);
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
  const typeOptions = [
    { label: "All Types", value: ALL },
    ...(data?.filters.types ?? []).map((type) => ({
      label: type.name,
      value: String(type.id),
    })),
  ];

  const apply = () => {
    setPage(1);
    setFilters(draft);
  };
  const reset = () => {
    setDraft(defaults);
    setFilters(defaults);
    setPage(1);
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
    <main className="student-folder-page">
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

      <header className="student-folder-page-header compact">
        <div>
          <span className="student-folder-eyebrow">Course resources</span>
          <h1>{data?.folder.name ?? "Loading folder..."}</h1>
          <p>
            {data?.folder.description ??
              data?.course.name ??
              "Videos, documents and exams assigned to this folder."}
          </p>
        </div>
        <div className="student-folder-total">
          <FolderOpen size={21} />
          <strong>{data?.summary.total ?? 0}</strong>
          <span>Resources</span>
        </div>
      </header>

      <section
        className="student-folder-filter-panel"
        aria-label="Resource filters"
      >
        <label className="student-folder-filter-field search">
          <span>Search</span>
          <div className="student-resource-search-control">
            <Search size={15} />
            <input
              value={draft.search}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              onKeyDown={(event) => event.key === "Enter" && apply()}
              placeholder="Search resources..."
            />
          </div>
        </label>
        <div className="student-folder-filter-field">
          <span>Resource type</span>
          <CrudSelect
            ariaLabel="Resource type"
            options={typeOptions}
            value={draft.type}
            onChange={(type) =>
              setDraft((current) => ({
                ...current,
                type: type as Filters["type"],
              }))
            }
            variant="form"
          />
        </div>
        <label className="student-folder-filter-field">
          <span>Added date</span>
          <div className="student-resource-date-control">
            <CalendarDays size={15} />
            <input
              type="date"
              value={draft.uploadedOn}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  uploadedOn: event.target.value,
                }))
              }
            />
          </div>
        </label>
        <div className="student-folder-filter-field">
          <span>Sort by</span>
          <CrudSelect
            ariaLabel="Sort resources"
            options={[
              { label: "Newest First", value: "NEWEST" },
              { label: "Oldest First", value: "OLDEST" },
              { label: "Name A–Z", value: "TITLE_ASC" },
              { label: "Name Z–A", value: "TITLE_DESC" },
            ]}
            value={draft.sort}
            onChange={(sort) =>
              setDraft((current) => ({
                ...current,
                sort: sort as StudentResourcesSort,
              }))
            }
            variant="form"
          />
        </div>
        <div className="student-folder-filter-actions">
          <button
            className="student-folder-primary-button"
            onClick={apply}
            disabled={query.isFetching}
          >
            Apply
          </button>
          <button className="student-folder-secondary-button" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </section>

      <section
        className="student-folder-summary-row"
        aria-label="Resource totals"
      >
        <Summary
          icon={Play}
          label="Videos"
          value={data?.summary.videos ?? 0}
          tone="purple"
        />
        <Summary
          icon={FileText}
          label="Documents"
          value={data?.summary.documents ?? 0}
          tone="orange"
        />
        <Summary
          icon={Trophy}
          label="Exams"
          value={data?.summary.exams ?? 0}
          tone="green"
        />
      </section>

      {query.isLoading ? (
        <FolderResourceState label="Loading folder resources..." />
      ) : data?.items.length ? (
        <section
          className="student-folder-resource-grid"
          aria-label="Folder resources"
        >
          {data.items.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </section>
      ) : (
        <FolderResourceState label="No resources match these filters." />
      )}

      {data && data.meta.totalPages > 1 ? (
        <DataTablePagination
          page={page}
          pageSize={PAGE_SIZE}
          pageSizeOptions={[PAGE_SIZE]}
          pagination={{ entityLabel: "resources" }}
          setPage={setPage}
          setPageSize={() => undefined}
          total={data.meta.total}
          totalPages={data.meta.totalPages}
        />
      ) : null}
    </main>
  );
}

function ResourceCard({ resource }: { resource: StudentFolderResourceItem }) {
  const isVideo = resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO;
  const isDocument = resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT;
  const href = isVideo
    ? `/student/resources/${resource.id}/video`
    : isDocument
      ? `/student/resources/${resource.id}`
      : `/student/resources/${resource.id}/exam`;
  const Icon = isVideo ? Play : isDocument ? FileText : Trophy;
  const detail =
    isVideo && resource.durationInSeconds
      ? `${Math.ceil(resource.durationInSeconds / 60)} min`
      : isDocument
        ? (resource.mimeType?.split("/").pop()?.toUpperCase() ?? "Document")
        : resource.exam
          ? `${resource.exam.questionCount} questions · ${resource.exam.durationMinutes} min`
          : "Exam";
  return (
    <Link
      className={`student-folder-resource-card ${isVideo ? "video" : isDocument ? "document" : "exam"}`}
      href={href}
    >
      <div
        className="student-folder-resource-media"
        style={
          resource.thumbnail
            ? { backgroundImage: `url(${resource.thumbnail})` }
            : undefined
        }
      >
        <Icon size={24} />
      </div>
      <div className="student-folder-resource-copy">
        <span>{resource.resourceType.name}</span>
        <h2>{resource.title}</h2>
        <p>{resource.description ?? "Open this learning resource."}</p>
      </div>
      <footer>
        <span>
          <Clock3 size={14} /> {detail}
        </span>
        {resource.progressStatus ? (
          <strong>{resource.progressStatus.replaceAll("_", " ")}</strong>
        ) : null}
      </footer>
    </Link>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Play;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`student-folder-summary-card ${tone}`}>
      <Icon size={19} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function FolderResourceState({
  label,
  onRetry,
}: {
  label: string;
  onRetry?: () => void;
}) {
  return (
    <div className="student-folder-state">
      <FolderOpen size={34} />
      <strong>{label}</strong>
      {onRetry ? (
        <button className="student-folder-primary-button" onClick={onRetry}>
          <RefreshCw size={15} /> Retry
        </button>
      ) : null}
    </div>
  );
}
