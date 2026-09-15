import { FolderOpen, Plus } from "lucide-react";
import { Button, XStack } from "@repo/ui";
import { AppEmptyState } from "@repo/ui/primitives";

export const ResourceEmptyState = ({
  onAddFolder,
}: {
  onAddFolder?: () => void;
}) => (
  <AppEmptyState
    action={
      <Button
        aria-label="Add first folder"
        background="#059669"
        height={38}
        onPress={onAddFolder}
        px="$4"
        rounded="$3"
      >
        <Plus aria-hidden="true" color="#FFFFFF" size={15} />
        <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
          Add Folder
        </Button.Text>
      </Button>
    }
    description="Add a folder to organize notes, assignments, documents and other learning resources."
    icon={
      <XStack
        background="#ECFDF5"
        height={52}
        rounded="$10"
        style={{
          alignItems: "center",
          color: "#059669",
          justifyContent: "center",
        }}
        width={52}
      >
        <FolderOpen aria-hidden="true" size={26} strokeWidth={2.1} />
      </XStack>
    }
    title="No folders yet"
  />
);
