"use client";

import { ExamAccessDialog } from "./components/ExamAccessDialog";
import { ExamAvailabilityCard } from "./components/ExamAvailabilityCard";
import { ExamFolderBreadcrumb } from "./components/ExamFolderBreadcrumb";
import { ExamFolderHero } from "./components/ExamFolderHero";
import { ExamFolderStatsGrid } from "./components/ExamFolderStatsGrid";
import { ExamResourceState } from "./components/ExamResourceState";
import { ExamSectionsCard } from "./components/ExamSectionsCard";
import { useStudentExamResource } from "./hooks/useStudentExamResource";

export const StudentExamResourcePage = ({
  resourceId,
}: {
  resourceId: number;
}) => {
  const {
    accessDialogMessage,
    accessDialogOpen,
    closeAccessDialog,
    openAccessReason,
    openExam,
    query,
    startMutation,
  } = useStudentExamResource(resourceId);
  if (query.isLoading) return <ExamResourceState state="loading" />;
  if (query.isError || !query.data) {
    return (
      <ExamResourceState onRetry={() => void query.refetch()} state="error" />
    );
  }

  const data = query.data;

  return (
    <main className="student-folder-page">
      <ExamFolderBreadcrumb data={data} />
      <ExamFolderHero data={data} />
      <ExamFolderStatsGrid data={data} />
      <div className="student-exam-layout">
        <ExamSectionsCard sections={data.exam.sections} />
        <ExamAvailabilityCard
          data={data}
          onOpenExam={openExam}
          onOpenReason={openAccessReason}
          startError={startMutation.isError}
          startPending={startMutation.isPending}
        />
      </div>
      <ExamAccessDialog
        message={accessDialogMessage ?? data.exam.actionMessage}
        onClose={closeAccessDialog}
        open={accessDialogOpen}
        reason={data.exam.actionReason}
      />
    </main>
  );
};
