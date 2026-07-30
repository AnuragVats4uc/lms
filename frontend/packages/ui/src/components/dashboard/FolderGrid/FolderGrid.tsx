"use client";

import { memo } from "react";
import { YStack } from "tamagui";

import { FolderCard } from "../FolderCard";
import type { FolderGridProps } from "./types";

export const ResourceFolderGrid = memo(function ResourceFolderGrid({
  folders,
}: FolderGridProps) {
  return (
    <YStack
      className="lms-dashboard-folder-grid"
      gap="$4"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        minWidth: 0,
      }}
    >
      {folders.map((folder) => (
        <FolderCard key={folder.title} minW={0} {...folder} />
      ))}
    </YStack>
  );
});
