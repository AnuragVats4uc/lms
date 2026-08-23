import { StudentExamResourcePage } from "@/features/student/resources/StudentExamResourcePage";

export default async function Page({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  return <StudentExamResourcePage resourceId={Number(resourceId)} />;
}
