"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Text, XStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import type { DataTableAlign } from "./types";

interface DataTableCellProps {
  align?: DataTableAlign;
  children: ReactNode;
  className?: string;
  sticky?: boolean;
  stickyOffset?: number;
  stickySide?: "left" | "right";
  width?: number | string;
}

const alignmentMap: Record<DataTableAlign, CSSProperties["justifyContent"]> = {
  center: "center",
  left: "flex-start",
  right: "flex-end",
};

export const DataTableCell = memo(
  ({
    align = "left",
    children,
    className,
    sticky,
    stickyOffset = 0,
    stickySide = "left",
    width,
  }: DataTableCellProps) => {
    return (
      <XStack
        className={[
          className,
          sticky ? "lms-data-table-cell-sticky" : "",
          sticky && stickySide === "left" ? "is-sticky-left" : "",
          sticky && stickySide === "right" ? "is-sticky-right" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        px="$3"
        background={sticky ? DATA_TABLE_COLORS.background : undefined}
        minH={58}
        minW={0}
        position={sticky ? "sticky" : undefined}
        z={sticky ? 2 : undefined}
        style={{
          alignItems: "center",
          justifyContent: alignmentMap[align],
          left: sticky && stickySide === "left" ? stickyOffset : undefined,
          right: sticky && stickySide === "right" ? stickyOffset : undefined,
          width,
        }}
      >
        {typeof children === "string" || typeof children === "number" ? (
          <Text
            color={DATA_TABLE_COLORS.text}
            fontSize={11}
            lineHeight={15}
            numberOfLines={1}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </XStack>
    );
  },
);

DataTableCell.displayName = "DataTableCell";
