"use client";

import { memo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button, XStack, YStack, styled } from "tamagui";

import { AppText } from "../../primitives";
import type { TreeNodeProps } from "./types";

const TreeButton = styled(Button, {
  background: "transparent",
  height: 28,
  px: "$2",
  rounded: "$3",

  variants: {
    selected: {
      true: {
        background: "#E6F6EF",
      },
    },
  } as const,
});

export const TreeNode = memo(function TreeNode({
  item,
  level = 0,
  onSelect,
  onToggle,
}: TreeNodeProps) {
  const hasChildren = Boolean(item.children?.length);
  const ToggleIcon = item.expanded ? ChevronDown : ChevronRight;

  return (
    <YStack gap="$1">
      <TreeButton
        aria-label={item.label}
        onPress={() => onSelect?.(item.id)}
        selected={item.selected}
        style={{ justifyContent: "flex-start", width: "100%" }}
      >
        <XStack
          gap="$2"
          pl={level ? level * 16 : "$0"}
          style={{ alignItems: "center", color: item.selected ? "#059669" : "#435266" }}
        >
          {hasChildren ? (
            <Button
              chromeless
              height="$2"
              p={0}
              onPress={() => onToggle?.(item.id)}
              aria-label={`${item.expanded ? "Collapse" : "Expand"} ${item.label}`}
            >
              <ToggleIcon aria-hidden="true" size={14} />
            </Button>
          ) : (
            <ChevronRight aria-hidden="true" size={14} opacity={0.35} />
          )}
          {item.icon}
          <AppText
            fontSize="$caption"
            fontWeight={item.selected ? "$button" : "$label"}
            lineHeight="$caption"
            tone={item.selected ? "success" : "default"}
          >
            {item.label}
          </AppText>
        </XStack>
      </TreeButton>
      {item.expanded && item.children?.length ? (
        <YStack gap="$1">
          {item.children.map((child) => (
            <TreeNode
              item={child}
              key={child.id}
              level={level + 1}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
});
