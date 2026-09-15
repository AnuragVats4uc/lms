import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@repo/api";
import type { CourseStatus } from "@repo/types";

export const useAvailableCourses = () =>
  useQuery({
    queryFn: () =>
      coursesApi.findAll({
        limit: 100,
        page: 1,
        status: "ACTIVE" as CourseStatus,
      }),
    queryKey: ["admin", "session-course-courses"],
    staleTime: 60_000,
  });
