import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";

import { readExamApiError } from "../utils/examAccess";

export function useStudentExamResource(resourceId: number) {
  const router = useRouter();
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessDialogMessage, setAccessDialogMessage] = useState<string | null>(
    null,
  );
  const query = useQuery({
    queryKey: ["student-exam-resource", resourceId],
    queryFn: () => studentsApi.findMyExamResource(resourceId),
    staleTime: 15_000,
  });
  const startMutation = useMutation({
    mutationFn: () => studentsApi.startMyExam(resourceId),
    onSuccess: (result) =>
      router.push(
        `/student/exam-attempts/${result.attemptId}/${result.attemptUuid}`,
      ),
    onError: (error) => {
      setAccessDialogMessage(readExamApiError(error));
      setAccessDialogOpen(true);
      void query.refetch();
    },
  });

  const openExam = () => {
    const data = query.data;
    if (!data) return;
    if (
      data.exam.action === "RESUME" &&
      data.exam.activeAttemptId &&
      data.exam.activeAttemptUuid
    ) {
      router.push(
        `/student/exam-attempts/${data.exam.activeAttemptId}/${data.exam.activeAttemptUuid}`,
      );
      return;
    }
    if (
      data.exam.action === "VIEW_RESULT" &&
      data.exam.latestAttemptId &&
      data.exam.latestAttemptUuid
    ) {
      router.push(
        `/student/exam-attempts/${data.exam.latestAttemptId}/${data.exam.latestAttemptUuid}/report`,
      );
      return;
    }
    if (data.exam.action === "UNAVAILABLE") {
      setAccessDialogMessage(null);
      setAccessDialogOpen(true);
      return;
    }
    startMutation.mutate();
  };

  return {
    accessDialogMessage,
    accessDialogOpen,
    closeAccessDialog: () => setAccessDialogOpen(false),
    openAccessReason: () => {
      setAccessDialogMessage(null);
      setAccessDialogOpen(true);
    },
    openExam,
    query,
    startMutation,
  };
}
