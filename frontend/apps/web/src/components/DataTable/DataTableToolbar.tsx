"use client";

import { memo, useEffect, useState } from "react";
import { Download, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Button, Input, Text, XStack, YStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import { DataTableFilters } from "./DataTableFilters";
import type {
  DataTableBulkAction,
  DataTableFilter,
  DataTableSearchConfig,
  DataTableToolbarAction,
} from "./types";

interface DataTableToolbarProps<TData> {
  bulkActions?: DataTableBulkAction<TData>[];
  filters: DataTableFilter<TData>[];
  loading?: boolean;
  onExport?: () => void;
  onRefresh?: () => void;
  searchConfig?: DataTableSearchConfig;
  searchValue: string;
  selectedRows: TData[];
  setFilterValue: (id: string, value: unknown) => void;
  setSearchValue: (value: string) => void;
  toolbarActions?: DataTableToolbarAction[];
}

const DataTableToolbarComponent = <TData,>({
  bulkActions = [],
  filters,
  loading,
  onExport,
  onRefresh,
  searchConfig,
  searchValue,
  selectedRows,
  setFilterValue,
  setSearchValue,
  toolbarActions = [],
}: DataTableToolbarProps<TData>) => {
  const [draftSearch, setDraftSearch] = useState(searchValue);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDraftSearch(searchValue), 0);
    return () => window.clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSearchValue(draftSearch),
      searchConfig?.debounceMs ?? 300,
    );

    return () => window.clearTimeout(timeout);
  }, [draftSearch, searchConfig?.debounceMs, setSearchValue]);

  const hasBulkSelection = selectedRows.length > 0;

  return (
    <YStack gap="$3">
      <XStack
        className="lms-data-table-toolbar"
        gap="$3"
        justify="space-between"
        flexDirection="column"
        minW={0}
      >
        {searchConfig?.enabled === false ? null : (
          <XStack
            className="lms-data-table-search"
            gap="$3"
            px="$3"
            background="#FCFCFD"
            borderColor={DATA_TABLE_COLORS.border}
            borderWidth={1}
            maxW={520}
            minH={44}
            minW={240}
          >
            <Search
              aria-hidden="true"
              color={DATA_TABLE_COLORS.muted}
              size={18}
            />
            <Input
              aria-label="Search table"
              background="transparent"
              borderWidth={0}
              disabled={loading}
              flex={1}
              height={38}
              onChangeText={setDraftSearch}
              p={0}
              placeholder={searchConfig?.placeholder ?? "Search..."}
              placeholderTextColor={DATA_TABLE_COLORS.muted as never}
              value={draftSearch}
            />
          </XStack>
        )}

        <XStack
          className="lms-data-table-toolbar-actions"
          gap="$2"
          flexWrap="wrap"
          justify="flex-start"
        >
          {hasBulkSelection
            ? bulkActions.map((action) => (
                <Button
                  aria-label={action.label}
                  background={
                    action.destructive ? "#FFFFFF" : DATA_TABLE_COLORS.green
                  }
                  borderColor={
                    action.destructive
                      ? DATA_TABLE_COLORS.red
                      : DATA_TABLE_COLORS.green
                  }
                  borderWidth={1}
                  disabled={loading || action.disabled}
                  height={40}
                  key={action.id}
                  onPress={() => action.onAction(selectedRows)}
                  rounded="$3"
                >
                  {action.icon}
                  <Button.Text
                    color={
                      action.destructive ? DATA_TABLE_COLORS.red : "#FFFFFF"
                    }
                    fontSize="$caption"
                    fontWeight="$button"
                  >
                    {action.label}
                  </Button.Text>
                </Button>
              ))
            : null}

          {filters.length ? (
            <Button
              aria-label="Filters"
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              rounded="$3"
            >
              <SlidersHorizontal
                aria-hidden="true"
                color={DATA_TABLE_COLORS.text}
                size={16}
              />
              <Button.Text fontSize="$caption" fontWeight="$button">
                Filters
              </Button.Text>
            </Button>
          ) : null}

          {onRefresh ? (
            <Button
              aria-label="Refresh"
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              onPress={onRefresh}
              rounded="$3"
            >
              <RefreshCw
                aria-hidden="true"
                color={DATA_TABLE_COLORS.text}
                size={16}
              />
            </Button>
          ) : null}

          {onExport ? (
            <Button
              aria-label="Export"
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              onPress={onExport}
              rounded="$3"
            >
              <Download
                aria-hidden="true"
                color={DATA_TABLE_COLORS.text}
                size={16}
              />
              <Button.Text fontSize="$caption" fontWeight="$button">
                Export
              </Button.Text>
            </Button>
          ) : null}

          {toolbarActions.map((action) => (
            <Button
              aria-label={action.label}
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              key={action.id}
              onPress={action.onPress}
              rounded="$3"
            >
              {action.icon}
              <Button.Text fontSize="$caption" fontWeight="$button">
                {action.label}
              </Button.Text>
            </Button>
          ))}
        </XStack>
      </XStack>

      <DataTableFilters filters={filters} setFilterValue={setFilterValue} />

      {hasBulkSelection ? (
        <Text
          color={DATA_TABLE_COLORS.muted}
          fontSize="$caption"
          lineHeight="$caption"
        >
          {selectedRows.length} selected
        </Text>
      ) : null}
    </YStack>
  );
};

export const DataTableToolbar = memo(
  DataTableToolbarComponent,
) as typeof DataTableToolbarComponent;
