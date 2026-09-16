import { Clock3, FolderTree, ShieldCheck } from "lucide-react";
import type { Folder } from "@repo/types";
import {
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
} from "../../../components/crud";
import { getFolderStatusTone } from "../../table/folderStatus";

export const FolderHierarchyDetails = ({ folder }: { folder: Folder }) => (
  <CrudDetailSection
    icon={<FolderTree color="#059669" size={15} />}
    title="Folder hierarchy"
  >
    <CrudDetailField
      icon={<FolderTree color="#059669" size={15} />}
      label="Parent folder"
      value={folder.parentFolderId ?? "Session-course root"}
    />
    <CrudDetailField
      icon={<Clock3 color="#059669" size={15} />}
      label="Sort order"
      value={folder.sortOrder}
    />
    <CrudDetailField
      icon={<ShieldCheck color="#059669" size={15} />}
      label="Status"
      value={
        <CrudBadge tone={getFolderStatusTone(folder.status)}>
          {folder.status}
        </CrudBadge>
      }
    />
  </CrudDetailSection>
);
