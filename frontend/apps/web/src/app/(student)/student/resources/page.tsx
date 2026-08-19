import { StudentResourcesPage } from "@/features/student/resources/StudentResourcesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  return <StudentResourcesPage initialSearch={search} />;
}
