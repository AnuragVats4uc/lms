"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Play,
  RefreshCw,
  Search,
  Trophy,
} from "lucide-react";
import { studentsApi } from "@repo/api";

const FOLDERS_PER_PAGE = 10;

type FolderTypeFilter = "ALL" | "VIDEO" | "DOCUMENT" | "EXAM";
type FolderSort = "COURSE_ORDER" | "NAME" | "RESOURCES";

export function StudentCourseFoldersPage({
  sessionCourseId,
}: {
  sessionCourseId: number;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FolderTypeFilter>("ALL");
  const [sort, setSort] = useState<FolderSort>("COURSE_ORDER");
  const query = useQuery({
    queryKey: ["student-course-folders", sessionCourseId],
    queryFn: () => studentsApi.findMyCourseFolders(sessionCourseId),
    staleTime: 30_000,
  });

  const folders = useMemo(
    () => query.data?.folders ?? [],
    [query.data?.folders],
  );
  const summary = useMemo(
    () =>
      folders.reduce(
        (totals, folder) => ({
          exams: totals.exams + folder.resourceCounts.exams,
          resources: totals.resources + folder.resourceCounts.total,
        }),
        { exams: 0, resources: 0 },
      ),
    [folders],
  );
  const filteredFolders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const matchesType = (folder: (typeof folders)[number]) => {
      if (typeFilter === "VIDEO") return folder.resourceCounts.videos > 0;
      if (typeFilter === "DOCUMENT") {
        return folder.resourceCounts.documents > 0;
      }
      if (typeFilter === "EXAM") return folder.resourceCounts.exams > 0;
      return true;
    };

    const matches = folders.filter(
      (folder) =>
        matchesType(folder) &&
        (!normalizedSearch ||
          folder.name.toLocaleLowerCase().includes(normalizedSearch) ||
          folder.description?.toLocaleLowerCase().includes(normalizedSearch)),
    );

    if (sort === "NAME") {
      return [...matches].sort((first, second) =>
        first.name.localeCompare(second.name),
      );
    }
    if (sort === "RESOURCES") {
      return [...matches].sort(
        (first, second) =>
          second.resourceCounts.total - first.resourceCounts.total ||
          first.name.localeCompare(second.name),
      );
    }
    return matches;
  }, [folders, search, sort, typeFilter]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFolders.length / FOLDERS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const firstVisibleIndex = (currentPage - 1) * FOLDERS_PER_PAGE;
  const visibleFolders = filteredFolders.slice(
    firstVisibleIndex,
    firstVisibleIndex + FOLDERS_PER_PAGE,
  );

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
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setSort("COURSE_ORDER");
    setPage(1);
  };

  return (
    <main className="student-folder-page student-course-folders-page">
      <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
        <Link href="/student/my-courses">My Courses</Link>
        <span>/</span>
        <span>{course.name}</span>
      </nav>

      <header className="student-course-folder-hero">
        <div className="student-course-folder-hero-copy">
          <span className="student-folder-eyebrow">{course.sessionName}</span>
          <h1>{course.name}</h1>
          <p>{course.description ?? "Choose a folder to continue learning."}</p>
        </div>

        <div className="student-course-folder-summary">
          <SummaryItem
            icon={<FolderOpen size={19} />}
            label="Folders"
            value={folders.length}
          />
          <SummaryItem
            icon={<FileText size={19} />}
            label="Resources"
            value={summary.resources}
          />
          <SummaryItem
            icon={<Trophy size={19} />}
            label="Exams"
            value={summary.exams}
          />
        </div>
      </header>

      {folders.length ? (
        <section
          className="student-course-folder-section"
          aria-labelledby="course-folders-title"
        >
          <div className="student-course-folder-toolbar">
            <div className="student-course-folder-heading">
              <h2 id="course-folders-title">Course folders</h2>
              <span>Browse your learning resources</span>
            </div>

            <div className="student-course-folder-controls">
              <label className="student-course-folder-search">
                <Search aria-hidden="true" size={16} />
                <input
                  aria-label="Search course folders"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search folders"
                  type="search"
                  value={search}
                />
              </label>

              <select
                aria-label="Filter folders by resource type"
                className="student-course-folder-select"
                onChange={(event) => {
                  setTypeFilter(event.target.value as FolderTypeFilter);
                  setPage(1);
                }}
                value={typeFilter}
              >
                <option value="ALL">All types</option>
                <option value="VIDEO">With videos</option>
                <option value="DOCUMENT">With documents</option>
                <option value="EXAM">With exams</option>
              </select>

              <select
                aria-label="Sort course folders"
                className="student-course-folder-select"
                onChange={(event) => {
                  setSort(event.target.value as FolderSort);
                  setPage(1);
                }}
                value={sort}
              >
                <option value="COURSE_ORDER">Course order</option>
                <option value="NAME">Name A–Z</option>
                <option value="RESOURCES">Most resources</option>
              </select>
            </div>
          </div>

          {visibleFolders.length ? (
            <>
              <div
                className="student-course-folder-grid"
                aria-label="Course folders"
              >
                {visibleFolders.map((folder, index) => (
                  <Link
                    className={`student-course-folder-card tone-${((firstVisibleIndex + index) % 5) + 1}`}
                    href={`/student/my-courses/${sessionCourseId}/folders/${folder.id}`}
                    key={folder.id}
                  >
                    <div className="student-course-folder-card-header">
                      <div className="student-course-folder-card-icon">
                        <FolderOpen size={21} />
                      </div>
                      <div className="student-course-folder-card-copy">
                        <h3 title={folder.name}>{folder.name}</h3>
                        <p>
                          {folder.description ?? "Course learning resources"}
                        </p>
                      </div>
                    </div>

                    <div className="student-course-folder-card-stats">
                      <span title={`${folder.resourceCounts.videos} videos`}>
                        <Play aria-hidden="true" size={13} />
                        {folder.resourceCounts.videos}
                      </span>
                      <span
                        title={`${folder.resourceCounts.documents} documents`}
                      >
                        <FileText aria-hidden="true" size={13} />
                        {folder.resourceCounts.documents}
                      </span>
                      <span title={`${folder.resourceCounts.exams} exams`}>
                        <Trophy aria-hidden="true" size={13} />
                        {folder.resourceCounts.exams}
                      </span>
                    </div>

                    <footer>
                      <strong>
                        {folder.resourceCounts.total}{" "}
                        {folder.resourceCounts.total === 1
                          ? "resource"
                          : "resources"}
                      </strong>
                      <span>Open →</span>
                    </footer>
                  </Link>
                ))}
              </div>

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
            <div className="student-course-folder-empty">
              <Search aria-hidden="true" size={24} />
              <div>
                <strong>No matching folders</strong>
                <span>Try a different search or resource type.</span>
              </div>
              <button onClick={resetFilters} type="button">
                Clear filters
              </button>
            </div>
          )}
        </section>
      ) : (
        <CourseFoldersState label="No learning folders are available for this course yet." />
      )}
    </main>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="student-course-folder-summary-item">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function FolderPagination({
  currentPage,
  firstVisibleIndex,
  onPageChange,
  totalItems,
  totalPages,
  visibleItems,
}: {
  currentPage: number;
  firstVisibleIndex: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  totalPages: number;
  visibleItems: number;
}) {
  const pageItems = getPaginationItems(currentPage, totalPages);

  return (
    <nav
      className="student-course-folder-pagination"
      aria-label="Folder pagination"
    >
      <span aria-live="polite">
        Showing {firstVisibleIndex + 1}–{firstVisibleIndex + visibleItems} of{" "}
        {totalItems} folders
      </span>
      <div>
        <button
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={15} />
        </button>
        {pageItems.map((item) =>
          typeof item === "number" ? (
            <button
              aria-current={item === currentPage ? "page" : undefined}
              aria-label={`Page ${item}`}
              className={item === currentPage ? "active" : undefined}
              key={item}
              onClick={() => onPageChange(item)}
              type="button"
            >
              {item}
            </button>
          ) : (
            <span aria-hidden="true" key={item}>
              …
            </span>
          ),
        )}
        <button
          aria-label="Next page"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={15} />
        </button>
      </div>
    </nav>
  );
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "end-ellipsis", totalPages] as const;
  }
  if (currentPage >= totalPages - 2) {
    return [
      1,
      "start-ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }
  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ] as const;
}

function CourseFoldersState({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="student-folder-state">
      <FolderOpen size={34} />
      <strong>{label}</strong>
      {action}
    </div>
  );
}
