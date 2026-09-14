import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { studentsApi } from "@repo/api";
import type {
  StudentVideoResourceDetail,
  UpdateStudentVideoProgressRequest,
} from "@repo/types";

export const useStudentVideoLesson = (resourceId: number) => {
  const queryClient = useQueryClient();
  const detailQueryKey = ["student-video-resource", resourceId] as const;
  const detailQuery = useQuery({
    queryFn: () => studentsApi.findMyVideoResource(resourceId),
    queryKey: detailQueryKey,
    staleTime: 30_000,
  });
  const progressMutation = useMutation({
    mutationFn: (payload: UpdateStudentVideoProgressRequest) =>
      studentsApi.updateMyVideoProgress(resourceId, payload),
    onSuccess: (progress) => {
      queryClient.setQueryData<StudentVideoResourceDetail>(
        detailQueryKey,
        (current) => (current ? { ...current, progress } : current),
      );
      void queryClient.invalidateQueries({ queryKey: ["student-courses"] });
    },
  });
  const saveProgress = useCallback(
    (payload: UpdateStudentVideoProgressRequest) => {
      progressMutation.mutate(payload);
    },
    [progressMutation],
  );

  return { detailQuery, saveProgress };
};
