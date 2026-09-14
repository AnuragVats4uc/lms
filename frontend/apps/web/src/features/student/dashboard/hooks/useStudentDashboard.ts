import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";

export const useStudentDashboard = () =>
  useQuery({
    queryFn: studentsApi.findMyDashboard,
    queryKey: ["student-dashboard"],
    staleTime: 60_000,
  });
