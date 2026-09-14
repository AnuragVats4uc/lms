"use client";

import { RefreshCw } from "lucide-react";
import { CourseFoldersState } from "./components/CourseFoldersState";
import { FolderPagination } from "./components/FolderPagination";
import { FolderBreadcrumb } from "./components/FolderBreadcrumb";
import { CourseFoldersHeader } from "./components/CourseFoldersHeader";
import { CourseFolderToolbar } from "./components/CourseFoldersToolbar";
import { CourseFoldersGrid } from "./components/CourseFoldersGrid";
import { CourseFolderEmptyState } from "./components/CourseFolderEmptyState";
import { useStudentCourseFolders } from "./hooks/useStudentCourseFolders";

export const StudentCourseFoldersPage = ({
  sessionCourseId,
}: {
  sessionCourseId: number;
}) => {
  const {
    currentPage,
    filteredFolders,
    firstVisibleIndex,
    folders,
    handleSearchChange,
    handleSortChange,
    handleTypeFilterChange,
    query,
    resetFilters,
    search,
    setPage,
    sort,
    summary,
    totalPages,
    typeFilter,
    visibleFolders,
  } = useStudentCourseFolders(sessionCourseId);

  if (query.isLoading) {
    return <CourseFoldersState label="Loading course folders..." />;
  }

  if (query.isError || !query.data) {
    return (
      <CourseFoldersState
        label="We could not load this assigned course."
        action={
          <button
            className="student-folder-primary-button"
            onClick={() => query.refetch()}
          >
            <RefreshCw size={15} /> Retry
          </button>
        }
      />
    );
  }

  const { course } = query.data;

  return (
    <main className="student-folder-page student-course-folders-page">
      <FolderBreadcrumb name={course?.name ?? ""} />
      <CourseFoldersHeader
        course={course}
        folders={folders}
        summary={summary}
      />

      {folders.length ? (
        <section
          className="student-course-folder-section"
          aria-labelledby="course-folders-title"
        >
          <CourseFolderToolbar
            sort={sort}
            search={search}
            typeFilter={typeFilter}
            onChangeSearch={handleSearchChange}
            onChangeResourceSelect={handleTypeFilterChange}
            onChangeCourseOrder={handleSortChange}
          />

          {visibleFolders.length ? (
            <>
              <CourseFoldersGrid
                firstVisibleIndex={firstVisibleIndex}
                sessionCourseId={sessionCourseId}
                visibleFolders={visibleFolders}
              />

              <FolderPagination
                currentPage={currentPage}
                firstVisibleIndex={firstVisibleIndex}
                onPageChange={setPage}
                totalItems={filteredFolders.length}
                totalPages={totalPages}
                visibleItems={visibleFolders.length}
              />
            </>
          ) : (
            <CourseFolderEmptyState resetFilters={resetFilters} />
          )}
        </section>
      ) : (
        <CourseFoldersState label="No learning folders are available for this course yet." />
      )}
    </main>
  );
};
