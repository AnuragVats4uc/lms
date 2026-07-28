"use client";

import { memo, type ReactNode } from "react";
import { YStack } from "@repo/ui";

import { DataTableRow } from "./DataTableRow";
import type { DataTableColumn, DataTableRowId } from "./types";

interface DataTableBodyProps<TData> {
  columns: DataTableColumn<TData>[];
  getRowExpandedContent?: (row: TData) => ReactNode;
  getRowId: (row: TData, index: number) => DataTableRowId;
  gridTemplateColumns: string;
  onRowClick?: (row: TData) => void;
  rows: TData[];
  selectable?: boolean;
  selectedIds: DataTableRowId[];
  stickyFirstColumn?: boolean;
  toggleRowSelected: (row: TData, index: number) => void;
}

function DataTableBodyComponent<TData>({
  columns,
  getRowExpandedContent,
  getRowId,
  gridTemplateColumns,
  onRowClick,
  rows,
  selectable,
  selectedIds,
  stickyFirstColumn,
  toggleRowSelected,
}: DataTableBodyProps<TData>) {
  return (
    <YStack role="rowgroup">
      {rows.map((row, rowIndex) => {
        const rowId = getRowId(row, rowIndex);

        return (
          <DataTableRow
            columns={columns}
            getRowExpandedContent={getRowExpandedContent}
            gridTemplateColumns={gridTemplateColumns}
            isSelected={selectedIds.includes(rowId)}
            key={rowId}
            onRowClick={onRowClick}
            onToggleSelected={() => toggleRowSelected(row, rowIndex)}
            row={row}
            rowIndex={rowIndex}
            selectable={selectable}
            stickyFirstColumn={stickyFirstColumn}
          />
        );
      })}
    </YStack>
  );
}

export const DataTableBody = memo(
  DataTableBodyComponent
) as typeof DataTableBodyComponent;
