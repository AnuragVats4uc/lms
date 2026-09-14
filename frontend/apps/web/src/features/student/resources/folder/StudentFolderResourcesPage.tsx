"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { StudentFolderResourceItem } from "@repo/types";

import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { CrudToolbar } from "@/features/admin/components/crud";
import { FolderResourceState } from "./components/FolderResourceState";
import { ALL_FOLDER_RESOURCES, FOLDER_RESOURCES_PAGE_SIZE } from "./constants";
import { useStudentFolderResources } from "./hooks/useStudentFolderResources";
import { createFolderResourceColumns } from "./table/createFolderResourceColumns";
import type { StudentFolderResourcesPageProps } from "./types";
import { defaultFolderResourceFilters } from "./types";
import { getResourceHref } from "./utils/folderResourceFormatting";
import { FolderResourceBreadcrumb } from "./components/FolderResourceBreadcrumb";
import { FolderResourceHeader } from "./components/FolderResourceHeader";
import { FolderResourceSection } from "./components/FolderResourceSection";
import { FolderResourceDateFilter } from "./components/FolderResourceDateFilter";

export const StudentFolderResourcesPage = ({
  sessionCourseId,
  folderId,
}: StudentFolderResourcesPageProps) => {
  const router = useRouter();
  const {
    data,
    filterDefinitions,
    filters,
    page,
    query,
    resetFilters,
    setPage,
    updateFilter,
    updateSearch,
    updateUploadDate,
  } = useStudentFolderResources(sessionCourseId, folderId);
  const columns = useMemo<DataTableColumn<StudentFolderResourceItem>[]>(
    () => createFolderResourceColumns(),
    [],
  );

  const tableActions = [
    {
      icon: <ArrowRight aria-hidden="true" size={13} />,
      id: "open",
      label: "Open",
      onAction: (resource: StudentFolderResourceItem) =>
        router.push(getResourceHref(resource)),
    },
  ];

  const tableEmptyState = {
    description:
      filters.search ||
      filters.uploadedOn ||
      filters.type !== ALL_FOLDER_RESOURCES ||
      filters.sort !== defaultFolderResourceFilters.sort
        ? "Clear or change the current filters to see more resources."
        : "Resources published to this folder will appear here.",
    title: "No resources found",
  };

  const tableError = query.isError
    ? {
        description: "The resource list could not be refreshed.",
        onRetry: () => void query.refetch(),
        retryLabel: "Retry",
        title: "Unable to load resources",
      }
    : null;

  const tablePagination = {
    entityLabel: "resources",
    mode: "server" as any,
    page,
    pageSize: FOLDER_RESOURCES_PAGE_SIZE,
    pageSizeOptions: [FOLDER_RESOURCES_PAGE_SIZE],
    total: data?.meta.total ?? 0,
    totalPages: Math.max(1, data?.meta.totalPages ?? 1),
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
      <FolderResourceBreadcrumb sessionCourseId={sessionCourseId} data={data} />
      <FolderResourceHeader data={data} />
      {data?.folders.length ? (
        <FolderResourceSection data={data} sessionCourseId={sessionCourseId} />
      ) : null}

      <CrudToolbar
        actions={
          <FolderResourceDateFilter
            query={query}
            filters={filters}
            updateUploadDate={updateUploadDate}
          />
        }
        entityLabel="Resource"
        filters={filterDefinitions}
        loading={query.isFetching}
        onClear={resetFilters}
        onFilterChange={updateFilter}
        onSearch={updateSearch}
        searchPlaceholder="Search resources..."
        searchValue={filters.search}
        values={{ type: filters.type, sort: filters.sort }}
      />

      <section
        className="student-resource-admin-table"
        aria-label="Folder resources"
      >
        <DataTable<StudentFolderResourceItem>
          actions={tableActions}
          columns={columns}
          data={data?.items ?? []}
          emptyState={tableEmptyState}
          error={tableError}
          getRowId={(resource) => resource.id}
          loading={query.isLoading}
          onPageChange={setPage}
          onPageSizeChange={() => undefined}
          pagination={tablePagination}
          renderToolbar={() => null}
          searchable={false}
          stickyFirstColumn
          stickyHeader
        />
      </section>
    </main>
  );
};
