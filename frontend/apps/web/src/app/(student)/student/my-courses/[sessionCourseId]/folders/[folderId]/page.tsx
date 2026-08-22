import { StudentFolderResourcesPage } from "@/features/student/resources/StudentFolderResourcesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ sessionCourseId: string; folderId: string }>;
}) {
  const { sessionCourseId, folderId } = await params;
  return (
    <StudentFolderResourcesPage
      sessionCourseId={Number(sessionCourseId)}
      folderId={Number(folderId)}
    />
  );
}
