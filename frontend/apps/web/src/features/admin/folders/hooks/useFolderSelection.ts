import { useState } from "react";
import type { Folder } from "@repo/types";

export const useFolderSelection = () => {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const clearSelection = () => {
    setSelectedFolder(null);
    setSelectedFolderId(null);
  };
  return {
    clearSelection,
    selectedFolder,
    selectedFolderId,
    setSelectedFolder,
    setSelectedFolderId,
  };
};
