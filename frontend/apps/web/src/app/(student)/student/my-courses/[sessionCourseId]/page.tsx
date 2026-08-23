import { StudentCourseFoldersPage } from "@/features/student/courses/StudentCourseFoldersPage";

export default async function Page({
  params,
}: {
  params: Promise<{ sessionCourseId: string }>;
}) {
  const { sessionCourseId } = await params;
  return <StudentCourseFoldersPage sessionCourseId={Number(sessionCourseId)} />;
}
