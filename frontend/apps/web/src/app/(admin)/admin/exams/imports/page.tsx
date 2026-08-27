import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string | string[] }>;
}) {
  const rawTemplateId = (await searchParams).templateId;
  const parsedTemplateId = Number(
    Array.isArray(rawTemplateId) ? rawTemplateId[0] : rawTemplateId,
  );

  if (Number.isInteger(parsedTemplateId) && parsedTemplateId > 0) {
    redirect(
      `/admin/exams/templates/${parsedTemplateId}/builder#import-questions`,
    );
  }

  redirect("/admin/exams/templates");
}
