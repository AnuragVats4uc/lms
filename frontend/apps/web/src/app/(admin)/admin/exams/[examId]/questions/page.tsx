import { ExamWiseQuestionsPage } from "@/features/admin/exams/ExamWiseQuestionsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <ExamWiseQuestionsPage examId={Number(examId)} />;
}
