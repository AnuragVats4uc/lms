import { notFound } from "next/navigation";

import { StudentExamReportPage } from "@/features/student/exams/StudentExamReportPage";

export default async function Page({
  params,
}: {
  params: Promise<{ attemptId: string; attemptUuid: string }>;
}) {
  const { attemptId: rawAttemptId, attemptUuid } = await params;
  const attemptId = Number(rawAttemptId);
  if (!Number.isSafeInteger(attemptId) || attemptId <= 0) notFound();
  return (
    <StudentExamReportPage attemptId={attemptId} attemptUuid={attemptUuid} />
  );
}
