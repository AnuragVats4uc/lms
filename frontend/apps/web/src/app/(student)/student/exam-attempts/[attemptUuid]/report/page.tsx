import { StudentExamReportPage } from "@/features/student/exams/StudentExamReportPage";

export default async function Page({ params }: { params: Promise<{ attemptUuid: string }> }) {
  const { attemptUuid } = await params;
  return <StudentExamReportPage attemptUuid={attemptUuid} />;
}
