"use client";

import { useMemo } from "react";
import type { StudentResourceItem } from "@repo/types";
import { RESOURCE_TYPE_IDS } from "@repo/types";
import { YStack } from "@repo/ui";

import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { useStudentResources } from "./hooks/useStudentResources";
import { createResourceColumns } from "./table/createResourceColumns";
import type { StudentResourcesPageProps } from "./types";
import { ResourceHeader } from "./components/ResourceHeader";
import { ResourceSummaryGrid } from "./components/ResourceSummaryGrid";
import { ResourceFilterToolbar } from "./components/ResourceFilterToolbar";

export const StudentResourcesPage = ({
  initialSearch = "",
  initialResourceTypeId,
  subtitle = "Access all your learning materials in one place",
  title = "Resources",
}: StudentResourcesPageProps) => {
  const {
    applyFilters,
    data,
    draftFilters,
    filtersVisible,
    page,
    pageSize,
    resetFilters,
    resourcesQuery,
    setFiltersVisible,
    setPage,
    subjectOptions,
    updateCourse,
    updateFilter,
    updatePageSize,
  } = useStudentResources(initialSearch, initialResourceTypeId);
  const columns = useMemo<DataTableColumn<StudentResourceItem>[]>(
    () => createResourceColumns(),
    [],
  );

  const emptyState = {
    description:
      initialResourceTypeId === RESOURCE_TYPE_IDS.EXAM
        ? "No exams are currently assigned through your enrolled courses."
        : "Try adjusting your filters.",
    title:
      initialResourceTypeId === RESOURCE_TYPE_IDS.EXAM
        ? "No assigned exams"
        : "No resources found",
  };

  const error = resourcesQuery.isError
    ? {
        description:
          initialResourceTypeId === RESOURCE_TYPE_IDS.EXAM
            ? "Your assigned exams could not be loaded."
            : "Your learning resources could not be loaded.",
        onRetry: () => void resourcesQuery.refetch(),
        retryLabel: "Retry",
        title:
          initialResourceTypeId === RESOURCE_TYPE_IDS.EXAM
            ? "Unable to load exams"
            : "Unable to load resources",
      }
    : null;

  const pagination = {
    entityLabel:
      initialResourceTypeId === RESOURCE_TYPE_IDS.EXAM ? "exams" : "resources",
    mode: "server" as any,
    page,
    pageSize,
    pageSizeOptions: [10, 25, 50],
    total: data?.meta.total ?? 0,
    totalPages: data?.meta.totalPages ?? 1,
  };

  return (
    <YStack className="student-resources-page">
      <ResourceHeader title={title} subtitle={subtitle} />
      <ResourceSummaryGrid
        data={data}
        initialResourceTypeId={initialResourceTypeId}
        resourcesQuery={resourcesQuery}
      />
      <ResourceFilterToolbar
        applyFilters={applyFilters}
        data={data}
        draftFilters={draftFilters}
        filtersVisible={filtersVisible}
        initialResourceTypeId={initialResourceTypeId}
        resetFilters={resetFilters}
        resourcesQuery={resourcesQuery}
        setFiltersVisible={setFiltersVisible}
        subjectOptions={subjectOptions}
        updateCourse={updateCourse}
        updateFilter={updateFilter}
      />

      <DataTable<StudentResourceItem>
        columns={columns}
        data={data?.items ?? []}
        emptyState={emptyState}
        error={error}
        getRowId={(resource) => resource.id}
        loading={resourcesQuery.isLoading}
        onPageChange={setPage}
        onPageSizeChange={updatePageSize}
        pagination={pagination}
        renderToolbar={() => null}
        searchable={false}
        stickyFirstColumn
        stickyHeader
      />
    </YStack>
  );
};
export default StudentResourcesPage;
