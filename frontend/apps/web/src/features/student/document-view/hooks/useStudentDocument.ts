import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { studentsApi } from "@repo/api";
import type { StudentResourceDetail } from "@repo/types";

export const useStudentDocument = (resourceId: number) => {
  const queryClient = useQueryClient();
  const accessRecordedRef = useRef(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const detailQueryKey = ["student-resource", resourceId] as const;

  const detailQuery = useQuery({
    queryFn: () => studentsApi.findMyResource(resourceId),
    queryKey: detailQueryKey,
    staleTime: 30_000,
  });
  const fileQuery = useQuery({
    enabled: detailQuery.data?.resourceType.code === "DOCUMENT",
    queryFn: () => studentsApi.findMyResourceFile(resourceId),
    queryKey: ["student-resource-file", resourceId],
    staleTime: Number.POSITIVE_INFINITY,
  });
  const accessMutation = useMutation({
    mutationFn: (totalPages: number) =>
      studentsApi.recordMyResourceAccess(resourceId, totalPages),
    onSuccess: (progress) => {
      queryClient.setQueryData<StudentResourceDetail>(
        detailQueryKey,
        (current) => (current ? { ...current, progress } : current),
      );
      void queryClient.invalidateQueries({ queryKey: ["student-courses"] });
    },
  });

  useEffect(() => {
    accessRecordedRef.current = false;
    setPageCount(null);
  }, [resourceId]);

  const refreshProgress = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: detailQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["student-courses"] });
  }, [detailQueryKey, queryClient]);

  const recordAccess = useCallback(
    (totalPages: number) => {
      setPageCount(totalPages);
      if (accessRecordedRef.current) return;

      accessRecordedRef.current = true;
      accessMutation.mutate(totalPages);
    },
    [accessMutation],
  );

  return {
    detailQuery,
    fileQuery,
    pageCount,
    recordAccess,
    refreshProgress,
  };
};
