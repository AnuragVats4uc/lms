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
  width?: number | string;
}

const alignmentMap: Record<DataTableAlign, CSSProperties["justifyContent"]> = {
  center: "center",
  left: "flex-start",
  right: "flex-end",
};

export const DataTableCell = memo(function DataTableCell({
  align = "left",
  children,
  className,
  sticky,
  width,
}: DataTableCellProps) {
  return (
    <XStack
      className={className}
      px="$4"
      style={{
        alignItems: "center",
        backgroundColor: sticky ? DATA_TABLE_COLORS.background : undefined,
        justifyContent: alignmentMap[align],
        minHeight: 58,
        minWidth: 0,
        position: sticky ? "sticky" : undefined,
        left: sticky ? 0 : undefined,
        width,
        zIndex: sticky ? 2 : undefined,
      }}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          color={DATA_TABLE_COLORS.text}
          fontSize="$caption"
          lineHeight="$caption"
          numberOfLines={1}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </XStack>
  );
});
