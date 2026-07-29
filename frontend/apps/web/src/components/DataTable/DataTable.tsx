"use client";

import { memo, useMemo } from "react";
import { MoreVertical } from "lucide-react";
import { Button, ScrollView, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";

import { DATA_TABLE_COLORS } from "./constants";
import { DataTableBody } from "./DataTableBody";
import { DataTableEmpty } from "./DataTableEmpty";
import { DataTableError } from "./DataTableError";
import { DataTableHeader } from "./DataTableHeader";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableSkeleton } from "./DataTableSkeleton";
import { DataTableToolbar } from "./DataTableToolbar";
import { useDataTable } from "./hooks/useDataTable";
import type {
  DataTableColumn,
  DataTableProps,
  DataTableSearchConfig,
} from "./types";
import { defaultGetRowId } from "./utils";

function getColumnSize<TData>(column: DataTableColumn<TData>) {
  if (typeof column.width === "number") {
    return `${column.width}px`;
  }

  if (typeof column.width === "string") {
    return column.width;
  }

  return `minmax(${column.minWidth ?? 148}px, 1fr)`;
}

function DataTableComponent<TData>(props: DataTableProps<TData>) {
  const {
    actions,
    bulkActions,
    emptyState,
    error,
    footer,
    getRowExpandedContent,
    getRowId = defaultGetRowId,
    loading,
    onExport,
    onRefresh,
    onRowClick,
    pagination,
    renderFooter,
    renderToolbar,
    searchable = true,
    selectable,
    stickyFirstColumn,
    stickyHeader = true,
    toolbarActions,
  } = props;

  const table = useDataTable(props);
  const { state } = table;
  const searchConfig: DataTableSearchConfig =
    typeof searchable === "object"
      ? searchable
      : { enabled: Boolean(searchable) };

  const actionColumn = useMemo<DataTableColumn<TData> | null>(() => {
    if (!actions?.length) {
      return null;
    }

    return {
      align: "center",
      cell: ({ row }) => (
        <XStack gap="$1" style={{ justifyContent: "center" }}>
          {actions.length === 1 ? (
            <Button
              aria-label={actions[0]?.label ?? "Row action"}
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={34}
              onPress={() => actions[0]?.onAction(row)}
              px="$3"
              rounded="$3"
            >
              {actions[0]?.icon}
              <Button.Text fontSize="$caption" fontWeight="$label">
                {actions[0]?.label}
              </Button.Text>
            </Button>
          ) : (
            <Button
              aria-label="Open row actions"
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={34}
              rounded="$3"
              width={34}
            >
              <MoreVertical
                aria-hidden="true"
                color={DATA_TABLE_COLORS.text}
                size={16}
              />
            </Button>
          )}
        </XStack>
      ),
      header: "Actions",
      id: "__actions",
      width: 92,
    };
  }, [actions]);

  const visibleColumns = useMemo(
    () =>
      actionColumn
        ? [...state.visibleColumns, actionColumn]
        : state.visibleColumns,
    [actionColumn, state.visibleColumns],
  );

  const gridTemplateColumns = useMemo(() => {
    const selectionColumn = selectable ? "48px " : "";

    return `${selectionColumn}${visibleColumns.map(getColumnSize).join(" ")}`;
  }, [selectable, visibleColumns]);

  const renderContext = {
    clearSelection: table.clearSelection,
    setFilterValue: table.setFilterValue,
    setPage: table.setPage,
    setPageSize: table.setPageSize,
    setSearchValue: table.setSearchValue,
    state,
    toggleAllPageRows: table.toggleAllPageRows,
    toggleRowSelected: table.toggleRowSelected,
    toggleSort: table.toggleSort,
  };

  return (
    <AppCard
      background={DATA_TABLE_COLORS.background}
      borderColor={DATA_TABLE_COLORS.border}
      className="lms-data-table-card"
      p={0}
      style={{
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <YStack>
        {renderToolbar ? (
          renderToolbar(renderContext)
        ) : (
          <YStack p="$4">
            <DataTableToolbar
              bulkActions={bulkActions}
              filters={state.filters}
              loading={loading}
              onExport={onExport}
              onRefresh={onRefresh}
              searchConfig={searchConfig}
              searchValue={state.searchValue}
              selectedRows={state.selectedRows}
              setFilterValue={table.setFilterValue}
              setSearchValue={table.setSearchValue}
              toolbarActions={toolbarActions}
            />
          </YStack>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={{ maxWidth: "100%" }}
        >
          <YStack
            role="table"
            style={{
              minWidth: "100%",
              width: "max-content",
            }}
          >
            <DataTableHeader
              allPageRowsSelected={state.allPageRowsSelected}
              columns={visibleColumns}
              gridTemplateColumns={gridTemplateColumns}
              selectable={selectable}
              somePageRowsSelected={state.somePageRowsSelected}
              sorting={state.sorting}
              stickyFirstColumn={stickyFirstColumn}
              stickyHeader={stickyHeader}
              toggleAllPageRows={table.toggleAllPageRows}
              toggleSort={table.toggleSort}
            />

            {loading ? (
              <DataTableSkeleton
                columnCount={visibleColumns.length + (selectable ? 1 : 0)}
                gridTemplateColumns={gridTemplateColumns}
              />
            ) : error ? (
              <DataTableError error={error} />
            ) : state.rows.length ? (
              <DataTableBody
                columns={visibleColumns}
                getRowExpandedContent={getRowExpandedContent}
                getRowId={getRowId}
                gridTemplateColumns={gridTemplateColumns}
                onRowClick={onRowClick}
                rows={state.rows}
                selectable={selectable}
                selectedIds={state.selectedIds}
                stickyFirstColumn={stickyFirstColumn}
                toggleRowSelected={table.toggleRowSelected}
              />
            ) : (
              <DataTableEmpty emptyState={emptyState} />
            )}
          </YStack>
        </ScrollView>

        {footer ? (
          <YStack p="$4">{footer}</YStack>
        ) : renderFooter ? (
          renderFooter(renderContext)
        ) : null}

        <DataTablePagination
          page={state.page}
          pageSize={state.pageSize}
          pageSizeOptions={table.pageSizeOptions}
          pagination={pagination}
          setPage={table.setPage}
          setPageSize={table.setPageSize}
          total={state.total}
          totalPages={state.totalPages}
        />
      </YStack>
    </AppCard>
  );
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
