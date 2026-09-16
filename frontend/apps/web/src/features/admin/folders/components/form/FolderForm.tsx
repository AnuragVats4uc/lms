import type { Folder } from "@repo/types";
import { Text, YStack } from "@repo/ui";
import type { ResourceFormContext } from "../../../components/crud/CrudManagementPage";
import type { FolderForm as FolderFormValues } from "../../types";
import { FolderAppearanceFields } from "./FolderAppearanceFields";
import { FolderHierarchyFields } from "./FolderHierarchyFields";
import { FolderStatusFields } from "./FolderStatusFields";

export const FolderForm = ({
  error,
  folders,
}: ResourceFormContext<FolderFormValues> & { folders: Folder[] }) => (
  <YStack className="lms-organization-form" gap="$3">
    {error ? (
      <Text color="#B42318" fontSize="$caption">
        {error}
      </Text>
    ) : null}
    <FolderHierarchyFields folders={folders} />
    <FolderStatusFields />
    <FolderAppearanceFields />
  </YStack>
);
