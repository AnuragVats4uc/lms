import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";

import { PAGE_SIZE } from "../constants";
import type { StudentCourseViewMode } from "../types";

export const useStudentCourses = () => {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState<StudentCourseViewMode>("cards");
  const selectedCategory = category === "ALL" ? undefined : category;

  const coursesQuery = useQuery({
    queryFn: () =>
      studentsApi.findMyCourses({
        category: selectedCategory,
        limit: PAGE_SIZE,
        page,
      }),
    queryKey: ["student-courses", page, selectedCategory],
    staleTime: 60_000,
  });

  const courses = coursesQuery.data?.items ?? [];
  const categoryOptions = [
    { label: "All Categories", value: "ALL" },
    ...(coursesQuery.data?.categories ?? []).map((item) => ({
      label: item,
      value: item,
    })),
  ];

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  return {
    category,
    categoryOptions,
    courses,
    coursesQuery,
    handleCategoryChange,
    page,
    setPage,
    setViewMode,
    viewMode,
  };
};
