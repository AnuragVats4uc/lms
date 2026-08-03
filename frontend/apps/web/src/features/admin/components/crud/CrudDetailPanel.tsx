"use client";

import { X } from "lucide-react";
import { Button, Text, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";
import type { ReactNode } from "react";

export interface CrudDetailPanelProps<Item> {
  getDisplayName: (item: Item) => string;
  item: Item | null;
  isLoading: boolean;
  onClose: () => void;
  renderDetails: (item: Item) => ReactNode;
}

export const CrudDetailPanel = <Item,>({
  getDisplayName,
  isLoading,
  item,
  onClose,
  renderDetails,
}: CrudDetailPanelProps<Item>) => {
  if (!item && !isLoading) {
    return null;
  }

  return (
    <AppCard
      background="#FFFFFF"
      borderColor="#E1E7F0"
      className="lms-organization-side-panel"
      p="$4"
      style={{
        borderRadius: 16,
        minWidth: 300,
      }}
    >
      {isLoading || !item ? (
        <YStack gap="$3">
          <XStack className="lms-skeleton" height={56} width={56} />
          <XStack className="lms-skeleton" height={18} width={180} />
          <XStack className="lms-skeleton" height={120} width="100%" />
        </YStack>
      ) : (
        <YStack gap="$4">
          <XStack gap="$3" style={{ alignItems: "flex-start" }}>
            <YStack flex={1} gap="$1" minW={0}>
              <Text
                color="#0F1D3A"
                fontSize="$label"
                fontWeight="$heading"
                numberOfLines={2}
              >
                {getDisplayName(item)}
              </Text>
              <Text color="#52627A" fontSize="$caption">
                Details
              </Text>
            </YStack>
            <Button
              aria-label="Close details"
              background="#FFFFFF"
              borderColor="#D8E1EC"
              borderWidth={1}
              height={32}
              onPress={onClose}
              rounded="$3"
              width={32}
            >
              <X aria-hidden="true" color="#0F1D3A" size={15} />
            </Button>
          </XStack>
          {renderDetails(item)}
        </YStack>
      )}
    </AppCard>
  );
};
