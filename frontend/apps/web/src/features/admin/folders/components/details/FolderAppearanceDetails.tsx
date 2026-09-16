import { FolderTree, Palette, ShieldCheck } from "lucide-react";
import type { Folder } from "@repo/types";
import { CrudDetailField, CrudDetailSection } from "../../../components/crud";

export const FolderAppearanceDetails = ({ folder }: { folder: Folder }) => (
  <CrudDetailSection
    icon={<Palette color="#059669" size={15} />}
    title="Appearance"
  >
    <CrudDetailField
      icon={<FolderTree color="#059669" size={15} />}
      label="Icon"
      value={folder.icon}
    />
    <CrudDetailField
      icon={<Palette color="#059669" size={15} />}
      label="Color"
      value={folder.color}
    />
    <CrudDetailField
      icon={<ShieldCheck color="#059669" size={15} />}
      label="Active record"
      value={folder.isActive ? "Yes" : "No"}
    />
  </CrudDetailSection>
);
