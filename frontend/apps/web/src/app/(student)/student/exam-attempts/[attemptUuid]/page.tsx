import { StudentExamAttemptPage } from "@/features/student/exams/StudentExamAttemptPage";

export default async function Page({ params }: { params: Promise<{ attemptUuid: string }> }) {
  const { attemptUuid } = await params;
  return <StudentExamAttemptPage attemptUuid={attemptUuid} />;
}
