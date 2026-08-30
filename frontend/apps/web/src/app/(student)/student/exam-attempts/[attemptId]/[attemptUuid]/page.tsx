import { notFound } from "next/navigation";

import { StudentExamAttemptPage } from "@/features/student/exams/StudentExamAttemptPage";

export default async function Page({
  params,
}: {
  params: Promise<{ attemptId: string; attemptUuid: string }>;
}) {
  const { attemptId: rawAttemptId, attemptUuid } = await params;
  const attemptId = Number(rawAttemptId);
  if (!Number.isSafeInteger(attemptId) || attemptId <= 0) notFound();
  return (
    <StudentExamAttemptPage attemptId={attemptId} attemptUuid={attemptUuid} />
  );
}
