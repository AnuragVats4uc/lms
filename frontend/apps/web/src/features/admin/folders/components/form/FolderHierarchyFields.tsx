import type { Folder } from "@repo/types";
import { FormInput, XStack } from "@repo/ui";
import { CrudFormSelect } from "../../../components/crud";

export const FolderHierarchyFields = ({ folders }: { folders: Folder[] }) => (
  <XStack className="lms-organization-form-grid" gap="$3">
    <div className="lms-form-field">
      <FormInput autoFocus label="Name" name="name" placeholder="Physics" />
    </div>
    <div className="lms-form-field">
      <CrudFormSelect
        label="Parent folder"
        name="parentFolderId"
        options={folders.map((folder) => ({
          label: folder.name,
          value: String(folder.id),
        }))}
        placeholder="Session-course root"
      />
    </div>
  </XStack>
);
