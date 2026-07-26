"use client";

import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { XStack, YStack, styled } from "tamagui";

import { AppCard, AppText } from "../../primitives";
import type { BreadcrumbNavigationProps } from "./types";

const BreadcrumbCard = styled(AppCard, {
  background: "#FFFFFF",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  height: 58,
  p: "$3",
  rounded: "$4",
  width: "100%",

  variants: {
    active: {
      true: {
        background: "#EAF7F2",
        borderColor: "#10B981",
      },
    },
  } as const,
});

export const BreadcrumbNavigation = memo(
  function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
    return (
      <XStack
        gap="$4"
        style={{ alignItems: "center", flexWrap: "wrap", minWidth: 0 }}
      >
        {items.map((item, index) => {
          const isActive = index === items.length - 1;

          return (
          <XStack
            gap="$4"
            key={item.label}
            style={{
              alignItems: "center",
              flex: "1 1 190px",
              maxWidth: 252,
              minWidth: 0,
            }}
          >
            <BreadcrumbCard active={isActive}>
              <XStack
                gap="$3"
                style={{
                  alignItems: "center",
                  color: isActive ? "#059669" : "#52627A",
                }}
              >
                {item.icon}
                <YStack>
                  {item.subtitle ? (
                    <AppText
                      color={isActive ? "#047857" : "#52627A"}
                      fontSize={10}
                      lineHeight={12}
                    >
                      {item.subtitle}
                    </AppText>
                  ) : null}
                  <AppText
                    color={isActive ? "#047857" : "#0F1D3A"}
                    fontSize="$caption"
                    fontWeight="$button"
                    lineHeight="$caption"
                  >
                    {item.label}
                  </AppText>
                </YStack>
              </XStack>
            </BreadcrumbCard>
            {index < items.length - 1 ? (
              <ChevronRight aria-hidden="true" color="#0F1D3A" size={18} />
            ) : null}
          </XStack>
          );
        })}
      </XStack>
    );
  }
);
