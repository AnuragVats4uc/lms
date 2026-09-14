"use client";

import { BookOpen } from "lucide-react";
import { AppEmptyState, YStack } from "@repo/ui";

import { StudentCoursesError } from "./components/StudentCoursesError";
import { StudentCoursesGrid } from "./components/StudentCoursesGrid";
import { StudentCoursesHeader } from "./components/StudentCoursesHeader";
import { StudentCoursesLoading } from "./components/StudentCoursesLoading";
import { StudentCoursesTable } from "./components/StudentCoursesTable";
import { useStudentCourses } from "./hooks/useStudentCourses";

const emptyStateDescription =
  "Your assigned courses will appear here once your enrollment is active.";

export const StudentCoursesPage = () => {
  const {
    category,
    categoryOptions,
    courses,
    coursesQuery,
    handleCategoryChange,
    page,
    setPage,
    setViewMode,
    viewMode,
  } = useStudentCourses();
  const total = coursesQuery.data?.meta.total ?? 0;
  const totalPages = coursesQuery.data?.meta.totalPages ?? 1;

  const renderContent = () => {
    if (coursesQuery.isLoading) {
      return <StudentCoursesLoading />;
    }

    if (coursesQuery.isError) {
      return (
        <StudentCoursesError onRetry={() => void coursesQuery.refetch()} />
      );
    }

    if (!courses.length) {
      return (
        <AppEmptyState
          description={emptyStateDescription}
          icon={<BookOpen color="#059669" size={30} strokeWidth={2.1} />}
          title="No courses assigned yet"
        />
      );
    }

    if (viewMode === "cards") {
      return (
        <StudentCoursesGrid
          courses={courses}
          onPageChange={setPage}
          page={page}
          total={total}
          totalPages={totalPages}
        />
      );
    }

    return (
      <StudentCoursesTable
        courses={courses}
        loading={coursesQuery.isLoading}
        onPageChange={setPage}
        page={page}
        total={total}
        totalPages={totalPages}
      />
    );
  };

  return (
    <YStack className="student-courses-page">
      <StudentCoursesHeader
        category={category}
        categoryOptions={categoryOptions}
        isFetching={coursesQuery.isFetching}
        onCategoryChange={handleCategoryChange}
        onViewModeChange={setViewMode}
        viewMode={viewMode}
      />
      {renderContent()}
    </YStack>
  );
};

export default StudentCoursesPage;
