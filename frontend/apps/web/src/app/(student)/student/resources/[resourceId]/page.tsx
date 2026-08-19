import { notFound } from "next/navigation";

import { StudentDocumentViewPage } from "@/features/student/document-view/StudentDocumentViewPage";

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

  return <StudentDocumentViewPage resourceId={resourceId} />;
}
