import { RESOURCE_TYPE_IDS } from "@repo/types";

import { StudentResourcesPage } from "@/features/student/resources/StudentResourcesPage";

export default function Page() {
  return (
    <StudentResourcesPage
      initialResourceTypeId={RESOURCE_TYPE_IDS.EXAM}
      title="Exams"
      subtitle="Open exams assigned through your enrolled courses and continue active attempts."
    />
  );
}
