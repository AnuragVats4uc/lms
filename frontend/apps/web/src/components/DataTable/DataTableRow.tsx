"use client";

import { memo, type ReactNode } from "react";
import { Button, XStack, YStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import { DataTableCell } from "./DataTableCell";
import type { DataTableColumn, DataTableRowId } from "./types";
import { getRowValue } from "./utils";

interface DataTableRowProps<TData> {
  columns: DataTableColumn<TData>[];
  getRowExpandedContent?: (row: TData) => ReactNode;
  gridTemplateColumns: string;
  isExpanded?: boolean;
  isSelected?: boolean;
  onRowClick?: (row: TData) => void;
  onToggleSelected: () => void;
  row: TData;
  rowIndex: number;
  selectable?: boolean;
  stickyFirstColumn?: boolean;
}

function DataTableRowComponent<TData>({
  columns,
  getRowExpandedContent,
  gridTemplateColumns,
  isExpanded,
  isSelected,
  onRowClick,
  onToggleSelected,
  row,
  rowIndex,
  selectable,
  stickyFirstColumn,
}: DataTableRowProps<TData>) {
  return (
    <YStack role="rowgroup">
      <XStack
        hoverStyle={{ background: DATA_TABLE_COLORS.hover }}
        onPress={() => onRowClick?.(row)}
        role="row"
        style={{
          borderBottomColor: DATA_TABLE_COLORS.divider,
          borderBottomWidth: 1,
          cursor: onRowClick ? "pointer" : "default",
          display: "grid",
          gridTemplateColumns,
          minWidth: "max-content",
          transition: "background-color 160ms ease",
          width: "100%",
        }}
      >
        {selectable ? (
          <DataTableCell sticky={stickyFirstColumn} width={48}>
            <Button
              aria-checked={Boolean(isSelected)}
              aria-label="Select row"
              background={isSelected ? DATA_TABLE_COLORS.green : "#FFFFFF"}
              borderColor={
                isSelected ? DATA_TABLE_COLORS.green : DATA_TABLE_COLORS.border
              }
              borderWidth={1}
              height={18}
              onPress={onToggleSelected}
              p={0}
              role="checkbox"
              rounded="$2"
              width={18}
            />
          </DataTableCell>
        ) : null}

        {columns.map((column, columnIndex) => {
          const value = getRowValue(row, column);
          const stickyEnd = column.meta?.stickyEnd === true;
          const sticky = stickyEnd || (stickyFirstColumn && columnIndex === 0);

          return (
            <DataTableCell
              align={column.align}
              key={column.id}
              sticky={sticky}
              stickyOffset={stickyEnd ? 0 : selectable ? 48 : 0}
              stickySide={stickyEnd ? "right" : "left"}
              width={column.width}
            >
              {column.cell
                ? column.cell({ column, row, rowIndex, value })
                : String(value ?? "-")}
            </DataTableCell>
          );
        })}
      </XStack>
      {isExpanded && getRowExpandedContent ? (
        <YStack
          p="$4"
          style={{
            backgroundColor: DATA_TABLE_COLORS.subtle,
            borderBottomColor: DATA_TABLE_COLORS.divider,
            borderBottomWidth: 1,
          }}
        >
          {getRowExpandedContent(row)}
        </YStack>
      ) : null}
    </YStack>
  );
}

export const DataTableRow = memo(
  DataTableRowComponent,
) as typeof DataTableRowComponent;
