import { CalendarDays, Clock3 } from "lucide-react";
import type { Folder } from "@repo/types";
import { CrudDetailField, CrudDetailSection } from "../../../components/crud";

export const FolderHistoryDetails = ({ folder }: { folder: Folder }) => (
  <CrudDetailSection
    icon={<CalendarDays color="#059669" size={15} />}
    title="Record history"
  >
    <CrudDetailField
      icon={<CalendarDays color="#059669" size={15} />}
      label="Created"
      value={new Date(folder.createdAt).toLocaleString()}
    />
    <CrudDetailField
      icon={<Clock3 color="#059669" size={15} />}
      label="Last updated"
      value={new Date(folder.updatedAt).toLocaleString()}
    />
  </CrudDetailSection>
);
