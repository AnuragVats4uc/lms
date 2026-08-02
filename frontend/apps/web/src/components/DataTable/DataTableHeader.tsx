"use client";

import { memo } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button, Text, XStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import { DataTableCell } from "./DataTableCell";
import type { DataTableColumn, DataTableSort } from "./types";

interface DataTableHeaderProps<TData> {
  allPageRowsSelected: boolean;
  columns: DataTableColumn<TData>[];
  gridTemplateColumns: string;
  selectable?: boolean;
  somePageRowsSelected: boolean;
  sorting: DataTableSort[];
  stickyFirstColumn?: boolean;
  stickyHeader?: boolean;
  toggleAllPageRows: () => void;
  toggleSort: (columnId: string, multi?: boolean) => void;
}

const DataTableHeaderComponent = <TData,>({
  allPageRowsSelected,
  columns,
  gridTemplateColumns,
  selectable,
  somePageRowsSelected,
  sorting,
  stickyFirstColumn,
  stickyHeader = true,
  toggleAllPageRows,
  toggleSort,
}: DataTableHeaderProps<TData>) => {
  return (
    <XStack
      role="row"
      background={DATA_TABLE_COLORS.background}
      borderBottomColor={DATA_TABLE_COLORS.divider}
      borderBottomWidth={1}
      minW="max-content"
      position={stickyHeader ? "sticky" : undefined}
      start={stickyHeader ? 0 : undefined}
      width="100%"
      z={stickyHeader ? 5 : undefined}
      style={{
        display: "grid",
        gridTemplateColumns,
        top: stickyHeader ? 0 : undefined,
      }}
    >
      {selectable ? (
        <DataTableCell sticky={stickyFirstColumn} width={48}>
          <Button
            aria-checked={
              allPageRowsSelected
                ? true
                : somePageRowsSelected
                  ? "mixed"
                  : false
            }
            aria-label="Select all rows on this page"
            background={
              allPageRowsSelected ? DATA_TABLE_COLORS.green : "#FFFFFF"
            }
            borderColor={
              allPageRowsSelected
                ? DATA_TABLE_COLORS.green
                : DATA_TABLE_COLORS.border
            }
            borderWidth={1}
            height={18}
            onPress={toggleAllPageRows}
            p={0}
            role="checkbox"
            rounded="$2"
            width={18}
          />
        </DataTableCell>
      ) : null}

      {columns.map((column, index) => {
        const activeSort = sorting.find((item) => item.id === column.id);
        const SortIcon = activeSort
          ? activeSort.direction === "asc"
            ? ArrowUp
            : ArrowDown
          : ChevronsUpDown;
        const stickyEnd = column.meta?.stickyEnd === true;
        const sticky = stickyEnd || (stickyFirstColumn && index === 0);
        const header =
          column.headerCell?.({ column }) ??
          (typeof column.header === "function"
            ? column.header({ column })
            : column.header);

        return (
          <DataTableCell
            align={column.align}
            key={column.id}
            sticky={sticky}
            stickyOffset={stickyEnd ? 0 : selectable ? 48 : 0}
            stickySide={stickyEnd ? "right" : "left"}
            width={column.width}
          >
            <XStack
              gap="$2"
              justify={column.align === "right" ? "flex-end" : column.align === "center" ? "center" : "flex-start"}
              width="100%"
              style={{
                alignItems: "center",
              }}
            >
              <Text
                color={DATA_TABLE_COLORS.text}
                fontSize={11}
                fontWeight="$button"
                lineHeight={14}
                numberOfLines={1}
              >
                {header}
              </Text>
              {column.sortable ? (
                <Button
                  aria-label={`Sort by ${column.id}`}
                  chromeless
                  height={24}
                  onPress={() => toggleSort(column.id)}
                  p={0}
                  width={24}
                >
                  <SortIcon
                    aria-hidden="true"
                    color={
                      activeSort
                        ? DATA_TABLE_COLORS.green
                        : DATA_TABLE_COLORS.gray
                    }
                    size={13}
                  />
                </Button>
              ) : null}
            </XStack>
          </DataTableCell>
        );
      })}
    </XStack>
  );
};

export const DataTableHeader = memo(
  DataTableHeaderComponent,
) as typeof DataTableHeaderComponent;
