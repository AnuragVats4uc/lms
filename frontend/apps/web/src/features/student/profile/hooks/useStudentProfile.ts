import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ["student-profile"],
    queryFn: studentsApi.findMyProfile,
    staleTime: 60_000,
  });
};
