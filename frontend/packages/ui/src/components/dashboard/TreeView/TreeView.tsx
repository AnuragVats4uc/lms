"use client";

import { memo } from "react";
import { YStack } from "tamagui";

import { TreeNode } from "../TreeNode";
import type { TreeViewProps } from "./types";

export const TreeView = memo(function TreeView({
  items,
  onSelect,
  onToggle,
}: TreeViewProps) {
  return (
    <YStack gap="$1" style={{ color: "#435266" }}>
      {items.map((item) => (
        <TreeNode
          item={item}
          key={item.id}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </YStack>
  );
});
