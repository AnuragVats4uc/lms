import { notFound } from "next/navigation";

import { StudentVideoLessonPage } from "@/features/student/video-lesson/StudentVideoLessonPage";

export default async function Page({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId: rawResourceId } = await params;
  const resourceId = Number(rawResourceId);

  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    notFound();
  }

  return <StudentVideoLessonPage resourceId={resourceId} />;
}
