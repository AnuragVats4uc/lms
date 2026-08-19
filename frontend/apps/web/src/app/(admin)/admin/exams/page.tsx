import { ResourcesPage } from "@/features/admin/resources";
import { RESOURCE_TYPE_IDS } from "@repo/types";

export default function Page() {
  return <ResourcesPage resourceTypeId={RESOURCE_TYPE_IDS.EXAM} />;
}
